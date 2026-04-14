"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet"
import {
  UserPlus,
  Users,
  Phone,
  Mail,
  MapPin,
  Calendar,
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

// Etapas de HubSpot — IDs reales del pipeline "Funnel de ventas" (id: default)
// Obtenidos con scripts/explore-hubspot.mjs
const etapas = [
  { id: "appointmentscheduled", nombre: "Contacto inicial",  color: "bg-blue-500" },
  { id: "qualifiedtobuy",       nombre: "No contesta",       color: "bg-gray-400" },
  { id: "presentationscheduled",nombre: "Perfilamiento",     color: "bg-yellow-500" },
  { id: "decisionmakerboughtin",nombre: "Reunión asesoría",  color: "bg-orange-500" },
  { id: "1226150813",           nombre: "Seguimiento",       color: "bg-cyan-500" },
  { id: "contractsent",         nombre: "Prospecto",         color: "bg-indigo-500" },
  { id: "closedwon",            nombre: "Pago G1",           color: "bg-purple-500" },
  { id: "closedlost",           nombre: "Pago programa",     color: "bg-pink-500" },
  { id: "1062656363",           nombre: "Retargeting",       color: "bg-amber-500" },
  { id: "1062656364",           nombre: "Lead ganado",       color: "bg-green-500" },
  { id: "1062656365",           nombre: "Lead perdido",      color: "bg-red-500" },
]

const nacionalidades = [
  "Venezuela", "Colombia", "México", "Argentina", "Perú", "Ecuador", "Chile",
  "República Dominicana", "Cuba", "Honduras", "Guatemala", "El Salvador",
  "Nicaragua", "Costa Rica", "Panamá", "Bolivia", "Paraguay", "Uruguay", "Brasil", "Otro",
]

const programas = [
  "EB-3 Skilled Worker",
  "EB-3 Unskilled Worker",
  "H-2B Visa",
  "Otro",
]


export default function DashboardPage() {
  const [leads, setLeads] = useState<Lead[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [loadingLeads, setLoadingLeads] = useState(true)

  useEffect(() => {
    fetch("/api/leads")
      .then(r => r.ok ? r.json() : { leads: [] })
      .then(data => setLeads(data.leads ?? []))
      .catch(() => setLeads([]))
      .finally(() => setLoadingLeads(false))
  }, [])
  
  // Form state
  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    email: "",
    telefono: "",
    nacionalidad: "",
    programa: "",
    tuvoVisa: false,
    tipoVisa: "",
    puedeCubrirCostos: "",
    aceptaInversion: false,
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
        // Recargar leads desde HubSpot
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
      aceptaInversion: false,
      profesion: "",
      nivelEscolaridad: "",
      nucleoFamiliar: "1",
      notas: "",
    })
  }

  const getLeadsByEtapa = (etapaId: string) => {
    return leads.filter((lead) => lead.etapa === etapaId)
  }

  // Loading state
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

  // Empty State
  if (leads.length === 0) {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] p-4 sm:p-6">
        <Card className="w-full max-w-md text-center border-dashed border-2">
          <CardContent className="pt-12 pb-10 px-6">
            <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6">
              <Users className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Aún no tienes referidos
            </h2>
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
              <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Nuevo Referido</DialogTitle>
                  <DialogDescription>
                    Completa la información del candidato que deseas referir.
                  </DialogDescription>
                </DialogHeader>
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

  // Pipeline View with leads
  return (
    <div className="p-4 sm:p-6">
      {/* Header */}
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
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nuevo Referido</DialogTitle>
              <DialogDescription>
                Completa la información del candidato que deseas referir.
              </DialogDescription>
            </DialogHeader>
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

      {/* Pipeline Kanban - horizontal scroll on body */}
      <div className="overflow-x-auto pb-4 -mx-4 sm:-mx-6 px-4 sm:px-6">
        <div className="flex gap-4 min-w-max">
          {etapas.map((etapa) => (
            <div key={etapa.id} className="w-72 sm:w-80 shrink-0">
              <Card className="bg-muted/30">
                <CardHeader className="pb-3">
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

      {/* Lead Detail Sheet */}
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

      {/* Contacto */}
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

      {/* Notas / Perfilamiento (guardado en description de HubSpot) */}
      {lead.notas && (
        <div className="space-y-2">
          <h3 className="text-sm font-semibold text-foreground border-b pb-2">Perfilamiento</h3>
          <div className="bg-muted/50 rounded-lg p-3 text-sm text-muted-foreground whitespace-pre-line">
            {lead.notas}
          </div>
        </div>
      )}

      {/* Registro */}
      <div className="pt-2 border-t text-xs text-muted-foreground flex items-center gap-1">
        <Calendar className="w-3 h-3" />
        Registrado el {lead.fechaRegistro}
      </div>
    </div>
  )
}

type LeadFormProps = {
  formData: {
    nombre: string
    apellido: string
    email: string
    telefono: string
    ciudad: string
    nacionalidad: string
    programa: string
    tuvoVisa: boolean
    tipoVisa: string
    puedeCubrirCostos: string
    aceptaInversion: boolean
    profesion: string
    nivelEscolaridad: string
    nucleoFamiliar: string
    notas: string
  }
  setFormData: React.Dispatch<React.SetStateAction<LeadFormProps["formData"]>>
  handleSubmit: (e: React.FormEvent) => void
  onCancel: () => void
  isSaving?: boolean
}

const nivelesEscolaridad = [
  "Primaria",
  "Bachillerato",
  "Técnico",
  "Tecnólogo",
  "Universitario",
  "Posgrado",
  "Otro",
]

function LeadForm({ formData, setFormData, handleSubmit, onCancel, isSaving }: LeadFormProps) {
  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      {/* Información Básica */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-foreground border-b pb-2">
          Información Básica
        </h3>
        
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="nombre">Nombre *</Label>
            <Input
              id="nombre"
              placeholder="Juan"
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="apellido">Apellido *</Label>
            <Input
              id="apellido"
              placeholder="Pérez"
              value={formData.apellido}
              onChange={(e) => setFormData({ ...formData, apellido: e.target.value })}
              required
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">Correo Electrónico *</Label>
          <Input
            id="email"
            type="email"
            placeholder="correo@ejemplo.com"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="telefono">WhatsApp / Teléfono *</Label>
          <Input
            id="telefono"
            type="tel"
            placeholder="+1 (555) 123-4567"
            value={formData.telefono}
            onChange={(e) => setFormData({ ...formData, telefono: e.target.value })}
            required
          />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Nacionalidad *</Label>
            <Select
              value={formData.nacionalidad}
              onValueChange={(value) => setFormData({ ...formData, nacionalidad: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar" />
              </SelectTrigger>
              <SelectContent>
                {nacionalidades.map((nac) => (
                  <SelectItem key={nac} value={nac}>{nac}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Programa de Interés *</Label>
            <Select
              value={formData.programa}
              onValueChange={(value) => setFormData({ ...formData, programa: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar" />
              </SelectTrigger>
              <SelectContent>
                {programas.map((prog) => (
                  <SelectItem key={prog} value={prog}>{prog}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Perfilamiento */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-foreground border-b pb-2">
          Perfilamiento
        </h3>

        {/* Visa */}
        <div className="space-y-2">
          <Label>¿Ha tenido visa anteriormente? *</Label>
          <RadioGroup
            value={formData.tuvoVisa ? "si" : "no"}
            onValueChange={(v) =>
              setFormData({ ...formData, tuvoVisa: v === "si", tipoVisa: v === "no" ? "" : formData.tipoVisa })
            }
            className="flex gap-6"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="si" id="visa-si" />
              <Label htmlFor="visa-si" className="font-normal cursor-pointer">Sí</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="no" id="visa-no" />
              <Label htmlFor="visa-no" className="font-normal cursor-pointer">No</Label>
            </div>
          </RadioGroup>
        </div>

        {formData.tuvoVisa && (
          <div className="space-y-2">
            <Label htmlFor="tipoVisa">¿Qué tipo de visa?</Label>
            <Input
              id="tipoVisa"
              placeholder="Ej: B1/B2 Turista, H-1B, etc."
              value={formData.tipoVisa}
              onChange={(e) => setFormData({ ...formData, tipoVisa: e.target.value })}
            />
          </div>
        )}

        {/* Capacidad económica */}
        <div className="space-y-2">
          <Label>¿Puede cubrir el costo del servicio? *</Label>
          <p className="text-xs text-muted-foreground -mt-1">
            El costo total del servicio es de <span className="font-semibold text-foreground">$23,990 USD</span>.
          </p>
          <RadioGroup
            value={formData.puedeCubrirCostos}
            onValueChange={(v) => setFormData({ ...formData, puedeCubrirCostos: v })}
            className="space-y-2 mt-2"
            required
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="si" id="costos-si" />
              <Label htmlFor="costos-si" className="font-normal cursor-pointer">Sí, puede cubrir el costo</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="con-financiamiento" id="costos-financiamiento" />
              <Label htmlFor="costos-financiamiento" className="font-normal cursor-pointer">Necesita financiamiento</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="no" id="costos-no" />
              <Label htmlFor="costos-no" className="font-normal cursor-pointer">No puede cubrir el costo</Label>
            </div>
          </RadioGroup>
        </div>

        {/* Profesión y Escolaridad */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label htmlFor="profesion">Profesión *</Label>
            <Input
              id="profesion"
              placeholder="Ej: Electricista"
              value={formData.profesion}
              onChange={(e) => setFormData({ ...formData, profesion: e.target.value })}
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Nivel de Escolaridad *</Label>
            <Select
              value={formData.nivelEscolaridad}
              onValueChange={(value) => setFormData({ ...formData, nivelEscolaridad: value })}
              required
            >
              <SelectTrigger>
                <SelectValue placeholder="Seleccionar" />
              </SelectTrigger>
              <SelectContent>
                {nivelesEscolaridad.map((nivel) => (
                  <SelectItem key={nivel} value={nivel}>{nivel}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Núcleo familiar */}
        <div className="space-y-2">
          <Label>Núcleo Familiar (incluyendo al candidato)</Label>
          <Select
            value={formData.nucleoFamiliar}
            onValueChange={(value) => setFormData({ ...formData, nucleoFamiliar: value })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {[1, 2, 3, 4, 5, 6, 7, 8].map((num) => (
                <SelectItem key={num} value={num.toString()}>
                  {num} {num === 1 ? "persona" : "personas"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Notas */}
      <div className="space-y-2">
        <Label htmlFor="notas">Notas Adicionales</Label>
        <Textarea
          id="notas"
          placeholder="Información relevante sobre el candidato..."
          value={formData.notas}
          onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
          rows={3}
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-4">
        <Button type="button" variant="outline" onClick={onCancel} className="flex-1">
          Cancelar
        </Button>
        <Button type="submit" className="flex-1" disabled={isSaving}>
          {isSaving ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
              Guardando...
            </span>
          ) : "Guardar Referido"}
        </Button>
      </div>
    </form>
  )
}
