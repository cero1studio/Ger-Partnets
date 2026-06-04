import { NextRequest, NextResponse } from "next/server"
import { getSession } from "@/lib/auth"
import { connectDB } from "@/lib/mongodb"
import User from "@/lib/models/User"
import { getContactsByTag } from "@/lib/hubspot"

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
