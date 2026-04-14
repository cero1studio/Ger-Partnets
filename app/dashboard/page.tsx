"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  UserPlus,
  Users,
  Phone,
  Mail,
  MapPin,
  Calendar,
  ChevronRight,
  ChevronLeft,
  CheckCircle2,
  Briefcase,
  Globe2,
  DollarSign,
  FileText
} from "lucide-react"

type Lead = {
  id: string
  nombre: string
  email: string
  telefono: string
  nacionalidad: string
  etapa: string
  stageLabel?: string
  fechaRegistro: string
  notas?: string
}

// Map actual pipeline stages using their native HubSpot IDs
const etapas = [
  { id: "appointmentscheduled", nombre: "Contacto inicial", color: "bg-blue-500" },
  { id: "qualifiedtobuy", nombre: "No contesta", color: "bg-orange-500" },
  { id: "presentationscheduled", nombre: "Perfilamiento", color: "bg-purple-500" },
  { id: "decisionmakerboughtin", nombre: "Reunión asesoría", color: "bg-indigo-500" },
  { id: "1226150813", nombre: "Seguimiento", color: "bg-cyan-500" },
  { id: "contractsent", nombre: "Prospecto", color: "bg-pink-500" },
  { id: "closedwon", nombre: "Pago G1", color: "bg-emerald-500" },
  { id: "closedlost", nombre: "Pago programa", color: "bg-green-600" },
  { id: "1062656363", nombre: "Retargeting", color: "bg-yellow-500" },
  { id: "1062656364", nombre: "Lead ganado", color: "bg-green-700" },
  { id: "1062656365", nombre: "Lead perdido", color: "bg-red-500" },
]

