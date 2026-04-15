import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { connectDB } from "@/lib/mongodb"
import User from "@/lib/models/User"
import { signToken, cookieName } from "@/lib/auth"

export async function POST(req: NextRequest) {
  try {
    const { nombre, apellido, email, password } = await req.json()

    if (!nombre || !apellido || !email || !password) {
      return NextResponse.json({ error: "Todos los campos son requeridos" }, { status: 400 })
    }

    await connectDB()

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
      password: hash,
      etiqueta,
      hubspotTagId: etiqueta,
    })

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
      user: { nombre: user.nombre, apellido: user.apellido, email: user.email, etiqueta: user.etiqueta },
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
