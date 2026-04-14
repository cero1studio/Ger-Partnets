import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { connectDB } from "@/lib/mongodb"
import User from "@/lib/models/User"
import { getDealsByTag, createDeal } from "@/lib/hubspot"

// GET /api/leads — devuelve los deals del aliado logueado
export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

  try {
    await connectDB()
    const user = await User.findById(session.userId)
    if (!user) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })

    const tagId = user.hubspotTagId ?? user.etiqueta
    const leads = await getDealsByTag(tagId)
    return NextResponse.json({ leads })
  } catch (err) {
    console.error("[GET /api/leads]", err)
    return NextResponse.json({ error: "Error al obtener leads de HubSpot" }, { status: 500 })
  }
}

// POST /api/leads — crea un deal en HubSpot para el aliado
export async function POST(req: NextRequest) {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

  try {
    const body = await req.json()
    const { nombre, apellido, email, telefono, ciudad, programa, notas } = body

    if (!nombre || !apellido || !email || !telefono) {
      return NextResponse.json({ error: "Nombre, apellido, email y teléfono son requeridos" }, { status: 400 })
    }

    await connectDB()
    const user = await User.findById(session.userId)
    if (!user) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })

    const tagId = user.hubspotTagId ?? user.etiqueta

    const result = await createDeal({ nombre, apellido, email, telefono, ciudad, programa, tagId, notas })
    return NextResponse.json({ ok: true, ...result }, { status: 201 })
  } catch (err) {
    console.error("[POST /api/leads]", err)
    return NextResponse.json({ error: "Error al crear lead en HubSpot" }, { status: 500 })
  }
}
