import { readFileSync } from "fs"
import { resolve } from "path"
import mongoose from "mongoose"

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
  return res.json()
}

async function main() {
  await mongoose.connect(process.env.MONGODB_URI)
  const User = mongoose.connection.collection("users")
  const javier = await User.findOne({ email: "javier.mayorga@ger.com" }) || await User.findOne({ etiqueta: "javier.mayorga" })
  console.log("Usuario en BD:", javier ? { email: javier.email, etiqueta: javier.etiqueta, hubspotTagId: javier.hubspotTagId } : "No encontrado")
  
  if (javier) {
    const tagId = javier.hubspotTagId ?? javier.etiqueta
    console.log("Buscando en HubSpot con tagId:", tagId)
    const data = await hsPost("/crm/v3/objects/deals/search", {
      filterGroups: [{ filters: [{ propertyName: "etiqueta_aliado", operator: "EQ", value: tagId }] }],
      properties: ["dealname", "dealstage", "etiqueta_aliado"],
      limit: 10
    })
    console.log(`Deals encontrados para ${tagId}: ${data.total}`)
    data.results?.forEach(d => console.log(`- ${d.properties.dealname}`))
  }
  process.exit(0)
}
main().catch(console.error)
