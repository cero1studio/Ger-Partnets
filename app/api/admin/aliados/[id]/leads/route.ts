import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { connectDB } from "@/lib/mongodb"
import User from "@/lib/models/User"
import { getContactsByTag, createContact } from "@/lib/hubspot"

async function requireAdmin() {
  const session = await getSession()
  if (!session || session.role !== "admin") return null
  return session
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 })
  }

  const { id } = await params

  try {
    await connectDB()
    const user = await User.findById(id)
    if (!user || user.role === "admin") {
      return NextResponse.json({ error: "Aliado no encontrado" }, { status: 404 })
    }

    const tagId = user.hubspotTagId ?? user.etiqueta
    const leads = await getContactsByTag(tagId)

    return NextResponse.json({ leads })
  } catch (err) {
    console.error("[admin/aliados/[id]/leads GET]", err)
    return NextResponse.json({ error: "Error interno del servidor" }, { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdmin())) {
    return NextResponse.json({ error: "No autorizado" }, { status: 403 })
  }

  try {
    const { id } = await params
    const body = await req.json()
    const {
      nombre, apellido, email, telefono, nacionalidad, programa,
      tuvoVisa, tipoVisa, puedeCubrirCostos, profesion, nivelEscolaridad,
      notas,
    } = body

    if (!nombre || !apellido || !email || !telefono) {
      return NextResponse.json({ error: "Nombre, apellido, email y teléfono son requeridos" }, { status: 400 })
    }

    await connectDB()
    const user = await User.findById(id)
    if (!user || user.role === "admin") {
      return NextResponse.json({ error: "Aliado no encontrado" }, { status: 404 })
    }

    const tagId = user.hubspotTagId ?? user.etiqueta
    const aliadoUsername = user.etiqueta

    let parentEtiqueta: string | null = null
    if (user.parentId) {
      const parentUser = await User.findById(user.parentId)
      if (parentUser) parentEtiqueta = parentUser.etiqueta
    }

    const perfilLines = [
      `[Agregado por Admin a nombre de ${user.nombre}]`,
      `[Email de Respaldo]: ${email}`,
      `[Teléfono de Respaldo]: ${telefono}`,
      nacionalidad   ? `Nacionalidad: ${nacionalidad}` : null,
      programa       ? `Programa: ${programa}` : null,
      profesion      ? `Profesión: ${profesion}` : null,
      nivelEscolaridad ? `Escolaridad: ${nivelEscolaridad}` : null,
      tuvoVisa !== undefined ? `Tuvo visa: ${tuvoVisa ? `Sí — ${tipoVisa ?? ""}`.trim() : "No"}` : null,
      puedeCubrirCostos ? `Cubre costos ($23,990): ${
        puedeCubrirCostos === "si" ? "Sí" :
        puedeCubrirCostos === "con-financiamiento" ? "Con financiamiento" : "No"
      }` : null,
      parentEtiqueta ? `Aliado Padre: @${parentEtiqueta}` : null,
      notas ? `Notas: ${notas}` : null,
    ].filter(Boolean)

    const description = perfilLines.join("\n")

    const result = await createContact({
      nombre,
      apellido,
      email,
      telefono,
      nacionalidad,
      programa,
      tuvoVisa,
      tipoVisa,
      puedeCubrirCostos,
      profesion,
      nivelEscolaridad,
      tagId,
      aliadoUsername,
      parentEtiqueta: parentEtiqueta ?? undefined,
      mensaje: notas,
      notas: description,
    })

    return NextResponse.json({ ok: true, ...result }, { status: 201 })
  } catch (err) {
    console.error("[admin/aliados/[id]/leads POST]", err)
    return NextResponse.json({ error: "Error al registrar contacto en HubSpot" }, { status: 500 })
  }
}
