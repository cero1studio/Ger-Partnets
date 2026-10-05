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
const HUBSPOT_OCUPACION_ACTUAL_ALLOWED = new Map<string, string>([
  ["empleado", "Empleado"],
  ["desempleado", "Desempleado"],
  ["independiente", "Independiente"],
  ["estudiante", "Estudiante"],
])
type ContactPropertyMeta = {
  names: Set<string>
  enumValueMaps: Record<string, Map<string, string>>
}
let contactPropertiesPromise: Promise<ContactPropertyMeta> | null = null

// ─── Helpers ──────────────────────────────────────────────

/**
 * HubSpot limita a 19 llamadas por segundo. Ante un 429 esperamos y reintentamos
 * en vez de dejar caer la operación.
 */
async function hsFetch(url: string, init: RequestInit, intentos = 3): Promise<Response> {
  let res = await fetch(url, init)

  for (let intento = 1; intento < intentos && res.status === 429; intento++) {
    const retryAfter = Number(res.headers.get("Retry-After"))
    const esperaMs = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 1000 * intento
    console.warn(`[HubSpot] 429 en ${url}; reintentando en ${esperaMs}ms (intento ${intento + 1}/${intentos})`)
    await new Promise(r => setTimeout(r, esperaMs))
    res = await fetch(url, init)
  }

  return res
}

async function hsGet(path: string, params: Record<string, string> = {}) {
  const url = new URL(`${BASE}${path}`)
  Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v))
  const res = await hsFetch(url.toString(), { headers: HEADS, cache: "no-store" })
  if (!res.ok) throw new Error(`HubSpot GET ${path} → ${res.status}`)
  return res.json()
}

