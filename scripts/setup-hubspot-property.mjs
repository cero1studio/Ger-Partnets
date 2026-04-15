/**
 * Script para crear la propiedad personalizada "etiqueta_aliado" en HubSpot.
 * 
 * Uso:
 * node scripts/setup-hubspot-property.mjs
 */

import { readFileSync } from "fs"
import { resolve } from "path"

// Cargar .env.local
const envPath = resolve(process.cwd(), ".env.local")
const envLines = readFileSync(envPath, "utf-8").split("\n")
for (const line of envLines) {
  const [key, ...rest] = line.trim().split("=")
  if (key && !key.startsWith("#")) process.env[key] = rest.join("=")
}

const TOKEN = process.env.HUBSPOT_TOKEN
if (!TOKEN) {
  console.error("❌ HUBSPOT_TOKEN no definido")
  process.exit(1)
}

const HEADS = { Authorization: `Bearer ${TOKEN}`, "Content-Type": "application/json" }

async function hsPost(path, body) {
  const res = await fetch(`https://api.hubapi.com${path}`, {
    method: "POST",
    headers: HEADS,
    body: JSON.stringify(body)
  })
  if (!res.ok) {
    const err = await res.text()
    throw new Error(`Error ${res.status}: ${err}`)
  }
  return res.json()
}

async function main() {
  console.log("Creando propiedad 'etiqueta_aliado' en los Deals de HubSpot...")
  
  try {
    const result = await hsPost("/crm/v3/properties/deals", {
      name: "etiqueta_aliado",
      label: "Etiqueta del Aliado",
      type: "string",
      fieldType: "text",
      groupName: "dealinformation",
      description: "Almacena el nombre de usuario (@) del partner que registró este lead desde la app Ger-Partners.",
      hidden: false,
      hasUniqueValue: false
    })
    
    console.log("✅ Propiedad creada exitosamente en HubSpot!")
    console.log(`Nombre interno: ${result.name}`)
    console.log(`Label visible: ${result.label}`)
  } catch (error) {
    if (error.message.includes("Property 'etiqueta_aliado' already exists")) {
      console.log("✅ La propiedad 'etiqueta_aliado' ya existe. Todo listo.")
    } else {
      console.error("❌ Falló la creación:", error.message)
    }
  }
}

main()
