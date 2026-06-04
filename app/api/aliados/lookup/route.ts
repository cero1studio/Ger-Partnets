import { NextRequest, NextResponse } from "next/server"
import { connectDB } from "@/lib/mongodb"
import User from "@/lib/models/User"

export async function GET(req: NextRequest) {
  try {
    const etiqueta = req.nextUrl.searchParams.get("etiqueta")
    if (!etiqueta) {
      return NextResponse.json({ error: "Etiqueta requerida" }, { status: 400 })
    }

    await connectDB()
    const user = await User.findOne({ etiqueta: etiqueta.toLowerCase(), activo: true })
    if (!user) {
      return NextResponse.json({ error: "Aliado no encontrado" }, { status: 404 })
    }

    return NextResponse.json({
      nombre: `${user.nombre} ${user.apellido}`,
      etiqueta: user.etiqueta,
    })
  } catch {
    return NextResponse.json({ error: "Error interno" }, { status: 500 })
  }
}
