/**
 * Script para verificar qué devuelve getDealsByTag('javier.mayorga')
 * Uso: node scripts/test-get-deals.mjs
 */

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
  const res = await fetch(`https://api.hubapi.com${path}`, {
    method: "POST",
    headers: HEADS,
    body: JSON.stringify(body)
  })
  if (!res.ok) throw new Error(`Error ${res.status}: ${await res.text()}`)
  return res.json()
}

async function main() {
  console.log("Probando el POST /search con etiqueta 'javier.mayorga'...")
  
  const DEAL_PROPS = "dealname,dealstage,pipeline,etiqueta_aliado,hubspot_owner_id,createdate,closedate,amount,description"
  
  const data = await hsPost("/crm/v3/objects/deals/search", {
    filterGroups: [{
      filters: [{ propertyName: "etiqueta_aliado", operator: "EQ", value: "javier.mayorga" }]
    }],
    properties: DEAL_PROPS.split(","),
    limit: 10
  })

  console.log(`\nResultados: ${data.total}`)
  data.results.forEach((deal) => {
    console.log(`- ${deal.properties.dealname} (Etapa: ${deal.properties.dealstage}, Tag: ${deal.properties.etiqueta_aliado})`)
  })
}

main().catch(console.error)
