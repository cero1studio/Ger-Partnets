import { readFileSync } from "fs"
import { resolve } from "path"
import jwt from "jsonwebtoken"

const envPath = resolve(process.cwd(), ".env.local")
const envLines = readFileSync(envPath, "utf-8").split("\n")
for (const line of envLines) {
  const [key, ...rest] = line.trim().split("=")
  if (key && !key.startsWith("#")) process.env[key] = rest.join("=")
}

const token = jwt.sign({
  userId: "60c72b2f9b1d8b00155b4444", 
  email: "test@test.com", 
  etiqueta: "javier.mayorga", 
  nombre: "Javier", 
  apellido: "Mayorga", 
  role: "aliado"
}, process.env.JWT_SECRET)

fetch("http://localhost:3000/api/leads", { headers: { Cookie: "ger_token=" + token } })
  .then(r => r.json())
  .then(data => console.log(JSON.stringify(data, null, 2)))
  .catch(console.error)
