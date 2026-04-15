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
  "dealname", "dealstage", "pipeline", "etiqueta_aliado",
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
    console.error(`[HubSpot Error] POST ${path} -> ${res.status}:`, err)
    throw new Error(`HubSpot POST ${path} → ${res.status}`)
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
    console.error(`[HubSpot Error] PATCH ${path} -> ${res.status}:`, err)
    throw new Error(`HubSpot PATCH ${path} → ${res.status}`)
  }
  return res.json()
}

// ─── Owners ───────────────────────────────────────────────

/**
 * Trae la información de los asesores (Dueños de los negocios)
 */
async function getOwnersBatch(ids: string[]): Promise<Record<string, { nombre: string; email: string }>> {
  if (!ids.length) return {}
  try {
    const idsQuery = ids.map(id => `id=${id}`).join("&")
    const data = await hsGet(`/crm/v3/owners/?${idsQuery}&limit=100`)
    const result: Record<string, { nombre: string; email: string }> = {}
    for (const owner of data.results ?? []) {
      result[owner.id] = {
        nombre: `${owner.firstName ?? ""} ${owner.lastName ?? ""}`.trim(),
        email: owner.email ?? ""
      }
    }
    return result
  } catch (err) {
    console.error("[getOwnersBatch] Error:", err)
    return {}
  }
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
      filters: [{ propertyName: "etiqueta_aliado", operator: "EQ", value: tagId }],
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

  // Recopilar IDs de owners únicos
  const ownerIds = [...new Set(
    rawDeals.map((d: { properties: Record<string, string> }) => d.properties.hubspot_owner_id).filter(Boolean)
  )] as string[]

  const [contactsMap, ownersMap] = await Promise.all([
    getContactsBatch(contactIds),
    getOwnersBatch(ownerIds)
  ])

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
    const owner = p.hubspot_owner_id ? ownersMap[p.hubspot_owner_id] : null

    return {
      id: d.id,
      nombre: p.dealname ?? `${contact.firstname ?? ""} ${contact.lastname ?? ""}`.trim(),
      email: contact.email ?? "",
      telefono: contact.phone ?? contact.mobilephone ?? "",
      nacionalidad: contact.country ?? "",
      etapa: p.dealstage ?? "",
      stageLabel: STAGE_MAP[p.dealstage] ?? p.dealstage,
      pipeline: p.pipeline ?? "default",
      tagIds: p.etiqueta_aliado ?? "",
      ownerHubspotId: p.hubspot_owner_id ?? "",
      owner: owner ? { nombre: owner.nombre, email: owner.email } : null,
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
  } catch (err) {
    console.log("[createDeal] Falla al crear contacto nuevo (quizás ya existe):", (err as Error).message)
    // Si ya existe por email, buscarlo
    try {
      // Usamos el endpoint de busqueda viejo que suele requerir menos scopes o usamos el endpoint de busqueda nuevo con permisos básicos
      const search = await hsPost("/crm/v3/objects/contacts/search", {
        filterGroups: [{
          filters: [{ propertyName: "email", operator: "EQ", value: params.email }],
        }],
        properties: ["email"],
        limit: 1,
      })
      if (search.results && search.results.length > 0) {
        contactId = search.results[0].id
        console.log(`[createDeal] Contacto existente encontrado: ${contactId}`)
      }
    } catch (searchErr) {
      console.error("[createDeal] No se pudo buscar el contacto existente:", (searchErr as Error).message)
    }
  }

  // 2. Crear deal
  const dealBody: { properties: Record<string, string>; associations?: unknown[] } = {
    properties: {
      dealname:   `${params.nombre} ${params.apellido}`.trim(),
      dealstage:  "appointmentscheduled",
      pipeline:   "default",
      etiqueta_aliado: params.tagId,
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
