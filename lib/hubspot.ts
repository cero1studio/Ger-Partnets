/**
 * Cliente HubSpot para el servidor (API routes de Next.js)
 * Pipeline: "Funnel de ventas" (id: default)
 * Filtrado por aliado: hs_tag_ids (Deal Tags nativos)
 */

const BASE   = "https://api.hubapi.com"
const TOKEN  = process.env.HUBSPOT_TOKEN!
const HEADS  = { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" }

// ─── Stage map fallback ─────────────────────────────────────
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

export type PipelineStage = {
  id: string
  nombre: string
  displayOrder: number
}

// ─── Dynamic Pipeline Stages ──────────────────────────────
export async function getPipelineStages(): Promise<PipelineStage[]> {
  try {
    // Fetch the "default" pipeline for deals
    const pipeline = await hsGet("/crm/v3/pipelines/deals/default")
    if (pipeline && pipeline.stages) {
      return pipeline.stages.map((s: any) => ({
        id: s.id,
        nombre: s.label,
        displayOrder: s.displayOrder
      })).sort((a: PipelineStage, b: PipelineStage) => a.displayOrder - b.displayOrder)
    }
  } catch (err) {
    console.error("[HubSpot] Error fetching pipeline stages:", err)
  }
  
  // Fallback if fetch fails
  return Object.entries(STAGE_MAP).map(([id, nombre], index) => ({
    id,
    nombre,
    displayOrder: index
  }))
}

const CONTACT_PROPS = [
  "firstname", "lastname", "email", "phone", "mobilephone",
  "city", "country", "createdate", "hubspot_owner_id", "jobtitle", "company",
].join(",")

const CONTACT_STAGE_DEFAULT = "appointmentscheduled"
const ALLY_TAG_PREFIX = "GER_TAG:"
const PROFILE_PROP = "perfil_aliado"
let contactPropertiesPromise: Promise<Set<string>> | null = null

// ─── Helpers ──────────────────────────────────────────────

async function hsGet(path: string, params: Record<string, string> = {}) {
  const url = new URL(`${BASE}${path}`)
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  const res = await fetch(url.toString(), { headers: HEADS, cache: "no-store" })
  if (!res.ok) throw new Error(`HubSpot GET ${path} → ${res.status}`)
  return res.json()
}

async function hsPost(path: string, body: unknown, suppress409Log = false) {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: HEADS,
    body: JSON.stringify(body),
    cache: "no-store",
  })
  if (!res.ok) {
    const err = await res.text()
    if (!(res.status === 409 && suppress409Log)) {
      console.error(`[HubSpot Error] POST ${path} -> ${res.status}:`, err)
    }
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

async function getContactPropertyNames(): Promise<Set<string>> {
  if (!contactPropertiesPromise) {
    contactPropertiesPromise = hsGet("/crm/v3/properties/contacts")
      .then((data) => new Set((data.results ?? []).map((p: { name: string }) => p.name)))
      .catch(() => new Set<string>())
  }
  return contactPropertiesPromise
}

// ─── Owners ───────────────────────────────────────────────

/**
 * Trae la información de los asesores (Dueños de los negocios)
 */
type HubSpotOwner = {
  id?: string | number
  userId?: string | number
  firstName?: string
  lastName?: string
  email?: string
}

async function getOwnerById(ownerId: string): Promise<HubSpotOwner | null> {
  // `hubspot_owner_id` suele mapear al ID del owner, pero dejamos fallback
  // porque en algunas cuentas el ID puede comportarse como userId.
  const attempts = [
    () => hsGet(`/crm/v3/owners/${ownerId}`),
    () => hsGet(`/crm/v3/owners/${ownerId}`, { idProperty: "id" }),
    () => hsGet(`/crm/v3/owners/${ownerId}`, { idProperty: "userId" }),
  ]

  for (const request of attempts) {
    try {
      return await request()
    } catch {
      // Intentar siguiente estrategia
    }
  }

  return null
}

async function getOwnersBatch(ids: string[]): Promise<Record<string, { nombre: string; email: string }>> {
  if (!ids.length) return {}

  const uniqueIds = [...new Set(ids)]
  const owners = await Promise.all(uniqueIds.map(async (ownerId) => ({
    ownerId,
    data: await getOwnerById(ownerId),
  })))

  const result: Record<string, { nombre: string; email: string }> = {}

  for (const { ownerId, data } of owners) {
    if (!data) continue

    const normalizedName = `${data.firstName ?? ""} ${data.lastName ?? ""}`.trim() || `Owner ${ownerId}`
    const normalizedOwner = {
      nombre: normalizedName,
      email: data.email ?? "",
      foto: data.email 
        ? `https://unavatar.io/${data.email}?fallback=https://ui-avatars.com/api/?name=${encodeURIComponent(normalizedName)}&background=0D8ABC&color=fff`
        : `https://ui-avatars.com/api/?name=${encodeURIComponent(normalizedName)}&background=0D8ABC&color=fff`
    }

    // Guardamos por todas las claves posibles para resolver referencias futuras.
    result[ownerId] = normalizedOwner
    if (data.id !== undefined) result[String(data.id)] = normalizedOwner
    if (data.userId !== undefined) result[String(data.userId)] = normalizedOwner
  }

  return result
}

// ─── Contactos ────────────────────────────────────────────

// ─── Contactos por etiqueta de aliado ─────────────────────

function allyTagValue(tagId: string) {
  return `${ALLY_TAG_PREFIX}${tagId}`
}

function cleanBackupNotes(description: string): string {
  return description
    .split("\n")
    .filter(line => !line.startsWith("[Email de Respaldo]") && !line.startsWith("[Teléfono de Respaldo]"))
    .join("\n")
    .trim()
}

export async function getContactsByTag(tagId: string) {
  const data = await hsPost("/crm/v3/objects/contacts/search", {
    filterGroups: [{
      filters: [{ propertyName: "company", operator: "EQ", value: allyTagValue(tagId) }],
    }],
    properties: [...CONTACT_PROPS.split(","), PROFILE_PROP],
    limit: 200,
    sorts: [{ propertyName: "createdate", direction: "DESCENDING" }],
  }).catch(async () => hsPost("/crm/v3/objects/contacts/search", {
    filterGroups: [{
      filters: [{ propertyName: "company", operator: "EQ", value: allyTagValue(tagId) }],
    }],
    properties: CONTACT_PROPS.split(","),
    limit: 200,
    sorts: [{ propertyName: "createdate", direction: "DESCENDING" }],
  }))

  const contacts = data.results ?? []
  if (contacts.length === 0) return []

  const ownerIds = [...new Set(
    contacts.map((c: { properties: Record<string, string> }) => c.properties.hubspot_owner_id).filter(Boolean)
  )] as string[]

  const ownersMap = await getOwnersBatch(ownerIds)
  const notesMap = await getLatestProfileNotesByContact(contacts.map((c: { id: string }) => c.id))

  // Fetch deal associations to get dynamic stages
  const contactIds = contacts.map((c: { id: string }) => c.id)
  let dealsMap: Record<string, string> = {}

  try {
    const associations = await hsPost("/crm/v3/associations/contacts/deals/batch/read", {
      inputs: contactIds.map(id => ({ id }))
    })

    const dealIds = new Set<string>()
    const contactToDeal: Record<string, string[]> = {}
    
    for (const row of associations.results ?? []) {
      const cId = String(row.from?.id ?? row.fromId ?? "")
      if (!cId) continue
      const dIds = (row.to ?? []).map((d: any) => String(d.id ?? d.toId ?? "")).filter(Boolean)
      contactToDeal[cId] = dIds
      dIds.forEach(id => dealIds.add(id))
    }

    if (dealIds.size > 0) {
      const dealsBatch = await hsPost("/crm/v3/objects/deals/batch/read", {
        inputs: [...dealIds].map(id => ({ id })),
        properties: ["dealstage"]
      })

      const dealStageById: Record<string, string> = {}
      for (const deal of dealsBatch.results ?? []) {
        dealStageById[String(deal.id)] = deal.properties?.dealstage ?? ""
      }

      for (const cId of Object.keys(contactToDeal)) {
        const dIds = contactToDeal[cId]
        if (dIds.length > 0) {
          const stages = dIds.map(id => dealStageById[id]).filter(Boolean)
          if (stages.length > 0) {
            dealsMap[cId] = stages[0] // Asumimos la primera oferta
          }
        }
      }
    }
  } catch (err) {
    console.error("[getContactsByTag] Error fetching associated deals:", err)
  }

  // Fetch the latest dynamic pipeline stages for labels
  const pipelineStages = await getPipelineStages()
  const dynamicStageMap = Object.fromEntries(pipelineStages.map(s => [s.id, s.nombre]))

  return contacts.map((c: { id: string; properties: Record<string, string> }) => {
    const p = c.properties ?? {}
    const owner = p.hubspot_owner_id ? ownersMap[p.hubspot_owner_id] : null
    const nombre = `${p.firstname ?? ""} ${p.lastname ?? ""}`.trim() || p.email || "Sin nombre"

    const stageId = dealsMap[c.id] || CONTACT_STAGE_DEFAULT
    const stageLabel = dynamicStageMap[stageId] || STAGE_MAP[stageId] || "Contacto inicial"

    return {
      id: c.id,
      nombre,
      email: p.email ?? "",
      telefono: p.phone || p.mobilephone || "",
      nacionalidad: p.country ?? "",
      etapa: stageId,
      stageLabel,
      ownerHubspotId: p.hubspot_owner_id ?? "",
      owner: owner ? { nombre: owner.nombre, email: owner.email, foto: owner.foto } : null,
      fechaRegistro: p.createdate ? new Date(p.createdate).toLocaleDateString("es-CO") : "",
      notas: cleanBackupNotes(p[PROFILE_PROP] ?? notesMap[c.id] ?? ""),
      contactId: c.id,
    }
  })
}

export async function getAllLeadsCountsByAlly(): Promise<Record<string, number>> {
  try {
    const data = await hsPost("/crm/v3/objects/contacts/search", {
      filterGroups: [{
        filters: [{ propertyName: "company", operator: "CONTAINS_TOKEN", value: ALLY_TAG_PREFIX }],
      }],
      properties: ["company"],
      limit: 1000,
    })

    const counts: Record<string, number> = {}
    for (const res of data.results ?? []) {
      const company = res.properties?.company || ""
      if (company.startsWith(ALLY_TAG_PREFIX)) {
        const tagId = company.replace(ALLY_TAG_PREFIX, "")
        counts[tagId] = (counts[tagId] || 0) + 1
      }
    }
    return counts
  } catch (err) {
    console.error("[HubSpot] Error fetching all lead counts:", err)
    return {}
  }
}

// ─── Helpers ──────────────────────────────────────────────

async function ensureContactProfileProperty(): Promise<boolean> {
  try {
    await hsPost("/crm/v3/properties/contacts", {
      name: PROFILE_PROP,
      label: "Perfil aliado",
      type: "string",
      fieldType: "textarea",
      groupName: "contactinformation",
      description: "Perfilamiento capturado desde el portal de aliados.",
      hidden: false,
      hasUniqueValue: false,
    }, true)
    return true
  } catch (err) {
    const message = (err as Error).message
    // Si ya existe, seguimos normal.
    if (message.includes("409")) return true
    return false
  }
}

async function upsertContactNote(contactId: string, noteBody: string) {
  if (!noteBody.trim()) return
  await hsPost("/crm/v3/objects/notes", {
    properties: {
      hs_timestamp: new Date().toISOString(),
      hs_note_body: noteBody,
    },
    associations: [
      {
        to: { id: contactId },
        types: [
          {
            associationCategory: "HUBSPOT_DEFINED",
            associationTypeId: 202,
          },
        ],
      },
    ],
  })
}

function isProfileNote(noteBody: string): boolean {
  return [
    "Nacionalidad:",
    "Programa:",
    "Profesión:",
    "Escolaridad:",
    "Tuvo visa:",
    "Cubre costos",
    "Notas:",
  ].some(marker => noteBody.includes(marker))
}

async function getLatestProfileNotesByContact(contactIds: string[]): Promise<Record<string, string>> {
  if (!contactIds.length) return {}

  try {
    const associations = await hsPost("/crm/v3/associations/contacts/notes/batch/read", {
      inputs: contactIds.map(id => ({ id })),
    })

    const contactToNoteIds: Record<string, string[]> = {}
    const allNoteIds = new Set<string>()

    for (const row of associations.results ?? []) {
      const contactId = String(row.from?.id ?? row.fromId ?? "")
      if (!contactId) continue
      const noteIds = (row.to ?? [])
        .map((n: { id?: string | number; toId?: string | number }) => String(n.id ?? n.toId ?? ""))
        .filter(Boolean)

      if (!noteIds.length) continue
      contactToNoteIds[contactId] = noteIds
      for (const noteId of noteIds) allNoteIds.add(noteId)
    }

    if (!allNoteIds.size) return {}

    const notesBatch = await hsPost("/crm/v3/objects/notes/batch/read", {
      inputs: [...allNoteIds].map(id => ({ id })),
      properties: ["hs_note_body", "hs_timestamp"],
    })

    const notesById: Record<string, { body: string; ts: number }> = {}
    for (const note of notesBatch.results ?? []) {
      const body = String(note.properties?.hs_note_body ?? "")
      const ts = Date.parse(String(note.properties?.hs_timestamp ?? "")) || 0
      notesById[String(note.id)] = { body, ts }
    }

    const latestByContact: Record<string, string> = {}
    for (const contactId of Object.keys(contactToNoteIds)) {
      const notes = contactToNoteIds[contactId].map(noteId => notesById[noteId]).filter(Boolean)
      if (!notes.length) continue
      const profileNotes = notes.filter(n => isProfileNote(n.body))
      const source = profileNotes.length ? profileNotes : notes
      source.sort((a, b) => b.ts - a.ts)
      latestByContact[contactId] = cleanBackupNotes(source[0].body)
    }

    return latestByContact
  } catch {
    return {}
  }
}

// ─── Crear/actualizar contacto únicamente ─────────────────

export async function createContact(params: {
  nombre: string
  apellido: string
  email: string
  telefono: string
  nacionalidad?: string
  programa?: string
  tuvoVisa?: boolean
  tipoVisa?: string
  puedeCubrirCostos?: string
  profesion?: string
  nivelEscolaridad?: string
  tagId: string
  aliadoUsername?: string
  mensaje?: string
  notas?: string
}) {
  let contactId: string | null = null
  const profileDescription = cleanBackupNotes(params.notas ?? "")
  const profilePropertyReady = profileDescription ? await ensureContactProfileProperty() : false
  const contactPropertyNames = await getContactPropertyNames()

  const properties: Record<string, string> = {
    firstname: params.nombre,
    lastname: params.apellido,
    email: params.email.toLowerCase(),
    phone: params.telefono,
    company: allyTagValue(params.tagId),
  }

  if (params.profesion) properties.jobtitle = params.profesion

  // Guardar en propiedades custom SOLO si existen en este portal de HubSpot.
  if (params.nacionalidad) {
    properties.country = params.nacionalidad
    if (contactPropertyNames.has("nacionalidad")) properties.nacionalidad = params.nacionalidad
  }
  if (params.programa && contactPropertyNames.has("programa")) properties.programa = params.programa
  
  if (params.profesion) {
    if (contactPropertyNames.has("profesion")) properties.profesion = params.profesion
    if (contactPropertyNames.has("ocupacion_actual_2")) properties.ocupacion_actual_2 = params.profesion
  }

  if (params.nivelEscolaridad) {
    if (contactPropertyNames.has("nivel_escolaridad")) properties.nivel_escolaridad = params.nivelEscolaridad
    if (contactPropertyNames.has("escolaridad")) properties.escolaridad = params.nivelEscolaridad
  }

  if (params.tipoVisa && contactPropertyNames.has("tipo_visa")) properties.tipo_visa = params.tipoVisa
  if (params.tuvoVisa !== undefined && contactPropertyNames.has("tuvo_visa")) properties.tuvo_visa = params.tuvoVisa ? "true" : "false"

  if (params.puedeCubrirCostos) {
    if (contactPropertyNames.has("puede_cubrir_costos")) properties.puede_cubrir_costos = params.puedeCubrirCostos
    let cap = ""
    if (params.puedeCubrirCostos === "si") cap = "Cuento con recursos para cubrir los costos."
    else if (params.puedeCubrirCostos === "con-financiamiento") cap = "Puedo gestionar un crédito o financiamiento."
    else if (params.puedeCubrirCostos === "no") cap = "No tengo los recursos en este momento."
    if (cap && contactPropertyNames.has("filtro_financiero__identificacion_de_capacidad_de_pago")) {
      properties.filtro_financiero__identificacion_de_capacidad_de_pago = cap
    }
  }

  // Nuevas asignaciones solicitadas
  if (params.aliadoUsername && contactPropertyNames.has("etiqueta_del_aliado")) properties.etiqueta_del_aliado = params.aliadoUsername
  if (params.tuvoVisa !== undefined && contactPropertyNames.has("tiene_visa_")) properties.tiene_visa_ = params.tuvoVisa ? "SI" : "NO"
  if (params.mensaje && contactPropertyNames.has("escriba_su_mensaje")) properties.escriba_su_mensaje = params.mensaje

  if (profilePropertyReady && profileDescription) properties[PROFILE_PROP] = profileDescription

  try {
    const contactData = await hsPost("/crm/v3/objects/contacts", {
      properties,
    })
    contactId = contactData.id
  } catch (err) {
    console.log("[createContact] Falla al crear contacto nuevo (quizás ya existe):", (err as Error).message)
    try {
      const search = await hsPost("/crm/v3/objects/contacts/search", {
        filterGroups: [{
          filters: [{ propertyName: "email", operator: "EQ", value: params.email.toLowerCase() }],
        }],
        properties: ["email"],
        limit: 1,
      })
      if (search.results && search.results.length > 0) {
        contactId = search.results[0].id
        await hsPatch(`/crm/v3/objects/contacts/${contactId}`, { properties })
        console.log(`[createContact] Contacto existente actualizado: ${contactId}`)
      }
    } catch (searchErr) {
      console.error("[createContact] No se pudo buscar el contacto existente:", (searchErr as Error).message)
    }
  }

  if (!contactId) {
    throw new Error("No fue posible crear ni actualizar el contacto en HubSpot")
  }

  // Si no fue posible usar propiedad, guardamos el perfil como nota asociada.
  if (profileDescription && !profilePropertyReady) {
    await upsertContactNote(contactId, profileDescription)
  }

  return {
    contactId,
    lead: {
      id: contactId,
      nombre: `${params.nombre} ${params.apellido}`.trim(),
      email: params.email.toLowerCase(),
      telefono: params.telefono,
      nacionalidad: params.nacionalidad ?? "",
      etapa: CONTACT_STAGE_DEFAULT,
      stageLabel: STAGE_MAP[CONTACT_STAGE_DEFAULT] ?? "Contacto inicial",
      fechaRegistro: new Date().toLocaleDateString("es-CO"),
      notas: profileDescription,
      contactId,
      owner: null,
    },
  }
}
