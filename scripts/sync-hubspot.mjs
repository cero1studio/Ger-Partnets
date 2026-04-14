/**
 * sync-hubspot.mjs
 * ─────────────────────────────────────────────────────────
 * Objetivo: entender la estructura de HubSpot para conectar
 * la app con los deals del aliado que los registró.
 *
 * La etiqueta del aliado (ej: "carlos.mendoza") se almacena
 * como label nativo de HubSpot en el deal → propiedad hs_label.
 * Eso permite filtrar: "dame los deals con label = carlos.mendoza".
 *
 * Este script:
 *  1. Verifica que hs_label existe como propiedad en deals
 *  2. Lista los valores de etiqueta configurados
 *  3. Muestra el mapa de etapas del pipeline
 *  4. Hace una búsqueda de ejemplo por etiqueta (primer label que encuentre)
 *  5. Genera scripts/output/field-map.json con todo el mapeo
 *
 * Uso: node scripts/sync-hubspot.mjs [etiqueta]
 *   ej: node scripts/sync-hubspot.mjs carlos.mendoza
 * ─────────────────────────────────────────────────────────
 */

import { readFileSync, writeFileSync, mkdirSync } from "fs"
import { resolve, dirname } from "path"
import { fileURLToPath } from "url"

const __dirname = dirname(fileURLToPath(import.meta.url))
const OUTPUT_DIR = resolve(__dirname, "output")

// ─── Env ──────────────────────────────────────────────────

function loadEnv() {
  try {
    const content = readFileSync(resolve(process.cwd(), ".env.local"), "utf-8")
    for (const line of content.split("\n")) {
      const [key, ...rest] = line.split("=")
      if (key?.trim() && rest.length) process.env[key.trim()] = rest.join("=").trim()
    }
  } catch { /* usa vars del sistema */ }
}

loadEnv()

const TOKEN = process.env.HUBSPOT_TOKEN
if (!TOKEN) { console.error("❌  HUBSPOT_TOKEN no encontrado"); process.exit(1) }

