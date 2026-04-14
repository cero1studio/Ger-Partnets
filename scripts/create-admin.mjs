/**
 * Crea el usuario administrador en MongoDB.
 * Uso: node scripts/create-admin.mjs
 *
 * Variables de entorno requeridas en .env.local:
 *   MONGODB_URI
 */

import mongoose from "mongoose"
import bcrypt from "bcryptjs"
import { readFileSync } from "fs"
import { resolve } from "path"

// Leer .env.local manualmente
const envPath = resolve(process.cwd(), ".env.local")
const envLines = readFileSync(envPath, "utf-8").split("\n")
for (const line of envLines) {
  const [key, ...rest] = line.trim().split("=")
  if (key && !key.startsWith("#")) process.env[key] = rest.join("=")
}

const MONGODB_URI = process.env.MONGODB_URI
if (!MONGODB_URI) {
  console.error("❌  MONGODB_URI no definida en .env.local")
  process.exit(1)
}

// ── Configuración del admin ────────────────────────────────
const ADMIN = {
  nombre:   "Admin",
  apellido: "GER",
  email:    "admin@globalexpress.com",
  password: "Admin2026!",          // Cámbiala después de correr este script
  etiqueta: "admin.ger",
  role:     "admin",
  activo:   true,
}
// ──────────────────────────────────────────────────────────

const UserSchema = new mongoose.Schema({
  nombre:    String,
  apellido:  String,
  email:     { type: String, unique: true, lowercase: true },
  password:  String,
  etiqueta:  { type: String, unique: true },
  role:      { type: String, default: "aliado" },
  activo:    { type: Boolean, default: true },
  hubspotTagId: { type: String, default: null },
}, { timestamps: true })

const User = mongoose.models.User ?? mongoose.model("User", UserSchema)

async function main() {
  console.log("🔗  Conectando a MongoDB Atlas…")
  await mongoose.connect(MONGODB_URI, { bufferCommands: false })
  console.log("✅  Conectado\n")

  const exists = await User.findOne({ email: ADMIN.email })
  if (exists) {
    console.log(`⚠️   Ya existe un usuario con email: ${ADMIN.email}`)
    console.log(`     Role actual: ${exists.role}`)
    if (exists.role !== "admin") {
      exists.role = "admin"
      await exists.save()
      console.log("✅  Rol actualizado a 'admin'")
    }
  } else {
    const hash = await bcrypt.hash(ADMIN.password, 10)
    await User.create({ ...ADMIN, password: hash })
    console.log("✅  Usuario administrador creado:")
    console.log(`     Email:      ${ADMIN.email}`)
    console.log(`     Contraseña: ${ADMIN.password}`)
    console.log(`     Etiqueta:   @${ADMIN.etiqueta}`)
  }

  console.log("\n🔐  Datos de acceso al panel admin:")
  console.log(`     URL:        http://localhost:3000`)
  console.log(`     Email:      ${ADMIN.email}`)
  console.log(`     Contraseña: ${ADMIN.password}`)
  console.log("\n⚠️   Cambia la contraseña después del primer acceso.\n")

  await mongoose.disconnect()
}

main().catch(err => {
  console.error("❌  Error:", err)
  process.exit(1)
})
