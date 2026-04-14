/**
 * Script de exploración HubSpot
 * Trae pipelines, etapas, propiedades de deals y contactos,
 * y una muestra de deals reales para mapear la integración.
 *
 * Uso: node scripts/explore-hubspot.mjs
 */

import { readFileSync } from "fs"
import { resolve } from "path"

// Leer token desde .env.local
function loadEnv() {
  try {
    const envPath = resolve(process.cwd(), ".env.local")
    const content = readFileSync(envPath, "utf-8")
    for (const line of content.split("\n")) {
      const [key, ...rest] = line.split("=")
      if (key && rest.length) {
        process.env[key.trim()] = rest.join("=").trim()
      }
    }
  } catch {
    // Si no existe .env.local, continúa con las vars de entorno del sistema
  }
}

loadEnv()

const TOKEN = process.env.HUBSPOT_TOKEN
if (!TOKEN) {
  console.error("❌  HUBSPOT_TOKEN no encontrado. Crea el archivo .env.local")
  process.exit(1)
}

const BASE = "https://api.hubapi.com"
const HEADERS = {
  Authorization: `Bearer ${TOKEN}`,
  "Content-Type": "application/json",
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function hs(path, params = {}) {
  const url = new URL(`${BASE}${path}`)
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  const res = await fetch(url.toString(), { headers: HEADERS })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`HubSpot ${res.status} en ${path}: ${err}`)
  }
  return res.json()
}

function separator(title) {
  const line = "─".repeat(60)
  console.log(`\n${line}`)
  console.log(`  ${title}`)
  console.log(line)
}

// ─── 1. Pipelines y Etapas ────────────────────────────────────────────────────

async function getPipelines() {
  separator("PIPELINES Y ETAPAS DE DEALS")

  const data = await hs("/crm/v3/pipelines/deals")
  const pipelines = data.results || []

  if (!pipelines.length) {
    console.log("  (Sin pipelines encontrados)")
    return []
  }

  const stageMap = []

  for (const pipeline of pipelines) {
    console.log(`\n📌 Pipeline: "${pipeline.label}"  (id: ${pipeline.id})`)
    console.log(`   displayOrder: ${pipeline.displayOrder}`)
    console.log(`   Etapas:`)

    const stages = [...(pipeline.stages || [])].sort(
      (a, b) => a.displayOrder - b.displayOrder
    )

    for (const stage of stages) {
      const prob = stage.metadata?.probability ?? "—"
      console.log(
        `     [${String(stage.displayOrder).padStart(2, " ")}] id: ${stage.id.padEnd(30, " ")}  label: "${stage.label}"  prob: ${prob}`
      )
      stageMap.push({
        pipelineId: pipeline.id,
        pipelineLabel: pipeline.label,
        stageId: stage.id,
        stageLabel: stage.label,
        displayOrder: stage.displayOrder,
        probability: prob,
      })
    }
  }

  return stageMap
}

// ─── 2. Propiedades de Deals ──────────────────────────────────────────────────

async function getDealProperties() {
  separator("PROPIEDADES DE DEALS (campos disponibles)")

  const data = await hs("/crm/v3/properties/deals")
  const props = (data.results || []).filter((p) => !p.hidden)

  const groups = {}
  for (const p of props) {
    const g = p.groupName || "sin-grupo"
    if (!groups[g]) groups[g] = []
    groups[g].push(p)
  }

  const groupKeys = Object.keys(groups).sort()
  for (const g of groupKeys) {
    console.log(`\n  📂 Grupo: ${g}`)
    for (const p of groups[g]) {
      const type = `${p.type}/${p.fieldType}`
      console.log(
        `     • ${p.name.padEnd(45, " ")} (${type})  "${p.label}"`
      )
    }
  }

  return props.map((p) => p.name)
}

// ─── 3. Propiedades de Contactos ──────────────────────────────────────────────

async function getContactProperties() {
  separator("PROPIEDADES DE CONTACTOS (campos disponibles)")

  const data = await hs("/crm/v3/properties/contacts")
  const props = (data.results || []).filter((p) => !p.hidden)

  const groups = {}
  for (const p of props) {
    const g = p.groupName || "sin-grupo"
    if (!groups[g]) groups[g] = []
    groups[g].push(p)
  }

  const groupKeys = Object.keys(groups).sort()
  for (const g of groupKeys) {
    console.log(`\n  📂 Grupo: ${g}`)
    for (const p of groups[g]) {
      const type = `${p.type}/${p.fieldType}`
      console.log(
        `     • ${p.name.padEnd(45, " ")} (${type})  "${p.label}"`
      )
    }
  }

  return props.map((p) => p.name)
}

// ─── 4. Muestra de Deals reales ───────────────────────────────────────────────