const BASE   = "https://api.hubapi.com"
const HEADS  = { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" }

const TARGET_LABEL = process.argv[2] ?? null   // opcional: filtra por esta etiqueta

// ─── HTTP helpers ─────────────────────────────────────────

async function hs(path, params = {}) {
  const url = new URL(`${BASE}${path}`)
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  const res = await fetch(url.toString(), { headers: HEADS })
  if (!res.ok) throw new Error(`GET ${path} → ${res.status}: ${await res.text()}`)
  return res.json()
}

async function hsSearch(body) {
  const res = await fetch(`${BASE}/crm/v3/objects/deals/search`, {
    method: "POST", headers: HEADS, body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`SEARCH deals → ${res.status}: ${await res.text()}`)
  return res.json()
}

function sep(title) {
  console.log(`\n${"─".repeat(62)}`)
  console.log(`  ${title}`)
  console.log("─".repeat(62))
}

// ─── 1. Pipeline + etapas ─────────────────────────────────

async function getPipeline() {
  sep("PIPELINE Y ETAPAS")
  const data = await hs("/crm/v3/pipelines/deals")
  const pipelines = data.results ?? []
  const stageMap = {}

  for (const p of pipelines) {
    console.log(`\n  Pipeline: "${p.label}"  (id: ${p.id})`)
    const stages = [...(p.stages ?? [])].sort((a, b) => a.displayOrder - b.displayOrder)
    for (const s of stages) {
      stageMap[s.id] = s.label
      console.log(`    [${String(s.displayOrder).padStart(2)}] id: ${s.id.padEnd(30)} "${s.label}"`)
    }
  }
  return { pipelines, stageMap }
}

// ─── 2. Deal Tags nativos (hs_tag_ids) ───────────────────

async function getTagsProperty() {
  sep("DEAL TAGS NATIVOS (hs_tag_ids) — etiquetas del aliado")

  const [tagProp, allProps] = await Promise.all([
    hs("/crm/v3/properties/deals/hs_tag_ids").catch(() => null),
    hs("/crm/v3/properties/deals"),
  ])

  // Mostrar también etiquetas_de_lead_crm (campo custom del equipo GER)
  const leadCrm = (allProps.results ?? []).find(p => p.name === "etiquetas_de_lead_crm")
  if (leadCrm) {
    console.log(`\n  ℹ️  etiquetas_de_lead_crm → "${leadCrm.label}" (${leadCrm.type})`)
    console.log(`     Son razones de pérdida/estancamiento — NO identifica al aliado.`)
    const opts = leadCrm.options ?? []
    opts.forEach(o => console.log(`       • "${o.value}"`))
  }

  if (!tagProp) {
    console.log("\n  ⚠️  hs_tag_ids no encontrado.")
    return null
  }

  console.log(`\n  ✔  hs_tag_ids → "${tagProp.label}" (${tagProp.type} / ${tagProp.fieldType})`)
  console.log(`     Este es el campo correcto: Deal Tags NATIVOS de HubSpot.`)

  const tags = tagProp.options ?? []
  if (tags.length) {
    console.log(`\n  Tags configurados (${tags.length}):`)
    for (const t of tags)
      console.log(`    • id: ${t.value.padEnd(20)}  label: "${t.label}"`)
  } else {
    console.log(`\n  ⚠️  Sin tags creados todavía.`)
    console.log(`     Hay que crear un tag por aliado en:`)
    console.log(`     HubSpot → Settings → Properties → Deals → hs_tag_ids`)
    console.log(`     O via API: POST /crm/v3/properties/deals/hs_tag_ids (add option)`)
    console.log(`\n  Ejemplo de tags a crear:`)
    console.log(`    • "carlos.mendoza"`)
    console.log(`    • "patricia.lopez"`)
    console.log(`    • (uno por cada aliado que se registre en la app)`)
  }

  return tagProp
}

// ─── 3. Propiedades de contactos relevantes ───────────────

async function getContactProps() {
  sep("PROPIEDADES DE CONTACTOS (campos del perfilamiento)")
  const data = await hs("/crm/v3/properties/contacts")
  const all  = data.results ?? []

  const wanted = [
    "firstname","lastname","email","phone","mobilephone",
    "city","country",
    // custom posibles
    "nacionalidad","programa","tuvo_visa","tipo_visa",
    "puede_cubrir_costos","profesion","nivel_escolaridad","nucleo_familiar",
  ]

  const found = []
  const missing = []

  for (const name of wanted) {
    const p = all.find(x => x.name === name)
    if (p) {
      found.push(p)
      console.log(`  ✔  ${name.padEnd(35)} (${p.type})  "${p.label}"`)
    } else {
      missing.push(name)
    }
  }

  if (missing.length) {
    console.log(`\n  ⚠️  Estas propiedades NO existen aún en contactos:`)
    for (const m of missing)
      console.log(`       • ${m}  ← hay que crearla en HubSpot si se quiere persistir`)
  }

  return { found, missing }
}

// ─── 4. Búsqueda de deals por etiqueta ────────────────────

async function searchDealsByLabel(labelValue) {
  sep(`DEALS CON ETIQUETA = "${labelValue}"  (muestra de 5)`)

  const body = {
    filterGroups: [{
      filters: [{
        propertyName: "hs_label",
        operator: "EQ",
        value: labelValue,
      }],
    }],
    properties: [
      "dealname","dealstage","pipeline","hs_label",
      "hubspot_owner_id","createdate","closedate","amount","description",
    ],
    associations: ["contacts"],
    limit: 5,
  }

  const data = await hsSearch(body)
  const deals = data.results ?? []

  if (!deals.length) {
    console.log(`\n  (Ningún deal tiene la etiqueta "${labelValue}")`)
    return []
  }

  for (const d of deals) {
    const p = d.properties
    console.log(`\n  🎯 Deal ${d.id}`)
    console.log(`     dealname:   ${p.dealname ?? "—"}`)
    console.log(`     dealstage:  ${p.dealstage ?? "—"}`)
    console.log(`     hs_label:   ${p.hs_label ?? "—"}`)
    console.log(`     createdate: ${p.createdate ?? "—"}`)
    const contacts = d.associations?.contacts?.results ?? []
    if (contacts.length)
      console.log(`     contactos:  ${contacts.map(c => c.id).join(", ")}`)
  }

  return deals
}

// ─── 5. Generar field-map.json ────────────────────────────

function writeFieldMap({ pipelines, stageMap, labelProp, contactProps }) {
  mkdirSync(OUTPUT_DIR, { recursive: true })
  const path = resolve(OUTPUT_DIR, "field-map.json")

  const map = {
    _readme: [
      "Mapeo app ↔ HubSpot para el Portal de Aliados.",
      "La etiqueta del aliado (hs_label en el deal) es la clave de filtrado.",
      "Ejemplo de query: buscar deals donde hs_label = 'carlos.mendoza'",
    ].join(" "),

    filtrado: {
      campo:      "hs_tag_ids",
      objeto:     "deal",
      tipo:       "Deal Tags — etiqueta nativa de HubSpot (enumeration/checkbox)",
      descripcion:"Tag que identifica qué aliado registró el lead desde la app.",
      ejemplo:    "carlos.mendoza",
      setup: [
        "1. Crear un tag por aliado en HubSpot Settings → Properties → Deals → Deal Tags (hs_tag_ids)",
        "2. Al crear el deal desde la app → incluir hs_tag_ids: [tagId] del aliado logueado",
        "3. Al leer → filtrar con operador EQ o CONTAINS_TOKEN por el tag del usuario",
      ],
      apiCrearDeal: {
        endpoint: "POST /crm/v3/objects/deals",
        body: {
          properties: {
            dealname: "Nombre del candidato",
            dealstage: "appointmentscheduled",
            pipeline: "default",
            hs_tag_ids: "{tagId_del_aliado}",
          },
          associations: [{ to: { id: "{contactId}" }, types: [{ associationCategory: "HUBSPOT_DEFINED", associationTypeId: 3 }] }],
        },
      },
      apiLeerDealsPorAliado: {
        endpoint: "POST /crm/v3/objects/deals/search",
        body: {
          filterGroups: [{
            filters: [{ propertyName: "hs_tag_ids", operator: "EQ", value: "{tagId_del_aliado}" }],
          }],
          properties: ["dealname","dealstage","hs_tag_ids","createdate","hubspot_owner_id"],
          associations: ["contacts"],
        },
      },
    },

    pipeline: {
      id:    pipelines[0]?.id ?? "default",
      label: pipelines[0]?.label ?? "Funnel de ventas",
    },

    stages: (pipelines[0]?.stages ?? [])
      .sort((a, b) => a.displayOrder - b.displayOrder)
      .map(s => ({
        hubspotId:    s.id,
        label:        s.label,
        displayOrder: s.displayOrder,
        probability:  s.metadata?.probability ?? null,
      })),

    stageMap,

    dealFields: {
      nombre:          "dealname",
      etapa:           "dealstage",
      tagAliado:       "hs_tag_ids",        // ← clave de filtrado por aliado
      pipeline:        "pipeline",
      asesorInterno:   "hubspot_owner_id",  // owner = asesor comercial GER (distinto al aliado)
      fechaCreacion:   "createdate",
      fechaCierre:     "closedate",
      monto:           "amount",
      notas:           "description",
    },

    contactFields: {
      nombre:     "firstname",
      apellido:   "lastname",
      email:      "email",
      telefono:   "phone",
      ciudad:     "city",
      pais:       "country",
      // custom (crear en HubSpot si no existen):
      nacionalidad:      "nacionalidad",
      programa:          "programa",
      tuvoVisa:          "tuvo_visa",
      tipoVisa:          "tipo_visa",
      puedeCubrirCostos: "puede_cubrir_costos",
      profesion:         "profesion",
      nivelEscolaridad:  "nivel_escolaridad",
      nucleoFamiliar:    "nucleo_familiar",
    },

    contactPropsExistentes: (contactProps.found ?? []).map(p => p.name),
    contactPropsFaltantes:  contactProps.missing ?? [],
  }

  writeFileSync(path, JSON.stringify(map, null, 2), "utf-8")
  return path
}

// ─── Main ─────────────────────────────────────────────────

async function main() {
  console.log("\n🔍  ESTRUCTURA HUBSPOT – Global Express")
  console.log("=========================================")
  console.log(`   Token: ...${TOKEN.slice(-8)}`)
  if (TARGET_LABEL) console.log(`   Filtro de etiqueta: "${TARGET_LABEL}"`)

  const { pipelines, stageMap } = await getPipeline()
  const labelProp     = await getTagsProperty()
  const contactProps  = await getContactProps()

  // Buscar deals por tag: usa el argumento CLI o el primer tag configurado
  const tagToSearch = TARGET_LABEL
    ?? (labelProp?.options?.[0]?.value ?? null)

  if (tagToSearch) {
    await searchDealsByLabel(tagToSearch)
  } else {
    sep("BÚSQUEDA POR TAG DEL ALIADO")
    console.log("\n  Aún no hay tags configurados en HubSpot.")
    console.log("  Cuando existan, prueba con:")
    console.log("  node scripts/sync-hubspot.mjs carlos.mendoza\n")
  }

  const mapPath = writeFieldMap({ pipelines, stageMap, labelProp, contactProps })

  sep("RESULTADO")
  console.log(`\n  📄 ${mapPath}`)
  console.log("\n  Próximos pasos:")
  console.log("  1. Crear tags en HubSpot (uno por aliado): Settings → Properties → Deals → Deal Tags")
  console.log("  2. Al crear deal desde la app → incluir hs_tag_ids con el tagId del aliado logueado")
  console.log("  3. Al leer deals → filtrar: hs_tag_ids EQ {tagId_del_aliado}")
  console.log("  4. Opcional: crear props custom en contactos (ver contactPropsFaltantes en field-map.json)")
  console.log("\n✅  Listo.\n")
}

main().catch(err => { console.error("\n❌ ", err.message); process.exit(1) })
