/**
 * Cliente HubSpot para el servidor (API routes de Next.js)
 * Pipeline: "Funnel de ventas" (id: default)
 * Filtrado por aliado: hs_tag_ids (Deal Tags nativos)
 */

const BASE   = "https://api.hubapi.com"
const TOKEN  = process.env.HUBSPOT_TOKEN!
const HEADS  = { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" }

// ─── Stage map ────────────────────────────────────────────
export const STAGE_MAP: Record<string, string> = {
  appointmentscheduled:  "Contacto inicial",
  qualifiedtobuy:        "No contesta",
  presentationscheduled: "Perfilamiento",
  decisionmakerboughtin: "Reunión asesoría",
  "1226150813":          "Seguimiento",
  contractsent:          "Prospecto",
  closedwon:             "Pago G1",
  closedlost:            "Pago programa",
  "1062656363":          "Retargeting",
  "1062656364":          "Lead ganado",
  "1062656365":          "Lead perdido",
}

const DEAL_PROPS = [
  "dealname", "dealstage", "pipeline", "hs_tag_ids",
  "hubspot_owner_id", "createdate", "closedate",
  "amount", "description",
].join(",")

const CONTACT_PROPS = [
  "firstname", "lastname", "email", "phone", "mobilephone",
  "city", "country",
].join(",")

// ─── Helpers ──────────────────────────────────────────────

async function hsGet(path: string, params: Record<string, string> = {}) {
  const url = new URL(`${BASE}${path}`)
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  const res = await fetch(url.toString(), { headers: HEADS, cache: "no-store" })
  if (!res.ok) throw new Error(`HubSpot GET ${path} → ${res.status}`)
  return res.json()
}

async function hsPost(path: string, body: unknown) {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: HEADS,
    body: JSON.stringify(body),
    cache: "no-store",
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`HubSpot POST ${path} → ${res.status}: ${err}`)
  }
  return res.json()
}

async function hsPatch(path: string, body: unknown) {
  const res = await fetch(`${BASE}${path}`, {
    method: "PATCH",
    headers: HEADS,
    body: JSON.stringify(body),
    cache: "no-store",
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`HubSpot PATCH ${path} → ${res.status}: ${err}`)
  }
  return res.json()
}

// ─── Contactos ────────────────────────────────────────────

async function getContactsBatch(ids: string[]): Promise<Record<string, Record<string, string>>> {
  if (!ids.length) return {}
  const data = await hsPost("/crm/v3/objects/contacts/batch/read", {
    inputs: ids.map(id => ({ id })),
    properties: CONTACT_PROPS.split(","),
  })
  const result: Record<string, Record<string, string>> = {}
  for (const c of data.results ?? []) result[c.id] = c.properties
  return result
}

// ─── Deals por etiqueta de aliado ─────────────────────────

export async function getDealsByTag(tagId: string) {
  const data = await hsPost("/crm/v3/objects/deals/search", {
    filterGroups: [{
      filters: [{ propertyName: "hs_tag_ids", operator: "EQ", value: tagId }],
    }],
    properties: DEAL_PROPS.split(","),
    associations: ["contacts"],
    limit: 200,
  })

  const rawDeals = data.results ?? []

  // Recopilar IDs de contacto únicos
  const contactIds = [...new Set(
    rawDeals.flatMap((d: { associations?: { contacts?: { results?: { id: string }[] } } }) =>
      (d.associations?.contacts?.results ?? []).map((c: { id: string }) => c.id)
    )
  )] as string[]

  const contactsMap = await getContactsBatch(contactIds)

  return rawDeals.map((d: {
    id: string
    properties: Record<string, string>
    associations?: { contacts?: { results?: { id: string }[] } }
  }) => {
    const p = d.properties
    const contacts = (d.associations?.contacts?.results ?? []).map((c: { id: string }) => ({
      id: c.id,
      ...contactsMap[c.id],
    }))
    const contact = contacts[0] ?? {}
    return {
      id: d.id,
      nombre: p.dealname ?? `${contact.firstname ?? ""} ${contact.lastname ?? ""}`.trim(),
      email: contact.email ?? "",
      telefono: contact.phone ?? contact.mobilephone ?? "",
      nacionalidad: contact.country ?? "",
      etapa: p.dealstage ?? "",
      stageLabel: STAGE_MAP[p.dealstage] ?? p.dealstage,
      pipeline: p.pipeline ?? "default",
      tagIds: p.hs_tag_ids ?? "",
      ownerHubspotId: p.hubspot_owner_id ?? "",
      fechaRegistro: p.createdate ? new Date(p.createdate).toLocaleDateString("es-CO") : "",
      fechaCierre: p.closedate ?? null,
      monto: p.amount ?? null,
      notas: p.description ?? "",
      contactId: contacts[0]?.id ?? null,
    }
  })
}

