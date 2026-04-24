import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { connectDB } from "@/lib/mongodb"
import User from "@/lib/models/User"
import Invitation from "@/lib/models/Invitation"
import { signToken, cookieName } from "@/lib/auth"

export async function POST(req: NextRequest) {
  try {
    const { nombre, apellido, email, telefono, password, token: inviteToken } = await req.json()

    if (!nombre || !apellido || !email || !telefono || !password || !inviteToken) {
      return NextResponse.json({ error: "Todos los campos son requeridos, incluyendo la invitación" }, { status: 400 })
    }

    await connectDB()

    // Validar invitación
    const invitation = await Invitation.findOne({ token: inviteToken, usada: false })
    if (!invitation) {
      return NextResponse.json({ error: "La invitación es inválida o ya fue utilizada" }, { status: 403 })
    }

    const existe = await User.findOne({ email: email.toLowerCase() })
    if (existe) {
      return NextResponse.json({ error: "El correo ya está registrado" }, { status: 409 })
    }

    // Generar etiqueta única: nombre.apellido
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
      telefono: String(telefono).trim(),
      password: hash,
      etiqueta,
      hubspotTagId: etiqueta,
    })

    // Marcar invitación como usada
    invitation.usada = true
    await invitation.save()

    const token = signToken({
      userId:   user._id.toString(),
      email:    user.email,
      etiqueta: user.etiqueta,
      nombre:   user.nombre,
      apellido: user.apellido,
      role:     "aliado",
    })

    const res = NextResponse.json({
      ok: true,
      user: { nombre: user.nombre, apellido: user.apellido, email: user.email, telefono: user.telefono, etiqueta: user.etiqueta },
    })

    res.cookies.set(cookieName(), token, {
      httpOnly: true,
      secure:   process.env.NODE_ENV === "production",
      sameSite: "lax",
      maxAge:   60 * 60 * 24 * 7,
      path:     "/",
    })

    return res
  } catch (err) {
    console.error("[register]", err)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
