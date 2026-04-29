import { NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import User from "@/lib/models/User"
import bcrypt from "bcryptjs"

export async function POST(req: Request) {
  try {
    await connectDB()
    const { token, password } = await req.json()

    if (!token || !password) {
      return NextResponse.json({ error: "Token y contraseña son requeridos" }, { status: 400 })
    }

    const user = await User.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: new Date() },
    })

    if (!user) {
      return NextResponse.json({ error: "El enlace es inválido o ha expirado" }, { status: 400 })
    }

    // Hash nueva contraseña
    const hash = await bcrypt.hash(password, 10)
    user.password = hash
    user.resetToken = undefined
    user.resetTokenExpiry = undefined
    await user.save()

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Reset Password API Error:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
