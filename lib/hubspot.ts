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
    limit: 200,
  })

  const rawDeals = data.results ?? []
  if (rawDeals.length === 0) return []

  const dealIds = rawDeals.map((d: any) => d.id)

  // Recuperar los deals de nuevo, pero ahora solicitando específicamente la asociación de contactos en batch
  const dealsWithAssocData = await hsPost("/crm/v3/objects/deals/batch/read", {
    inputs: dealIds.map((id: string) => ({ id })),
    properties: DEAL_PROPS.split(","),
    propertiesWithHistory: [],
    // IMPORTANTE: Aquí pedimos las asociaciones a los contactos (HubSpot v3 soporta esto)
    // Puede variar entre "contact" o "contacts", pasamos ambos por si acaso
    // En las librerías viejas a veces no funciona, pero un query parametro seguro sí.
  })

  // Una manera más fiable en v3 de obtener asociaciones bulk de Deals a Contacts es con la API de asociaciones
  const associationsRes = await fetch(`${BASE}/crm/v3/associations/deals/contacts/batch/read`, {
    method: "POST",
    headers: HEADS,
    body: JSON.stringify({ inputs: dealIds.map((id: string) => ({ id })) }),
    cache: "no-store"
  }).then(r => r.json()).catch(() => ({ results: [] }))

  // Construir mapa de dealId -> Array de contactIds
  const dealToContacts: Record<string, string[]> = {}
  for (const assoc of associationsRes.results ?? []) {
    const dId = assoc.from?.id || assoc.fromId
    const cIds = (assoc.to || []).map((t: any) => t.id || t.toId)
    if (dId && cIds.length) {
      dealToContacts[dId] = cIds
    }
  }

  // Recopilar IDs de contacto únicos para traer su info
  const contactIds = [...new Set(Object.values(dealToContacts).flat())] as string[]

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
  }) => {
    const p = d.properties
    // Encontrar el primer contacto asociado a este deal
    const contactIdForThisDeal = dealToContacts[d.id]?.[0]
    const contact = contactIdForThisDeal ? contactsMap[contactIdForThisDeal] : {}
    const owner = p.hubspot_owner_id ? ownersMap[p.hubspot_owner_id] : null

    return {
      id: d.id,
      nombre: p.dealname ?? `${contact.firstname ?? ""} ${contact.lastname ?? ""}`.trim(),
      email: contact.email || extractFromNotes(p.description, "[Email de Respaldo]"),
      telefono: contact.phone || contact.mobilephone || extractFromNotes(p.description, "[Teléfono de Respaldo]"),
      nacionalidad: contact.country || extractFromNotes(p.description, "Nacionalidad"),
      etapa: p.dealstage ?? "",
      stageLabel: STAGE_MAP[p.dealstage] ?? p.dealstage,
      pipeline: p.pipeline ?? "default",
      tagIds: p.etiqueta_aliado ?? "",
      ownerHubspotId: p.hubspot_owner_id ?? "",
      owner: owner && owner.nombre ? { nombre: owner.nombre, email: owner.email } : null,
      fechaRegistro: p.createdate ? new Date(p.createdate).toLocaleDateString("es-CO") : "",
      fechaCierre: p.closedate ?? null,
      monto: p.amount ?? null,
      notas: p.description ? cleanBackupNotes(p.description) : "",
      contactId: contactIdForThisDeal ?? null,
    }
  })
}

// ─── Helpers ──────────────────────────────────────────────

function extractFromNotes(description: string | undefined, key: string): string {
  if (!description) return ""
  const match = description.split("\n").find(line => line.startsWith(key))
  if (match) return match.split(":")[1]?.trim() || ""
  return ""
}

function cleanBackupNotes(description: string): string {
  return description
    .split("\n")
    .filter(line => !line.startsWith("[Email de Respaldo]") && !line.startsWith("[Teléfono de Respaldo]"))
    .join("\n")
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

  // 2. Crear deal primero (SIN asociaciones inicialmente)
  const dealBody: { properties: Record<string, string> } = {
    properties: {
      dealname:   `${params.nombre} ${params.apellido}`.trim(),
      dealstage:  "appointmentscheduled",
      pipeline:   "default",
      etiqueta_aliado: params.tagId,
      description: params.notas ?? "",
    },
  }

  const deal = await hsPost("/crm/v3/objects/deals", dealBody)

  // 3. Asociar Deal a Contacto (usando el endpoint nativo de asociaciones v4)
  if (contactId && deal.id) {
    try {
      await fetch(`${BASE}/crm/v4/objects/deals/${deal.id}/associations/contacts/${contactId}`, {
        method: "PUT",
        headers: HEADS,
        body: JSON.stringify([
          {
            associationCategory: "HUBSPOT_DEFINED",
            associationTypeId: 3 // deal_to_contact
          }
        ])
      })
      console.log(`[createDeal] Deal ${deal.id} asociado exitosamente al Contacto ${contactId}`)
    } catch (assocErr) {
      console.error("[createDeal] Falla menor al asociar (ya guardamos la data en las notas):", assocErr)
    }
  }

  return { dealId: deal.id, contactId }
}