async function hsPost(path: string, body: unknown, suppress409Log = false) {
  const res = await hsFetch(`${BASE}${path}`, {
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
    // Conservamos el cuerpo de la respuesta: trae el motivo y, en los 409,
    // el id del contacto que ya existe.
    throw new Error(`HubSpot POST ${path} → ${res.status}: ${err}`)
  }
  return res.json()
}

async function hsPatch(path: string, body: unknown) {
  const res = await hsFetch(`${BASE}${path}`, {
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

/**
 * HubSpot rechaza cualquier batch/read con más de 100 inputs.
 * Partimos en lotes y unimos los resultados; si un lote falla, los demás sobreviven.
 */
const HUBSPOT_BATCH_LIMIT = 100

async function hsBatchRead(
  path: string,
  ids: string[],
  extraBody: Record<string, unknown> = {},
): Promise<any[]> {
  const unique = [...new Set(ids.filter(Boolean))]
  if (!unique.length) return []

  const results: any[] = []
  for (let i = 0; i < unique.length; i += HUBSPOT_BATCH_LIMIT) {
    const slice = unique.slice(i, i + HUBSPOT_BATCH_LIMIT)
    try {
      const data = await hsPost(path, { inputs: slice.map(id => ({ id })), ...extraBody })
      results.push(...(data.results ?? []))
    } catch (err) {
      console.error(`[hsBatchRead] Lote ${i / HUBSPOT_BATCH_LIMIT + 1} de ${path} falló:`, (err as Error).message)
    }
  }
  return results
}

function normalizeEnumToken(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
}

function getEnumValueForProperty(
  enumValueMaps: Record<string, Map<string, string>>,
  propertyName: string,
  rawValue: string
): string | null {
  const enumMap = enumValueMaps[propertyName]
  if (!enumMap) return null

  const normalizedRaw = normalizeEnumToken(rawValue)
  if (!normalizedRaw) return null

  const exact = enumMap.get(normalizedRaw)
  if (exact) return exact

  return enumMap.get("otro") ?? enumMap.get("otra") ?? enumMap.get("other") ?? null
}

function getHubspotOcupacionActualValue(rawValue: string): string | null {
  const normalized = normalizeEnumToken(rawValue)
  return HUBSPOT_OCUPACION_ACTUAL_ALLOWED.get(normalized) ?? null
}

async function getContactPropertyNames(): Promise<ContactPropertyMeta> {
  if (!contactPropertiesPromise) {
    contactPropertiesPromise = hsGet("/crm/v3/properties/contacts")
      .then((data) => {
        const names = new Set<string>()
        const enumValueMaps: Record<string, Map<string, string>> = {}

        for (const property of data.results ?? []) {
          const name = String(property?.name ?? "")
          if (!name) continue
          names.add(name)

          const options = Array.isArray(property?.options) ? property.options : []
          if (!options.length) continue

          const map = new Map<string, string>()
          for (const option of options) {
            const optionValue = String(option?.value ?? "").trim()
            if (!optionValue) continue

            map.set(normalizeEnumToken(optionValue), optionValue)
            const optionLabel = String(option?.label ?? "").trim()
            if (optionLabel) map.set(normalizeEnumToken(optionLabel), optionValue)
          }

          if (map.size) enumValueMaps[name] = map
        }

        return { names, enumValueMaps }
      })
      .catch(() => ({ names: new Set<string>(), enumValueMaps: {} }))
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
  // El search de HubSpot devuelve máximo 200 por página: paginamos para no
  // perder leads cuando un aliado supera esa cifra.
  async function searchPage(properties: string[], after?: string) {
    const body: Record<string, unknown> = {
      filterGroups: [{
        filters: [{ propertyName: "company", operator: "EQ", value: allyTagValue(tagId) }],
      }],
      properties,
      limit: 200,
      sorts: [{ propertyName: "createdate", direction: "DESCENDING" }],
    }
    if (after) body.after = after
    return hsPost("/crm/v3/objects/contacts/search", body)
  }

  const contacts: { id: string; properties: Record<string, string> }[] = []
  let after: string | undefined
  let useProfileProp = true

  do {
    let page
    try {
      page = await searchPage(useProfileProp ? [...CONTACT_PROPS.split(","), PROFILE_PROP] : CONTACT_PROPS.split(","), after)
    } catch {
      // El portal puede no tener la propiedad de perfil: reintentamos sin ella.
      useProfileProp = false
      page = await searchPage(CONTACT_PROPS.split(","), after)
    }
    contacts.push(...(page.results ?? []))
    after = page.paging?.next?.after
  } while (after)

  if (contacts.length === 0) return []

  const ownerIds = [...new Set(
    contacts.map((c: { properties: Record<string, string> }) => c.properties.hubspot_owner_id).filter(Boolean)
  )] as string[]

  const ownersMap = await getOwnersBatch(ownerIds)

  // Fetch deal associations to get dynamic stages
  const contactIds = contacts.map((c: { id: string }) => c.id)
  let dealsMap: Record<string, string> = {}
  // Los asesores registran las notas sobre el NEGOCIO, no sobre el contacto,
  // así que necesitamos el mapa contacto → negocios para traerlas.
  const contactToDeal: Record<string, string[]> = {}

  try {
    const associations = await hsBatchRead("/crm/v3/associations/contacts/deals/batch/read", contactIds)

    const dealIds = new Set<string>()

    for (const row of associations) {
      const cId = String(row.from?.id ?? row.fromId ?? "")
      if (!cId) continue
      const dIds = (row.to ?? []).map((d: any) => String(d.id ?? d.toId ?? "")).filter(Boolean)
      contactToDeal[cId] = dIds
      dIds.forEach((id: string) => dealIds.add(id))
    }

    if (dealIds.size > 0) {
      const dealsBatch = await hsBatchRead("/crm/v3/objects/deals/batch/read", [...dealIds], {
        properties: ["dealstage"],
      })

      const dealStageById: Record<string, string> = {}
      for (const deal of dealsBatch) {
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

  const notesMap = await getNotesByContact(contactIds, contactToDeal)

  // Fetch the latest dynamic pipeline stages for labels
  const pipelineStages = await getPipelineStages()
  const dynamicStageMap = Object.fromEntries(pipelineStages.map(s => [s.id, s.nombre]))

  return contacts.map((c: { id: string; properties: Record<string, string> }) => {
    const p = c.properties ?? {}
    const owner = p.hubspot_owner_id ? ownersMap[p.hubspot_owner_id] : null
    const nombre = `${p.firstname ?? ""} ${p.lastname ?? ""}`.trim() || p.email || "Sin nombre"

    const stageId = dealsMap[c.id] || CONTACT_STAGE_DEFAULT
    const stageLabel = dynamicStageMap[stageId] || STAGE_MAP[stageId] || "Contacto inicial"
    const notasContacto = notesMap[c.id] ?? []

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
      // Perfilamiento: propiedad del contacto, o la nota de perfil más reciente.
      notas: cleanBackupNotes(p[PROFILE_PROP] ?? notasContacto.find(n => n.esPerfil)?.texto ?? ""),
      // Historial completo de notas (todas, con autor y fecha).
      notasHistorial: notasContacto,
      contactId: c.id,
    }
  })
}

export async function getAllLeadsCountsByAlly(): Promise<Record<string, number>> {
  try {
    const counts: Record<string, number> = {}
    let after: string | undefined = undefined
    let hasMore = true

    while (hasMore) {
      const body: any = {
        filterGroups: [{
          filters: [{ propertyName: "company", operator: "CONTAINS_TOKEN", value: ALLY_TAG_PREFIX }],
        }],
        properties: ["company"],
        limit: 100,
      }
      if (after) {
        body.after = after
      }

      const data = await hsPost("/crm/v3/objects/contacts/search", body)
      
      for (const res of data.results ?? []) {
        const company = res.properties?.company || ""
        if (company.startsWith(ALLY_TAG_PREFIX)) {
          const tagId = company.replace(ALLY_TAG_PREFIX, "")
          counts[tagId] = (counts[tagId] || 0) + 1
        }
      }

      after = data.paging?.next?.after
      hasMore = !!after
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

export type LeadNote = {
  id: string
  texto: string
  fecha: string          // ISO
  fechaLabel: string     // dd/mm/yyyy hh:mm
  autor: string
  autorEmail: string
  esPerfil: boolean
}

/** Los cuerpos de nota de HubSpot vienen en HTML; los pasamos a texto plano. */
function htmlToPlainText(html: string): string {
  return html
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|tr|h[1-6])>/gi, "\n")
    .replace(/<li[^>]*>/gi, "• ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\n{3,}/g, "\n\n")
    .trim()
}

/** Devuelve objeto origen → ids de notas asociadas. */
async function readNoteAssociations(
  fromType: "contacts" | "deals",
  fromIds: string[],
): Promise<Record<string, string[]>> {
  const map: Record<string, string[]> = {}
  if (!fromIds.length) return map

  const associations = await hsBatchRead(`/crm/v3/associations/${fromType}/notes/batch/read`, fromIds)

  for (const row of associations) {
    const fromId = String(row.from?.id ?? row.fromId ?? "")
    if (!fromId) continue
    const noteIds = (row.to ?? [])
      .map((n: { id?: string | number; toId?: string | number }) => String(n.id ?? n.toId ?? ""))
      .filter(Boolean)

    if (!noteIds.length) continue
    map[fromId] = [...(map[fromId] ?? []), ...noteIds]
  }

  return map
}

/**
 * Trae TODAS las notas de cada contacto: las asociadas al contacto y — sobre todo —
 * las que los asesores escriben sobre el NEGOCIO asociado, con autor y fecha.
 */
async function getNotesByContact(
  contactIds: string[],
  contactToDeal: Record<string, string[]> = {},
): Promise<Record<string, LeadNote[]>> {
  if (!contactIds.length) return {}

  try {
    const dealIds = [...new Set(Object.values(contactToDeal).flat())]

    const [notesByContactId, notesByDealId] = await Promise.all([
      readNoteAssociations("contacts", contactIds),
      readNoteAssociations("deals", dealIds),
    ])

    const contactToNoteIds: Record<string, string[]> = {}
    const allNoteIds = new Set<string>()

    for (const contactId of contactIds) {
      const noteIds = [
        ...(notesByContactId[contactId] ?? []),
        ...(contactToDeal[contactId] ?? []).flatMap(dealId => notesByDealId[dealId] ?? []),
      ]
      if (!noteIds.length) continue
      contactToNoteIds[contactId] = noteIds
      for (const noteId of noteIds) allNoteIds.add(noteId)
    }

    if (!allNoteIds.size) return {}

    type RawNote = { body: string; ts: number; ownerId: string; createdById: string }
    const notesById: Record<string, RawNote> = {}

    {
      const notesBatch = await hsBatchRead("/crm/v3/objects/notes/batch/read", [...allNoteIds], {
        properties: [
          "hs_note_body", "hs_timestamp", "hs_createdate",
          "hubspot_owner_id", "hs_created_by", "hs_created_by_user_id",
        ],
      })

      for (const note of notesBatch) {
        const props = note.properties ?? {}
        const body = String(props.hs_note_body ?? "")
        const ts = Date.parse(String(props.hs_timestamp ?? props.hs_createdate ?? "")) || 0
        notesById[String(note.id)] = {
          body,
          ts,
          ownerId: String(props.hubspot_owner_id ?? ""),
          createdById: String(props.hs_created_by ?? props.hs_created_by_user_id ?? ""),
        }
      }
    }

    // Resolvemos los nombres de quienes escribieron las notas.
    const authorIds = [...new Set(
      Object.values(notesById).flatMap(n => [n.ownerId, n.createdById]).filter(Boolean)
    )]
    const authorsMap = await getOwnersBatch(authorIds).catch(() => ({} as Record<string, { nombre: string; email: string }>))

    const result: Record<string, LeadNote[]> = {}

    for (const contactId of Object.keys(contactToNoteIds)) {
      const seen = new Set<string>()
      const notes: LeadNote[] = []

      for (const noteId of contactToNoteIds[contactId]) {
        if (seen.has(noteId)) continue
        seen.add(noteId)

        const raw = notesById[noteId]
        if (!raw) continue

        const texto = cleanBackupNotes(htmlToPlainText(raw.body))
        if (!texto) continue

        const author = authorsMap[raw.ownerId] ?? authorsMap[raw.createdById] ?? null
        const fecha = raw.ts ? new Date(raw.ts).toISOString() : ""

        notes.push({
          id: noteId,
          texto,
          fecha,
          fechaLabel: raw.ts
            ? new Date(raw.ts).toLocaleString("es-CO", {
                day: "2-digit", month: "2-digit", year: "numeric",
                hour: "2-digit", minute: "2-digit",
              })
            : "",
          autor: author?.nombre || "Portal de aliados",
          autorEmail: author?.email || "",
          esPerfil: isProfileNote(raw.body),
        })
      }

      notes.sort((a, b) => (Date.parse(b.fecha) || 0) - (Date.parse(a.fecha) || 0))
      if (notes.length) result[contactId] = notes
    }

    return result
  } catch (err) {
    console.error("[getNotesByContact]", err)
    return {}
  }
}

// ─── Duplicados ───────────────────────────────────────────

/** El contacto ya existe en HubSpot bajo otro aliado. */
export class ContactoDuplicadoError extends Error {
  /** Etiqueta del aliado que ya tiene el contacto. Solo se le muestra al admin. */
  readonly aliadoActual: string

  constructor(aliadoActual: string) {
    super("Este contacto ya está registrado en HubSpot y pertenece a otro aliado.")
    this.name = "ContactoDuplicadoError"
    this.aliadoActual = aliadoActual
  }

  /** Mensaje para el aliado: sin revelar de quién es el contacto. */
  get mensajeParaAliado(): string {
    return "Este correo ya está registrado en HubSpot por otro aliado, así que no se puede volver a registrar. " +
      "Si crees que es un error, contacta al administrador."
  }

  /** Mensaje para el admin: con el aliado dueño del contacto. */
  get mensajeParaAdmin(): string {
    return `Este contacto ya está registrado en HubSpot por el aliado @${this.aliadoActual}. ` +
      "No se puede volver a registrar con el mismo correo."
  }
}

/** Saca el id del mensaje 409 de HubSpot: "Contact already exists. Existing ID: 123". */
function extraerIdDeConflicto(mensaje: string): string | null {
  return mensaje.match(/Existing ID:\s*(\d+)/i)?.[1] ?? null
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
  parentEtiqueta?: string
  mensaje?: string
  notas?: string
}) {
  let contactId: string | null = null
  const profileDescription = cleanBackupNotes(params.notas ?? "")
  const profilePropertyReady = profileDescription ? await ensureContactProfileProperty() : false
  const { names: contactPropertyNames, enumValueMaps } = await getContactPropertyNames()

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
    if (contactPropertyNames.has("ocupacion_actual_2")) {
      // Esta propiedad es un catálogo cerrado en este portal.
      // Solo aceptamos los valores exactos permitidos por HubSpot.
      const ocupacionHubspot = getHubspotOcupacionActualValue(params.profesion)
      if (ocupacionHubspot) properties.ocupacion_actual_2 = ocupacionHubspot
    }
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
  if (params.parentEtiqueta && contactPropertyNames.has("etiqueta_del_aliado_padre")) properties.etiqueta_del_aliado_padre = params.parentEtiqueta
  if (params.tuvoVisa !== undefined && contactPropertyNames.has("tiene_visa_")) properties.tiene_visa_ = params.tuvoVisa ? "SI" : "NO"
  if (params.mensaje && contactPropertyNames.has("escriba_su_mensaje")) properties.escriba_su_mensaje = params.mensaje

  if (profilePropertyReady && profileDescription) properties[PROFILE_PROP] = profileDescription

  let yaExistia = false

  try {
    const contactData = await hsPost("/crm/v3/objects/contacts", { properties })
    contactId = contactData.id
  } catch (err) {
    const mensaje = (err as Error).message
    console.log("[createContact] No se pudo crear el contacto (puede que ya exista):", mensaje)

    // HubSpot devuelve 409 con el id en el texto: "Contact already exists. Existing ID: 123".
    // Es más confiable que buscar por correo, porque el correo puede estar
    // registrado como secundario y la búsqueda no lo encuentra.
    contactId = extraerIdDeConflicto(mensaje)

    if (!contactId) {
      try {
        const search = await hsPost("/crm/v3/objects/contacts/search", {
          filterGroups: [{
            filters: [{ propertyName: "email", operator: "EQ", value: params.email.toLowerCase() }],
          }],
          properties: ["email"],
          limit: 1,
        })
        if (search.results?.length > 0) contactId = search.results[0].id
      } catch (searchErr) {
        console.error("[createContact] No se pudo buscar el contacto existente:", (searchErr as Error).message)
      }
    }

    if (!contactId) throw new Error("No fue posible crear ni actualizar el contacto en HubSpot")

    yaExistia = true

    // Si el contacto ya pertenece a OTRO aliado, no se lo quitamos: avisamos.
    const actual = await hsGet(`/crm/v3/objects/contacts/${contactId}`, { properties: "company,firstname,lastname" })
      .catch(() => null)
    const duenoActual = String(actual?.properties?.company ?? "")

    if (duenoActual.startsWith(ALLY_TAG_PREFIX) && duenoActual !== allyTagValue(params.tagId)) {
      throw new ContactoDuplicadoError(duenoActual.replace(ALLY_TAG_PREFIX, ""))
    }

    await hsPatch(`/crm/v3/objects/contacts/${contactId}`, { properties })
    console.log(`[createContact] Contacto existente actualizado: ${contactId}`)
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
    yaExistia,
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