async function getSampleDeals(dealPropertyNames) {
  separator("MUESTRA DE DEALS (primeros 5)")

  // Propiedades clave que queremos traer
  const wantedProps = [
    "dealname",
    "dealstage",
    "pipeline",
    "amount",
    "closedate",
    "createdate",
    "hubspot_owner_id",
    "hs_lastmodifieddate",
    ...dealPropertyNames.filter((n) =>
      [
        "email", "phone", "nacionalidad", "ciudad", "programa",
        "tuvo_visa", "tipo_visa", "puede_cubrir_costos", "acepta_inversion",
        "profesion", "nivel_escolaridad", "nucleo_familiar",
        "firstname", "lastname",
      ].includes(n)
    ),
  ]

  // Eliminar duplicados
  const propsParam = [...new Set(wantedProps)].join(",")

  const data = await hs("/crm/v3/objects/deals", {
    limit: 5,
    properties: propsParam,
    associations: "contacts",
  })

  const deals = data.results || []
  if (!deals.length) {
    console.log("  (Sin deals encontrados en la cuenta)")
    return
  }

  for (const deal of deals) {
    console.log(`\n  🎯 Deal ID: ${deal.id}`)
    const props = deal.properties || {}
    for (const [key, val] of Object.entries(props)) {
      if (val !== null && val !== "") {
        console.log(`     ${key.padEnd(40, " ")} = ${val}`)
      }
    }

    // Asociaciones con contactos
    const contacts = deal.associations?.contacts?.results || []
    if (contacts.length) {
      console.log(`     ${"associations.contacts".padEnd(40, " ")} = ${contacts.map((c) => c.id).join(", ")}`)
    }
  }
}

// ─── 5. Muestra de Contactos reales ──────────────────────────────────────────

async function getSampleContacts(contactPropertyNames) {
  separator("MUESTRA DE CONTACTOS (primeros 5)")

  const wantedProps = [
    "firstname",
    "lastname",
    "email",
    "phone",
    "hs_object_id",
    "createdate",
    "lastmodifieddate",
    "associatedcompanyid",
    ...contactPropertyNames.filter((n) =>
      [
        "nacionalidad", "ciudad", "programa", "tuvo_visa", "tipo_visa",
        "puede_cubrir_costos", "acepta_inversion", "profesion",
        "nivel_escolaridad", "nucleo_familiar", "hubspot_owner_id",
      ].includes(n)
    ),
  ]

  const propsParam = [...new Set(wantedProps)].join(",")

  const data = await hs("/crm/v3/objects/contacts", {
    limit: 5,
    properties: propsParam,
  })

  const contacts = data.results || []
  if (!contacts.length) {
    console.log("  (Sin contactos encontrados en la cuenta)")
    return
  }

  for (const contact of contacts) {
    console.log(`\n  👤 Contacto ID: ${contact.id}`)
    const props = contact.properties || {}
    for (const [key, val] of Object.entries(props)) {
      if (val !== null && val !== "") {
        console.log(`     ${key.padEnd(40, " ")} = ${val}`)
      }
    }
  }
}

// ─── 6. Owners (usuarios/asesores) ───────────────────────────────────────────

async function getOwners() {
  separator("OWNERS / ASESORES (usuarios HubSpot)")

  const data = await hs("/crm/v3/owners")
  const owners = data.results || []

  if (!owners.length) {
    console.log("  (Sin owners encontrados)")
    return []
  }

  for (const o of owners) {
    const teams = (o.teams || []).map((t) => t.name).join(", ") || "—"
    console.log(
      `  👔 id: ${String(o.id).padEnd(12, " ")} ${(o.firstName + " " + o.lastName).padEnd(30, " ")}  email: ${o.email}  equipos: ${teams}`
    )
  }

  return owners
}

// ─── Main ─────────────────────────────────────────────────────────────────────

async function main() {
  console.log("\n🔍  EXPLORADOR HUBSPOT – Global Express")
  console.log("========================================")
  console.log(`   Token: ...${TOKEN.slice(-8)}`)

  try {
    const stageMap = await getPipelines()
    const dealProps = await getDealProperties()
    const contactProps = await getContactProperties()
    await getOwners()
    await getSampleDeals(dealProps)
    await getSampleContacts(contactProps)

    separator("RESUMEN DE ETAPAS (para mapear en el código)")
    console.log("\n  Copia este mapa como referencia para el pipeline:\n")
    console.log("  const STAGE_MAP = {")
    for (const s of stageMap) {
      console.log(
        `    "${s.stageId}": "${s.stageLabel}",   // pipeline: ${s.pipelineLabel}`
      )
    }
    console.log("  }")

    console.log("\n✅  Exploración completada.\n")
  } catch (err) {
    console.error("\n❌  Error:", err.message)
    process.exit(1)
  }
}

main()
