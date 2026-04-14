import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { getSession } from "@/lib/auth"
import { connectDB } from "@/lib/mongodb"
import User from "@/lib/models/User"

export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

  try {
    const { currentPassword, newPassword } = await req.json()

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: "Campos requeridos" }, { status: 400 })
    }
    if (newPassword.length < 6) {
      return NextResponse.json({ error: "La nueva contraseña debe tener al menos 6 caracteres" }, { status: 400 })
    }

    await connectDB()
    const user = await User.findById(session.userId)
    if (!user) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })

    const match = await bcrypt.compare(currentPassword, user.password)
    if (!match) return NextResponse.json({ error: "La contraseña actual es incorrecta" }, { status: 401 })

    user.password = await bcrypt.hash(newPassword, 10)
    await user.save()

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("[change-password]", err)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
