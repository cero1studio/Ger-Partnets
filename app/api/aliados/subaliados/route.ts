import { NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { connectDB } from "@/lib/mongodb"
import User from "@/lib/models/User"
import { getAllLeadsCountsByAlly } from "@/lib/hubspot"

export async function GET() {
  const session = await getSession()
  if (!session) return NextResponse.json({ error: "No autenticado" }, { status: 401 })

  try {
    await connectDB()
    const user = await User.findById(session.userId)
    if (!user) return NextResponse.json({ error: "Usuario no encontrado" }, { status: 404 })

    // Find all users whose parentId is the current user
    const subaliados = await User.find({ parentId: user._id, activo: true })
      .select("nombre apellido email etiqueta telefono createdAt")
      .sort({ createdAt: -1 })
      .lean()

    // Get lead counts from HubSpot for all allies
    const leadCounts = await getAllLeadsCountsByAlly()

    const result = subaliados.map((sub: any) => ({
      _id: sub._id.toString(),
      nombre: sub.nombre,
      apellido: sub.apellido,
      email: sub.email,
      etiqueta: sub.etiqueta,
      telefono: sub.telefono || "",
      createdAt: sub.createdAt,
      leadsCount: leadCounts[sub.etiqueta] || 0,
    }))

    // Also get the parent user's own lead count
    const parentLeads = leadCounts[user.etiqueta] || 0

    return NextResponse.json({
      subaliados: result,
      totalSubaliados: result.length,
      totalLeadsRed: result.reduce((acc: number, s: any) => acc + s.leadsCount, 0) + parentLeads,
      parentLeads,
      refLink: `${process.env.NEXT_PUBLIC_BASE_URL || ""}/registro?ref=${user.etiqueta}`,
    })
  } catch (err) {
    console.error("[GET /api/aliados/subaliados]", err)
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
