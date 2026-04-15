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
    const {
      nombre, apellido, email, telefono, nacionalidad, programa,
      tuvoVisa, tipoVisa, puedeCubrirCostos, profesion, nivelEscolaridad,
      nucleoFamiliar, notas,
    } = body

    if (!nombre || !apellido || !email || !telefono) {
      return NextResponse.json({ error: "Nombre, apellido, email y teléfono son requeridos" }, { status: 400 })
    }

    await connectDB()
    const user = await User.findById(session.userId)
    if (!user) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })

    const tagId = user.hubspotTagId ?? user.etiqueta

    // Codificar campos de perfilamiento en la descripción del deal
    const perfilLines = [
      `[Email de Respaldo]: ${email}`,
      `[Teléfono de Respaldo]: ${telefono}`,
      nacionalidad   ? `Nacionalidad: ${nacionalidad}` : null,
      programa       ? `Programa: ${programa}` : null,
      profesion      ? `Profesión: ${profesion}` : null,
      nivelEscolaridad ? `Escolaridad: ${nivelEscolaridad}` : null,
      nucleoFamiliar ? `Núcleo familiar: ${nucleoFamiliar} personas` : null,
      tuvoVisa !== undefined ? `Tuvo visa: ${tuvoVisa ? `Sí — ${tipoVisa ?? ""}`.trim() : "No"}` : null,
      puedeCubrirCostos ? `Cubre costos ($23,990): ${
        puedeCubrirCostos === "si" ? "Sí" :
        puedeCubrirCostos === "con-financiamiento" ? "Con financiamiento" : "No"
      }` : null,
      notas ? `Notas: ${notas}` : null,
    ].filter(Boolean)

    const description = perfilLines.join("\n")

    const result = await createDeal({ nombre, apellido, email, telefono, nacionalidad, programa, tagId, notas: description })
    return NextResponse.json({ ok: true, ...result }, { status: 201 })
  } catch (err) {
    console.error("[POST /api/leads]", err)
    return NextResponse.json({ error: "Error al crear lead en HubSpot" }, { status: 500 })
  }
}
