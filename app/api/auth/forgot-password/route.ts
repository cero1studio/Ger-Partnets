import { NextResponse } from "next/server"
import { resend } from "@/lib/resend"
import dbConnect from "@/lib/mongodb"
import User from "@/lib/models/User"
import { getResetPasswordEmail } from "@/lib/emails"
import crypto from "crypto"

export async function POST(req: Request) {
  try {
    await dbConnect()
    const { email } = await req.json()

    if (!email) {
      return NextResponse.json({ error: "El email es requerido" }, { status: 400 })
    }

    const user = await User.findOne({ email: email.toLowerCase() })
    if (!user) {
      // Por seguridad, no revelamos si el usuario existe o no
      return NextResponse.json({ success: true })
    }

    // Generar token y expiración (1 hora)
    const token = crypto.randomBytes(32).toString("hex")
    const expiry = new Date(Date.now() + 3600000)

    user.resetToken = token
    user.resetTokenExpiry = expiry
    await user.save()

    // Crear link
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    const resetLink = `${baseUrl}/restablecer-contrasena?token=${token}`

    // Enviar correo
    const { error } = await resend.emails.send({
      from: "Global Express <seguridad@gerpartners.com>",
      to: [user.email],
      subject: "Restablecer tu contraseña - Global Express",
      html: getResetPasswordEmail(user.nombre, resetLink),
    })

    if (error) {
      console.error("Resend Error:", error)
      return NextResponse.json({ error: "Error al enviar el correo" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error("Forgot Password API Error:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