export default function DashboardPage() {
  const router = useRouter()
  const [leads, setLeads] = useState<Lead[]>([])
  const [loadingLeads, setLoadingLeads] = useState(true)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  
  // Fetch real leads
  useEffect(() => {
    fetch("/api/leads")
      .then(r => {
        if (r.status === 401) { router.push("/"); return null }
        return r.json()
      })
      .then(data => {
        if (data?.leads) setLeads(data.leads)
        setLoadingLeads(false)
      })
      .catch(() => setLoadingLeads(false))
  }, [router])

  // Form state
  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    email: "",
    telefono: "",
    nacionalidad: "",
    programa: "",
    tuvoVisa: false as boolean | null,
    tipoVisa: "",
    puedeCubrirCostos: "",
    profesion: "",
    nivelEscolaridad: "",
    nucleoFamiliar: "1",
    notas: "",
  })

  const [isSaving, setIsSaving] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSaving(true)
    try {
      const res = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nombre:             formData.nombre,
          apellido:           formData.apellido,
          email:              formData.email,
          telefono:           formData.telefono,
          nacionalidad:       formData.nacionalidad,
          programa:           formData.programa,
          tuvoVisa:           formData.tuvoVisa,
          tipoVisa:           formData.tipoVisa,
          puedeCubrirCostos:  formData.puedeCubrirCostos,
          profesion:          formData.profesion,
          nivelEscolaridad:   formData.nivelEscolaridad,
          nucleoFamiliar:     parseInt(formData.nucleoFamiliar),
          notas:              formData.notas,
        }),
      })
      if (res.ok) {
        const updated = await fetch("/api/leads").then(r => r.json())
        setLeads(updated.leads ?? [])
        setIsDialogOpen(false)
        resetForm()
      }
    } finally {
      setIsSaving(false)
    }
  }

  const resetForm = () => {
    setFormData({
      nombre: "",
      apellido: "",
      email: "",
      telefono: "",
      nacionalidad: "",
      programa: "",
      tuvoVisa: false,
      tipoVisa: "",
      puedeCubrirCostos: "",
      profesion: "",
      nivelEscolaridad: "",
      nucleoFamiliar: "1",
      notas: "",
    })
  }

  const getLeadsByEtapa = (etapaId: string) => {
    return leads.filter((lead) => lead.etapa === etapaId)
  }

  if (loadingLeads) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <div className="w-8 h-8 border-2 border-primary/30 border-t-primary rounded-full animate-spin" />
          <p className="text-sm">Cargando referidos...</p>
        </div>
      </div>
    )
  }

  if (leads.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] p-4 sm:p-6">
        <Card className="w-full max-w-md text-center border-dashed border-2">
          <CardContent className="pt-12 pb-10 px-6">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Users className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">Aún no tienes referidos</h2>
            <p className="text-muted-foreground mb-8 text-sm leading-relaxed">
              Comienza agregando tu primer referido y podrás darle seguimiento a su proceso de aplicación.
            </p>
            
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button size="lg" className="gap-2">
                  <UserPlus className="w-5 h-5" />
                  Agregar Primer Referido
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-xl max-h-[90vh] overflow-hidden flex flex-col p-0">
                <LeadForm 
                  formData={formData}
                  setFormData={setFormData}
                  handleSubmit={handleSubmit}
                  onCancel={() => { setIsDialogOpen(false); resetForm(); }}
                  isSaving={isSaving}
                />
              </DialogContent>
            </Dialog>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Mis Referidos</h1>
          <p className="text-muted-foreground text-sm mt-1">
            {leads.length} {leads.length === 1 ? "referido" : "referidos"} en total
          </p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2 shrink-0">
              <UserPlus className="w-4 h-4" />
              <span className="hidden sm:inline">Agregar Referido</span>
              <span className="sm:hidden">Agregar</span>
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-xl max-h-[90vh] overflow-hidden flex flex-col p-0">
            <LeadForm 
              formData={formData}
              setFormData={setFormData}
              handleSubmit={handleSubmit}
              onCancel={() => { setIsDialogOpen(false); resetForm(); }}
              isSaving={isSaving}
            />
          </DialogContent>
        </Dialog>
      </div>

      <div className="overflow-x-auto pb-4 -mx-4 sm:-mx-6 px-4 sm:px-6">
          <div className="flex gap-4 min-w-max pb-2">
          {etapas.map((etapa) => (
            <div key={etapa.id} className="w-72 sm:w-80 shrink-0">
              <Card className="bg-muted/30 border-muted-foreground/10">
                <CardHeader className="pb-3 px-4 pt-4">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${etapa.color}`} />
                    <CardTitle className="text-sm font-medium">{etapa.nombre}</CardTitle>
                    <Badge variant="secondary" className="ml-auto text-xs">
                      {getLeadsByEtapa(etapa.id).length}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3 min-h-[200px]">
                  {getLeadsByEtapa(etapa.id).map((lead) => (
                    <LeadCard key={lead.id} lead={lead} onClick={() => setSelectedLead(lead)} />
                  ))}
                  {getLeadsByEtapa(etapa.id).length === 0 && (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      Sin referidos
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>

      <Sheet open={!!selectedLead} onOpenChange={(open) => !open && setSelectedLead(null)}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {selectedLead && <LeadDetail lead={selectedLead} onClose={() => setSelectedLead(null)} />}
        </SheetContent>
      </Sheet>
    </div>
  )
}

function LeadCard({ lead, onClick }: { lead: Lead; onClick: () => void }) {
  return (
    <Card
      className="bg-card hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <CardContent className="p-4 space-y-2">
        <h3 className="font-medium text-foreground text-sm leading-tight">{lead.nombre}</h3>
        <div className="space-y-1 text-xs text-muted-foreground">
          {lead.email && (
            <div className="flex items-center gap-2">
              <Mail className="w-3 h-3 shrink-0" />
              <span className="truncate">{lead.email}</span>
            </div>
          )}
          {lead.telefono && (
            <div className="flex items-center gap-2">
              <Phone className="w-3 h-3 shrink-0" />
              <span>{lead.telefono}</span>
            </div>
          )}
          {lead.nacionalidad && (
            <div className="flex items-center gap-2">
              <MapPin className="w-3 h-3 shrink-0" />
              <span>{lead.nacionalidad}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Calendar className="w-3 h-3 shrink-0" />
            <span>{lead.fechaRegistro}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function LeadDetail({ lead }: { lead: Lead; onClose: () => void }) {
  const etapa = etapas.find(e => e.id === lead.etapa)

  return (
    <div className="space-y-6">
      <SheetHeader>
        <SheetTitle className="flex items-center gap-3">
          <Avatar className="w-10 h-10">
            <AvatarFallback className="bg-primary text-primary-foreground font-bold">
              {lead.nombre.split(" ").map(n => n[0]).join("").slice(0, 2)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-lg font-semibold">{lead.nombre}</p>
            <Badge className={`${etapa?.color} text-white text-xs mt-1`}>
              {etapa?.nombre ?? lead.etapa}
            </Badge>
          </div>
        </SheetTitle>
        <SheetDescription>Detalle del candidato referido</SheetDescription>
      </SheetHeader>

      <div className="space-y-2">
        <h3 className="text-sm font-semibold text-foreground border-b pb-2">Contacto</h3>
        <div className="grid gap-2 text-sm">
          {lead.email && (
            <div className="flex items-center gap-3">
              <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
              <a href={`mailto:${lead.email}`} className="text-primary hover:underline truncate">{lead.email}</a>
            </div>
          )}
          {lead.telefono && (
            <div className="flex items-center gap-3">
              <Phone className="w-4 h-4 text-muted-foreground shrink-0" />
              <a href={`tel:${lead.telefono}`} className="text-primary hover:underline">{lead.telefono}</a>
            </div>
          )}
          {lead.nacionalidad && (
            <div className="flex items-center gap-3">
              <MapPin className="w-4 h-4 text-muted-foreground shrink-0" />
              <span>{lead.nacionalidad}</span>
            </div>
          )}
        </div>
      </div>

      {lead.notas && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-foreground border-b pb-2">Perfilamiento</h3>
          <div className="bg-muted/50 rounded-lg p-3 text-sm text-muted-foreground whitespace-pre-line">
            {lead.notas}
          </div>
        </div>
      )}
    </div>
  )
}

// ─── COMPONENTE WIZARD ──────────────────────────────────────

const nivelesEscolaridad = [
  "Primaria",
  "Bachillerato",
  "Técnico",
  "Tecnólogo",
  "Universitario",
  "Posgrado",
  "Otro",
]

const programas = [
  "EB-3 Visa (Trabajadores no calificados)",
  "EB-2 NIW (Profesionales con posgrado)",
  "L-1 (Transferencia ejecutivos)",
  "E-2 (Inversionistas)",
  "Otro",
]

const paises = [
  "Colombia",
  "México",
  "Perú",
  "Ecuador",
  "Chile",
  "Argentina",
  "España",
  "Otro",
]

type LeadFormProps = {
  formData: any
  setFormData: any
  handleSubmit: (e: React.FormEvent) => void
  onCancel: () => void
  isSaving?: boolean
}

function LeadForm({ formData, setFormData, handleSubmit, onCancel, isSaving }: LeadFormProps) {
  const [step, setStep] = useState(1)

  const validateStep1 = () => {
    return formData.nombre.trim() !== "" && 
           formData.apellido.trim() !== "" && 
           formData.email.trim() !== "" && 
           formData.telefono.trim() !== ""
  }

  const validateStep2 = () => {
    return formData.nacionalidad !== "" && 
           formData.programa !== "" && 
           (formData.tuvoVisa === false || (formData.tuvoVisa === true && formData.tipoVisa.trim() !== ""))
  }

  const handleNext = (e: React.MouseEvent) => {
    e.preventDefault()
    if (step === 1 && validateStep1()) setStep(2)
    else if (step === 2 && validateStep2()) setStep(3)
  }

  const handleBack = (e: React.MouseEvent) => {
    e.preventDefault()
    if (step > 1) setStep(step - 1)
  }

  const SelectCard = ({ 
    selected, onClick, icon: Icon, title, desc 
  }: { 
    selected: boolean, onClick: () => void, icon: any, title: string, desc?: string 
  }) => (
    <div 
      onClick={onClick}
      className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
        selected 
          ? "border-primary bg-primary/5 shadow-sm" 
          : "border-border hover:border-primary/30 hover:bg-muted/50"
      }`}
    >
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg shrink-0 ${selected ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div className="flex-1 min-w-0 pr-6">
          <h4 className={`font-semibold text-sm ${selected ? "text-primary" : "text-foreground"}`}>{title}</h4>
          {desc && <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{desc}</p>}
        </div>
        {selected && (
          <CheckCircle2 className="w-5 h-5 text-primary absolute top-4 right-4 animate-in zoom-in" />
        )}
      </div>
    </div>
  )

  return (
    <form onSubmit={handleSubmit} className="flex flex-col h-[75vh] sm:h-[650px] bg-background">
      {/* Header Modal - Progress */}
      <div className="px-6 py-4 border-b bg-muted/10 shrink-0">
        <div className="flex items-center justify-between mb-3">
          <div>
            <h2 className="text-lg font-bold text-foreground">Nuevo Referido</h2>
            <p className="text-sm font-medium text-muted-foreground mt-0.5">
              {step === 1 ? "Contacto básico" : step === 2 ? "Perfil migratorio" : "Viabilidad"}
            </p>
          </div>
          <div className="text-right">
            <span className="text-sm font-bold text-primary bg-primary/10 px-3 py-1 rounded-full">
              Paso {step} de 3
            </span>
          </div>
        </div>
        <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
          <div 
            className="h-full bg-primary transition-all duration-500 ease-out"
            style={{ width: `${(step / 3) * 100}%` }}
          />
        </div>
      </div>

      {/* Form Content - Scrollable area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-6">
        
        {/* PASO 1 */}
        <div className={step === 1 ? "block animate-in fade-in slide-in-from-right-4 duration-300" : "hidden"}>
          <div className="mb-6">
            <h3 className="text-xl font-bold text-foreground">¿A quién vas a referir?</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Ingresa los datos exactos del candidato para que nuestro equipo pueda contactarlo.
            </p>
          </div>

          <div className="space-y-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="nombre" className="text-xs font-bold text-foreground/80 uppercase tracking-wider">Nombre(s) *</Label>
                <Input
                  id="nombre"
                  placeholder="Ej: Carlos Andrés"
                  value={formData.nombre}
                  onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                  className="h-12 bg-muted/20"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="apellido" className="text-xs font-bold text-foreground/80 uppercase tracking-wider">Apellido(s) *</Label>
                <Input
                  id="apellido"
                  placeholder="Ej: Mendoza"
                  value={formData.apellido}
                  onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
                  className="h-12 bg-muted/20"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-bold text-foreground/80 uppercase tracking-wider">Correo Electrónico *</Label>
              <div className="relative">
                <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="email"
                  type="email"
                  placeholder="carlos@ejemplo.com"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="h-12 pl-12 bg-muted/20"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="telefono" className="text-xs font-bold text-foreground/80 uppercase tracking-wider">WhatsApp / Teléfono *</Label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <Input
                  id="telefono"
                  type="tel"
                  placeholder="+1 (555) 123-4567"
                  value={formData.telefono}
                  onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
                  className="h-12 pl-12 bg-muted/20"
                />
              </div>
              <p className="text-xs text-muted-foreground ml-1">Incluye el código de país (Ej: +57 para Colombia)</p>
            </div>
          </div>
        </div>

        {/* PASO 2 */}
        <div className={step === 2 ? "block animate-in fade-in slide-in-from-right-4 duration-300" : "hidden"}>
          <div className="mb-6">
            <h3 className="text-xl font-bold text-foreground">El destino y el origen</h3>
            <p className="text-sm text-muted-foreground mt-1">
              ¿Qué programa le interesa y de dónde es el candidato?
            </p>
          </div>

          <div className="space-y-6">
            <div className="space-y-2">
              <Label className="text-xs font-bold text-foreground/80 uppercase tracking-wider">Programa de Interés *</Label>
              <Select value={formData.programa} onValueChange={(value) => setFormData({ ...formData, programa: value })}>
                <SelectTrigger className="h-12 bg-muted/20 text-base">
                  <SelectValue placeholder="Selecciona un programa" />
                </SelectTrigger>
                <SelectContent>
                  {programas.map(p => <SelectItem key={p} value={p} className="py-3">{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs font-bold text-foreground/80 uppercase tracking-wider">Nacionalidad / País *</Label>
              <Select value={formData.nacionalidad} onValueChange={(value) => setFormData({ ...formData, nacionalidad: value })}>
                <SelectTrigger className="h-12 bg-muted/20 text-base">
                  <SelectValue placeholder="Selecciona el país" />
                </SelectTrigger>
                <SelectContent>
                  {paises.map(p => <SelectItem key={p} value={p} className="py-3">{p}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-3 pt-2">
              <Label className="text-xs font-bold text-foreground/80 uppercase tracking-wider">¿Tiene o tuvo visa americana? *</Label>
              <div className="grid grid-cols-2 gap-3">
                <SelectCard 
                  selected={formData.tuvoVisa === true}
                  onClick={() => setFormData({ ...formData, tuvoVisa: true })}
                  icon={Globe2}
                  title="Sí, tiene o tuvo"
                />
                <SelectCard 
                  selected={formData.tuvoVisa === false}
                  onClick={() => setFormData({ ...formData, tuvoVisa: false, tipoVisa: "" })}
                  icon={Globe2}
                  title="No, nunca"
                />
              </div>
              
              {formData.tuvoVisa && (
                <div className="mt-4 p-4 bg-muted/30 rounded-xl border border-border/50 animate-in fade-in slide-in-from-top-2">
                  <Label className="text-xs font-bold text-foreground/80 uppercase tracking-wider mb-2 block">
                    ¿Qué tipo de visa?
                  </Label>
                  <Input
                    placeholder="Ej: B1/B2 Turista, H-1B, F1..."
                    value={formData.tipoVisa}
                    onChange={(e) => setFormData({ ...formData, tipoVisa: e.target.value })}
                    className="h-12 bg-background"
                    autoFocus
                  />
                </div>
              )}
            </div>
          </div>
        </div>

        {/* PASO 3 */}
        <div className={step === 3 ? "block animate-in fade-in slide-in-from-right-4 duration-300" : "hidden"}>
          <div className="mb-6">
            <h3 className="text-xl font-bold text-foreground">Calificación del Perfil</h3>
            <p className="text-sm text-muted-foreground mt-1">
              Esta información es vital para perfilar y calificar al candidato.
            </p>
          </div>

          <div className="space-y-6">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="text-xs font-bold text-foreground/80 uppercase tracking-wider">Capacidad económica *</Label>
                <span className="text-[10px] font-bold bg-green-100 text-green-800 px-2.5 py-1 rounded-full uppercase tracking-wider">
                  Costo: $23,990 USD
                </span>
              </div>
              <div className="grid gap-3">
                <SelectCard 
                  selected={formData.puedeCubrirCostos === "si"}
                  onClick={() => setFormData({ ...formData, puedeCubrirCostos: "si" })}
                  icon={DollarSign}
                  title="Tiene el capital"
                  desc="Puede cubrir el costo total del servicio sin problema."
                />
                <SelectCard 
                  selected={formData.puedeCubrirCostos === "con-financiamiento"}
                  onClick={() => setFormData({ ...formData, puedeCubrirCostos: "con-financiamiento" })}
                  icon={DollarSign}
                  title="Busca financiamiento"
                  desc="Le interesa el programa pero requiere plan de pagos o crédito."
                />
                <SelectCard 
                  selected={formData.puedeCubrirCostos === "no"}
                  onClick={() => setFormData({ ...formData, puedeCubrirCostos: "no" })}
                  icon={DollarSign}
                  title="No tiene el capital"
                  desc="Actualmente no cuenta con recursos para el programa."
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="profesion" className="text-xs font-bold text-foreground/80 uppercase tracking-wider">Profesión u Oficio *</Label>
                <div className="relative">
                  <Briefcase className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    id="profesion"
                    placeholder="Ej: Electricista"
                    value={formData.profesion}
                    onChange={(e) => setFormData({ ...formData, profesion: e.target.value })}
                    className="h-12 pl-11 bg-muted/20"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold text-foreground/80 uppercase tracking-wider">Escolaridad *</Label>
                <Select value={formData.nivelEscolaridad} onValueChange={(value) => setFormData({ ...formData, nivelEscolaridad: value })}>
                  <SelectTrigger className="h-12 bg-muted/20">
                    <SelectValue placeholder="Nivel" />
                  </SelectTrigger>
                  <SelectContent>
                    {nivelesEscolaridad.map(n => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold text-foreground/80 uppercase tracking-wider">Aplica para</Label>
                <Select value={formData.nucleoFamiliar} onValueChange={(value) => setFormData({ ...formData, nucleoFamiliar: value })}>
                  <SelectTrigger className="h-12 bg-muted/20">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-muted-foreground" />
                      <SelectValue />
                    </div>
                  </SelectTrigger>
                  <SelectContent>
                    {[1, 2, 3, 4, 5, 6].map((num) => (
                      <SelectItem key={num} value={num.toString()}>
                        {num === 1 ? "Solo el candidato" : `${num} personas`}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notas" className="text-xs font-bold text-foreground/80 uppercase tracking-wider">¿Algo importante que debamos saber?</Label>
              <div className="relative">
                <FileText className="absolute left-3.5 top-3.5 w-4 h-4 text-muted-foreground" />
                <Textarea
                  id="notas"
                  placeholder="Ej: Solo puede recibir llamadas en la tarde, tiene un primo en USA, etc..."
                  value={formData.notas}
                  onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
                  className="pl-11 min-h-[90px] bg-muted/20 resize-none py-3"
                />
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Footer / Controls - Fixed at bottom */}
      <div className="p-4 border-t bg-muted/10 flex gap-3 shrink-0">
        {step === 1 ? (
          <Button type="button" variant="outline" onClick={onCancel} className="h-12 flex-1 bg-white hover:bg-muted">
            Cancelar
          </Button>
        ) : (
          <Button type="button" variant="outline" onClick={handleBack} className="h-12 flex-1 bg-white hover:bg-muted">
            <ChevronLeft className="w-5 h-5 mr-1" />
            Atrás
          </Button>
        )}

        {step < 3 ? (
          <Button 
            type="button" 
            onClick={handleNext} 
            className="h-12 flex-[2] shadow-sm text-base"
            disabled={(step === 1 && !validateStep1()) || (step === 2 && !validateStep2())}
          >
            Siguiente paso
            <ChevronRight className="w-5 h-5 ml-1" />
          </Button>
        ) : (
          <Button 
            type="submit" 
            className="h-12 flex-[2] bg-primary hover:bg-primary/90 shadow-md font-bold text-base"
            disabled={
              isSaving || 
              !formData.puedeCubrirCostos || 
              !formData.profesion || 
              !formData.nivelEscolaridad
            }
          >
            {isSaving ? (
              <span className="flex items-center gap-2">
                <span className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Registrando...
              </span>
            ) : "Registrar Candidato"}
          </Button>
        )}
      </div>
    </form>
  )
}
