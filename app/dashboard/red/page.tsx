"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Network,
  Users,
  BarChart3,
  Link2,
  Copy,
  Check,
  Mail,
  Phone,
  Calendar,
  TrendingUp,
  UserPlus,
  ExternalLink,
} from "lucide-react"

type Subaliado = {
  _id: string
  nombre: string
  apellido: string
  email: string
  etiqueta: string
  telefono: string
  createdAt: string
  leadsCount: number
}

export default function MiRedPage() {
  const router = useRouter()
  const [subaliados, setSubaliados] = useState<Subaliado[]>([])
  const [loading, setLoading] = useState(true)
  const [refLink, setRefLink] = useState("")
  const [totalLeadsRed, setTotalLeadsRed] = useState(0)
  const [parentLeads, setParentLeads] = useState(0)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetch("/api/aliados/subaliados")
      .then(r => {
        if (r.status === 401) { router.push("/"); return null }
        return r.json()
      })
      .then(data => {
        if (data) {
          setSubaliados(data.subaliados ?? [])
          setRefLink(data.refLink ?? "")
          setTotalLeadsRed(data.totalLeadsRed ?? 0)
          setParentLeads(data.parentLeads ?? 0)
        }
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [router])

  const copyLink = async () => {
    if (!refLink) return
    await navigator.clipboard.writeText(refLink)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-sm">Cargando tu red...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Network className="w-6 h-6 text-primary" />
          Mi Red de Subaliados
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Invita aliados a tu red y monitorea su desempeño.
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Subaliados</p>
                <p className="text-3xl font-black text-foreground mt-1">{subaliados.length}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                <Users className="w-6 h-6 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-emerald-500/5 to-emerald-500/10 border-emerald-500/20">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Leads Totales (Red)</p>
                <p className="text-3xl font-black text-foreground mt-1">{totalLeadsRed}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                <TrendingUp className="w-6 h-6 text-emerald-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/5 to-blue-500/10 border-blue-500/20">
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Mis Leads Propios</p>
                <p className="text-3xl font-black text-foreground mt-1">{parentLeads}</p>
              </div>
              <div className="w-12 h-12 rounded-xl bg-blue-500/10 flex items-center justify-center">
                <BarChart3 className="w-6 h-6 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Referral Link */}
      <Card className="border-primary/20">
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-semibold flex items-center gap-2">
            <Link2 className="w-4 h-4 text-primary" />
            Tu Link de Afiliación
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            Comparte este enlace con personas que quieran unirse como subaliados bajo tu red.
          </p>
          <div className="flex gap-2">
            <Input
              readOnly
              value={refLink}
              className="bg-muted/30 font-mono text-sm"
              onClick={(e) => (e.target as HTMLInputElement).select()}
            />
            <Button
              variant="outline"
              size="icon"
              className="shrink-0"
              onClick={copyLink}
            >
              {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
            </Button>
          </div>
          {copied && (
            <p className="text-xs text-emerald-600 font-medium animate-in fade-in">¡Link copiado al portapapeles!</p>
          )}
        </CardContent>
      </Card>

      {/* Subaliados List */}
      {subaliados.length === 0 ? (
        <Card className="border-dashed border-2">
          <CardContent className="py-12 text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <UserPlus className="w-8 h-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold text-foreground mb-2">Aún no tienes subaliados</h3>
            <p className="text-sm text-muted-foreground max-w-md mx-auto">
              Comparte tu link de afiliación para que nuevos aliados se registren bajo tu red y comiences a construir tu equipo.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          <h2 className="text-lg font-semibold text-foreground flex items-center gap-2">
            <Users className="w-5 h-5 text-primary" />
            Subaliados ({subaliados.length})
          </h2>
          <div className="grid gap-3">
            {subaliados.map((sub) => (
              <Card key={sub._id} className="hover:shadow-md transition-all hover:-translate-y-0.5 border-muted/60">
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-foreground">{sub.nombre} {sub.apellido}</h3>
                        <Badge variant="secondary" className="text-xs">@{sub.etiqueta}</Badge>
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
                        {sub.email && (
                          <span className="flex items-center gap-1.5">
                            <Mail className="w-3.5 h-3.5" />
                            {sub.email}
                          </span>
                        )}
                        {sub.telefono && (
                          <span className="flex items-center gap-1.5">
                            <Phone className="w-3.5 h-3.5" />
                            {sub.telefono}
                          </span>
                        )}
                        <span className="flex items-center gap-1.5">
                          <Calendar className="w-3.5 h-3.5" />
                          {new Date(sub.createdAt).toLocaleDateString("es-CO")}
                        </span>
                      </div>
                    </div>
                    <div className="text-right shrink-0">
                      <div className="flex items-center gap-1.5 text-sm font-bold text-primary">
                        <BarChart3 className="w-4 h-4" />
                        {sub.leadsCount}
                      </div>
                      <p className="text-[10px] text-muted-foreground uppercase tracking-wider mt-0.5">Leads</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
