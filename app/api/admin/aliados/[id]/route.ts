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

// PATCH /api/admin/aliados/[id]
// body: { activo: boolean }  → bloquear/desbloquear
// body: { newPassword: string } → resetear contraseña
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 })
  }

  const { id } = await params

  try {
    const body = await req.json()
    await connectDB()

    const user = await User.findById(id)
    if (!user || user.role === "admin") {
      return NextResponse.json({ error: "Aliado no encontrado" }, { status: 404 })
    }

    if (typeof body.activo === "boolean") {
      user.activo = body.activo
    }

    if (body.newPassword) {
      if (body.newPassword.length < 6) {
        return NextResponse.json({ error: "La contraseña debe tener al menos 6 caracteres" }, { status: 400 })
      }
      user.password = await bcrypt.hash(body.newPassword, 10)
    }

    await user.save()

    return NextResponse.json({
      ok: true,
      aliado: {
        _id: user._id,
        nombre: user.nombre,
        apellido: user.apellido,
        email: user.email,
        etiqueta: user.etiqueta,
        activo: user.activo,
      },
    })
  } catch (err) {
    console.error("[admin/aliados PATCH]", err)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
