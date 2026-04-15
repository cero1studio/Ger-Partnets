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

async function main() {
  console.log("Buscando los últimos 3 deals en HubSpot...\n")
  const res = await fetch("https://api.hubapi.com/crm/v3/objects/deals/search", {
    method: "POST",
    headers: HEADS,
    body: JSON.stringify({
      sorts: [{ propertyName: "createdate", direction: "DESCENDING" }],
      properties: ["dealname", "dealstage", "pipeline", "etiqueta_aliado", "hs_tag_ids"],
      limit: 3
    })
  })
  
  const data = await res.json()
  if (!res.ok) {
    console.log(data)
    return
  }

  console.log(`Total encontrados: ${data.total}\n`)
  data.results.forEach((deal, i) => {
    console.log(`[${i+1}] Deal ID: ${deal.id}`)
    console.log(`    Nombre: ${deal.properties.dealname}`)
    console.log(`    Etapa: ${deal.properties.dealstage}`)
    console.log(`    Pipeline: ${deal.properties.pipeline}`)
    console.log(`    Etiqueta Aliado: ${deal.properties.etiqueta_aliado}`)
    console.log(`    Tags nativos (hs_tag_ids): ${deal.properties.hs_tag_ids}`)
    console.log("------------------------")
  })
}

main()