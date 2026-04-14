import { NextRequest, NextResponse } from "next/server"
import bcrypt from "bcryptjs"
import { connectDB } from "@/lib/mongodb"
import User from "@/lib/models/User"
import { signToken, cookieName } from "@/lib/auth"

export async function POST(req: NextRequest) {
  try {
    const { email, password } = await req.json()

    if (!email || !password) {
      return NextResponse.json({ error: "Credenciales requeridas" }, { status: 400 })
    }

    await connectDB()

    const user = await User.findOne({ email: email.toLowerCase() })
    if (!user) {
      return NextResponse.json({ error: "Credenciales incorrectas" }, { status: 401 })
    }

    const match = await bcrypt.compare(password, user.password)
    if (!match) {
      return NextResponse.json({ error: "Credenciales incorrectas" }, { status: 401 })
    }

    if (!user.activo) {
      return NextResponse.json({ error: "Cuenta desactivada" }, { status: 403 })
    }

    const token = signToken({
      userId:   user._id.toString(),
      email:    user.email,
      etiqueta: user.etiqueta,
      nombre:   user.nombre,
      apellido: user.apellido,
      role:     user.role ?? "aliado",
    })

    const res = NextResponse.json({
      ok: true,
      role: user.role ?? "aliado",
      user: { nombre: user.nombre, apellido: user.apellido, email: user.email, etiqueta: user.etiqueta, role: user.role ?? "aliado" },
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
    console.error("[login]", err)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
