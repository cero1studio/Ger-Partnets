import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { connectDB } from "@/lib/mongodb"
import User from "@/lib/models/User"

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ status: "No logueado, sin sesión" })

  await connectDB()
  const user = await User.findById(session.userId).lean()
  
  if (!user) return NextResponse.json({ status: "Sesión existe pero el usuario no está en MongoDB", session })

  return NextResponse.json({
    status: "Usuario en BD y Sesión activas",
    session_etiqueta: session.etiqueta,
    db_etiqueta: user.etiqueta,
    db_hubspotTagId: user.hubspotTagId,
    tagIdUsadoParaBuscarEnHubSpot: user.hubspotTagId ?? user.etiqueta
  })
}
