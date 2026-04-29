import { NextResponse } from "next/server"
import { resend } from "@/lib/resend"
import { connectDB } from "@/lib/mongodb"
import Invitation from "@/lib/models/Invitation"
import { getInvitationEmail } from "@/lib/emails"
import crypto from "crypto"

export async function POST(req: Request) {
  try {
    await connectDB()
    const { nombre, email } = await req.json()

    if (!nombre || !email) {
      return NextResponse.json({ error: "Nombre y email son requeridos" }, { status: 400 })
    }

    // Generar token único
    const token = crypto.randomBytes(32).toString("hex")

    // Guardar invitación
    await Invitation.create({ nombre, email, token })

    // Crear link
    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"
    const inviteLink = `${baseUrl}/registro?token=${token}&email=${encodeURIComponent(email)}&nombre=${encodeURIComponent(nombre)}`

    if (!resend) {
      return NextResponse.json({ error: "Servicio de correo no configurado" }, { status: 500 })
    }

    // Enviar correo
    const { data, error } = await resend.emails.send({
      from: "Global Express <portal@gerpartners.com>",
      to: [email],
      subject: "Invitación Exclusiva: Únete como Aliado de Global Express",
      html: getInvitationEmail(nombre, email, inviteLink),
    })

    if (error) {
      console.error("Resend Error:", error)
      return NextResponse.json({ error: "Error al enviar el correo" }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error: any) {
    console.error("Invite API Error:", error)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}
