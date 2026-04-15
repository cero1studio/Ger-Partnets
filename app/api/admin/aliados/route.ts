import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { getSession } from "@/lib/auth"
import { connectDB } from "@/lib/mongodb"
import User from "@/lib/models/User"

async function requireAdmin() {
  const session = await getSession()
  if (!session || session.role !== "admin") return null
  return session
}

// GET /api/admin/aliados — lista todos los aliados
export async function GET() {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 })
  }

  await connectDB()
  const aliados = await User.find({ role: "aliado" })
    .select("-password")
    .sort({ createdAt: -1 })
    .lean()

  return NextResponse.json({ aliados })
}

// POST /api/admin/aliados — crear nuevo aliado desde el admin
export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 })
  }

  try {
    const { nombre, apellido, email, password } = await req.json()

    if (!nombre || !apellido || !email || !password) {
      return NextResponse.json({ error: "Todos los campos son requeridos" }, { status: 400 })
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "La contraseña debe tener al menos 6 caracteres" }, { status: 400 })
    }

    await connectDB()

    const existe = await User.findOne({ email: email.toLowerCase() })
    if (existe) {
      return NextResponse.json({ error: "El correo ya está registrado" }, { status: 409 })
    }

    const baseEtiqueta = `${nombre.toLowerCase().trim().replace(/\s+/g, "")}.${apellido.toLowerCase().trim().replace(/\s+/g, "")}`
    let etiqueta = baseEtiqueta
    let suffix = 1
    while (await User.findOne({ etiqueta })) {
      etiqueta = `${baseEtiqueta}${suffix++}`
    }

    const hash = await bcrypt.hash(password, 10)

    const user = await User.create({
      nombre,
      apellido,
      email: email.toLowerCase(),
      password: hash,
      etiqueta,
      hubspotTagId: etiqueta,
      role: "aliado",
    })

    return NextResponse.json({
      ok: true,
      aliado: {
        _id: user._id,
        nombre: user.nombre,
        apellido: user.apellido,
        email: user.email,
        etiqueta: user.etiqueta,
        activo: user.activo,
        createdAt: user.createdAt,
      },
    })
  } catch (err) {
    console.error("[admin/aliados POST]", err)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