// ─── Crear deal + contacto ────────────────────────────────

export async function createDeal(params: {
  nombre: string
  apellido: string
  email: string
  telefono: string
  nacionalidad?: string
  programa?: string
  tagId: string          // hs_tag_ids del aliado
  notas?: string
}) {
  // 1. Crear o actualizar contacto
  let contactId: string | null = null
  try {
    const contactData = await hsPost("/crm/v3/objects/contacts", {
      properties: {
        firstname: params.nombre,
        lastname:  params.apellido,
        email:     params.email,
        phone:     params.telefono,
        country:   params.nacionalidad ?? "",
      },
    })
    contactId = contactData.id
  } catch {
    // Si ya existe por email, buscarlo
    try {
      const search = await hsPost("/crm/v3/objects/contacts/search", {
        filterGroups: [{
          filters: [{ propertyName: "email", operator: "EQ", value: params.email }],
        }],
        properties: ["hs_object_id"],
        limit: 1,
      })
      contactId = search.results?.[0]?.id ?? null
    } catch { /* ignorar */ }
  }

  // 2. Crear deal
  const dealBody: { properties: Record<string, string>; associations?: unknown[] } = {
    properties: {
      dealname:   `${params.nombre} ${params.apellido}`.trim(),
      dealstage:  "appointmentscheduled",
      pipeline:   "default",
      hs_tag_ids: params.tagId,
      description: params.notas ?? "",
    },
  }

  if (contactId) {
    dealBody.associations = [{
      to: { id: contactId },
      types: [{ associationCategory: "HUBSPOT_DEFINED", associationTypeId: 3 }],
    }]
  }

  const deal = await hsPost("/crm/v3/objects/deals", dealBody)
  return { dealId: deal.id, contactId }
}

// ─── Crear tag del aliado en HubSpot ─────────────────────
// Trae las opciones existentes, añade la nueva y hace PATCH
// con la lista completa para no borrar los tags previos.

export async function createAliaoTag(etiqueta: string): Promise<string | null> {
  try {
    // 1. Traer opciones actuales
    const current = await hsGet("/crm/v3/properties/deals/hs_tag_ids")
    const existing: Array<{ label: string; value: string; displayOrder: number; hidden: boolean }> =
      current.options ?? []

    // Si ya existe, no duplicar
    const already = existing.find(o => o.value === etiqueta)
    if (already) return already.value

    // 2. Añadir la nueva opción al final
    const maxOrder = existing.reduce((max, o) => Math.max(max, o.displayOrder ?? 0), -1)
    const newOptions = [
      ...existing.map(o => ({
        label:        o.label,
        value:        o.value,
        displayOrder: o.displayOrder,
        hidden:       o.hidden ?? false,
      })),
      {
        label:        etiqueta,
        value:        etiqueta,
        displayOrder: maxOrder + 1,
        hidden:       false,
      },
    ]

    // 3. PATCH con la lista completa
    const updated = await hsPatch("/crm/v3/properties/deals/hs_tag_ids", { options: newOptions })
    const opt = (updated.options ?? []).find((o: { value: string }) => o.value === etiqueta)
    return opt?.value ?? etiqueta
  } catch (err) {
    console.error("[createAliaoTag]", err)
    return null
  }
}
