import { readFileSync } from "fs"
import { resolve } from "path"

const envPath = resolve(process.cwd(), ".env.local")
const envLines = readFileSync(envPath, "utf-8").split("\n")
for (const line of envLines) {
  const [key, ...rest] = line.trim().split("=")
  if (key && !key.startsWith("#")) process.env[key] = rest.join("=")
}

const TOKEN = process.env.HUBSPOT_TOKEN
const HEADS = { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" }

async function hsPost(path, body) {
  const res = await fetch(`https://api.hubapi.com${path}`, { method: "POST", headers: HEADS, body: JSON.stringify(body) })
  if (!res.ok) throw new Error(await res.text())
  return res.json()
}

async function getContactsBatch(ids) {
  if (!ids.length) return {}
  const data = await hsPost("/crm/v3/objects/contacts/batch/read", {
    inputs: ids.map(id => ({ id })),
    properties: ["firstname", "lastname", "email", "phone", "mobilephone", "city", "country"]
  })
  const result = {}
  for (const c of data.results ?? []) result[c.id] = c.properties
  return result
}

async function main() {
  const data = await hsPost("/crm/v3/objects/deals/search", {
    filterGroups: [{ filters: [{ propertyName: "etiqueta_aliado", operator: "EQ", value: "javier.mayorga" }] }],
    properties: ["dealname", "dealstage", "pipeline", "etiqueta_aliado", "hubspot_owner_id", "createdate", "closedate", "amount", "description"],
    associations: ["contacts"],
    limit: 200,
  })

  const rawDeals = data.results ?? []
  
  const contactIds = [...new Set(
    rawDeals.flatMap(d => (d.associations?.contacts?.results ?? []).map(c => c.id))
  )]

  console.log("Contact IDs a buscar:", contactIds)
  
  const contactsMap = await getContactsBatch(contactIds)
  
  const formattedDeals = rawDeals.map(d => {
    const p = d.properties
    const contacts = (d.associations?.contacts?.results ?? []).map(c => ({ id: c.id, ...contactsMap[c.id] }))
    const contact = contacts[0] ?? {}
    return {
      id: d.id,
      nombre: p.dealname ?? `${contact.firstname ?? ""} ${contact.lastname ?? ""}`.trim(),
      email: contact.email ?? "",
      etapa: p.dealstage ?? "",
    }
  })

  console.log("FORMATTED DEALS:", formattedDeals)
}

main().catch(console.error)
