"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
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
  UserPlus,
  Users,
  Phone,
  Mail,
  MapPin,
  Calendar,
  ChevronRight,
  Upload,
  X,
  FileText,
} from "lucide-react"

type Lead = {
  id: string
  nombre: string
  email: string
  telefono: string
  nacionalidad: string
  programa: string
  etapa: string
  fechaRegistro: string
  tieneEB3: boolean
  nucleoFamiliar: number
  dedicacion: string
  notas?: string
}

const etapas = [
  { id: "registro", nombre: "Registro", color: "bg-blue-500" },
  { id: "screening", nombre: "Screening Inicial", color: "bg-yellow-500" },
  { id: "entrevistas", nombre: "Entrevistas", color: "bg-orange-500" },
  { id: "programa", nombre: "Seguimiento de Proceso", color: "bg-purple-500" },
  { id: "contratado", nombre: "Contratado", color: "bg-green-500" },
]

const nacionalidades = [
  "Venezuela",
  "Colombia",
  "México",
  "Argentina",
  "Perú",
  "Ecuador",
  "Chile",
  "República Dominicana",
  "Cuba",
  "Honduras",
  "Guatemala",
  "El Salvador",
  "Nicaragua",
  "Costa Rica",
  "Panamá",
  "Bolivia",
  "Paraguay",
  "Uruguay",
  "Brasil",
  "Otro",
]

const programas = [
  "EB-3 Skilled Worker",
  "EB-3 Unskilled Worker",
  "H-2B Visa",
  "Otro",
]

// Demo users data
const demoUsers = {
  "demo@ger.com": {
    nombre: "Carlos",
    apellido: "Mendoza",
    etiqueta: "carlos.mendoza",
    leads: [
      {
        id: "1",
        nombre: "María González",
        email: "maria.gonzalez@email.com",
        telefono: "+58 424 123 4567",
        nacionalidad: "Venezuela",
        programa: "EB-3 Unskilled Worker",
        etapa: "registro",
        fechaRegistro: "10/04/2026",
        tieneEB3: true,
        nucleoFamiliar: 4,
        dedicacion: "full-time",
        notas: "Interesada en trabajos de procesamiento de alimentos",
      },
      {
        id: "2",
        nombre: "Roberto Herrera",
        email: "roberto.h@gmail.com",
        telefono: "+57 311 987 6543",
        nacionalidad: "Colombia",
        programa: "EB-3 Skilled Worker",
        etapa: "screening",
        fechaRegistro: "08/04/2026",
        tieneEB3: true,
        nucleoFamiliar: 2,
        dedicacion: "full-time",
        notas: "Ingeniero industrial con 5 años de experiencia",
      },
      {
        id: "3",
        nombre: "Ana Martínez",
        email: "ana.martinez@outlook.com",
        telefono: "+52 55 8765 4321",
        nacionalidad: "México",
        programa: "EB-3 Unskilled Worker",
        etapa: "entrevistas",
        fechaRegistro: "01/04/2026",
        tieneEB3: true,
        nucleoFamiliar: 3,
        dedicacion: "full-time",
        notas: "Disponibilidad inmediata",
      },
      {
        id: "4",
        nombre: "Luis Fernández",
        email: "luis.f@email.com",
        telefono: "+51 999 111 2222",
        nacionalidad: "Perú",
        programa: "EB-3 Skilled Worker",
        etapa: "programa",
        fechaRegistro: "15/03/2026",
        tieneEB3: true,
        nucleoFamiliar: 5,
        dedicacion: "full-time",
        notas: "Técnico en soldadura certificado",
      },
      {
        id: "5",
        nombre: "Carmen Rojas",
        email: "carmen.rojas@gmail.com",
        telefono: "+593 98 765 4321",
        nacionalidad: "Ecuador",
        programa: "EB-3 Unskilled Worker",
        etapa: "contratado",
        fechaRegistro: "01/03/2026",
        tieneEB3: true,
        nucleoFamiliar: 2,
        dedicacion: "full-time",
        notas: "Proceso completado exitosamente",
      },
      {
        id: "6",
        nombre: "Pedro Sánchez",
        email: "pedro.s@hotmail.com",
        telefono: "+58 412 333 4444",
        nacionalidad: "Venezuela",
        programa: "H-2B Visa",
        etapa: "registro",
        fechaRegistro: "12/04/2026",
        tieneEB3: false,
        nucleoFamiliar: 1,
        dedicacion: "part-time",
        notas: "",
      },
      {
        id: "7",
        nombre: "Isabella Torres",
        email: "isabella.t@email.com",
        telefono: "+57 320 555 6666",
        nacionalidad: "Colombia",
        programa: "EB-3 Unskilled Worker",
        etapa: "screening",
        fechaRegistro: "05/04/2026",
        tieneEB3: true,
        nucleoFamiliar: 3,
        dedicacion: "full-time",
        notas: "Referencias laborales verificadas",
      },
    ] as Lead[],
  },
  "nuevo@ger.com": {
    nombre: "Patricia",
    apellido: "López",
    etiqueta: "patricia.lopez",
    leads: [] as Lead[],
  },
}

// Get user from localStorage or default to demo user
const getStoredUser = (): string => {
  if (typeof window !== "undefined") {
    return localStorage.getItem("ger_demo_user") || "demo@ger.com"
  }
  return "demo@ger.com"
}

export default function DashboardPage() {
  const [currentUser, setCurrentUser] = useState(getStoredUser())
  const userData = demoUsers[currentUser as keyof typeof demoUsers] || demoUsers["demo@ger.com"]
  const [leads, setLeads] = useState<Lead[]>(userData.leads)
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [cvFile, setCvFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  
  // Form state
  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    email: "",
    telefono: "",
    nacionalidad: "",
    programa: "",
    tieneEB3: false,
    nucleoFamiliar: "1",
    dedicacion: "full-time",
    notas: "",
  })

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file && file.type === "application/pdf") {
      setCvFile(file)
    }
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file && file.type === "application/pdf") {
      setCvFile(file)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    const newLead: Lead = {
      id: Date.now().toString(),
      nombre: `${formData.nombre} ${formData.apellido}`,
      email: formData.email,
      telefono: formData.telefono,
      nacionalidad: formData.nacionalidad,
      programa: formData.programa,
      etapa: "registro",
      fechaRegistro: new Date().toLocaleDateString("es-ES"),
      tieneEB3: formData.tieneEB3,
      nucleoFamiliar: parseInt(formData.nucleoFamiliar),
      dedicacion: formData.dedicacion,
      notas: formData.notas,
    }

    setLeads([...leads, newLead])
    setIsDialogOpen(false)
    resetForm()
  }

  const resetForm = () => {
    setFormData({
      nombre: "",
      apellido: "",
      email: "",
      telefono: "",
      nacionalidad: "",
      programa: "",
      tieneEB3: false,
      nucleoFamiliar: "1",
      dedicacion: "full-time",
      notas: "",
    })
    setCvFile(null)
  }

  const getLeadsByEtapa = (etapaId: string) => {
    return leads.filter((lead) => lead.etapa === etapaId)
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
                  cvFile={cvFile}
                  setCvFile={setCvFile}
                  isDragging={isDragging}
                  handleDragOver={handleDragOver}
                  handleDragLeave={handleDragLeave}
                  handleDrop={handleDrop}
                  handleFileChange={handleFileChange}
                  handleSubmit={handleSubmit}
                  onCancel={() => { setIsDialogOpen(false); resetForm(); }}
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
              cvFile={cvFile}
              setCvFile={setCvFile}
              isDragging={isDragging}
              handleDragOver={handleDragOver}
              handleDragLeave={handleDragLeave}
              handleDrop={handleDrop}
              handleFileChange={handleFileChange}
              handleSubmit={handleSubmit}
              onCancel={() => { setIsDialogOpen(false); resetForm(); }}
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
                    <LeadCard key={lead.id} lead={lead} />
                  ))}
                  {getLeadsByEtapa(etapa.id).length === 0 && (
                    <div className="text-center py-8 text-muted-foreground text-sm">
                      Sin referidos en esta etapa
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function LeadCard({ lead }: { lead: Lead }) {
  return (
    <Card className="bg-card hover:shadow-md transition-shadow cursor-pointer">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-medium text-foreground text-sm">{lead.nombre}</h3>
          <ChevronRight className="w-4 h-4 text-muted-foreground" />
        </div>
        <div className="space-y-1.5 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <Mail className="w-3 h-3" />
            <span className="truncate">{lead.email}</span>
          </div>
          <div className="flex items-center gap-2">
            <Phone className="w-3 h-3" />
            <span>{lead.telefono}</span>
          </div>
          <div className="flex items-center gap-2">
            <MapPin className="w-3 h-3" />
            <span>{lead.nacionalidad}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-3 h-3" />
            <span>{lead.fechaRegistro}</span>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t flex items-center justify-between">
          <Badge variant="outline" className="text-xs">
            {lead.programa}
          </Badge>
          {lead.tieneEB3 && (
            <Badge className="bg-green-100 text-green-700 text-xs">EB-3</Badge>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

type LeadFormProps = {
  formData: {
    nombre: string
    apellido: string
    email: string
    telefono: string
    nacionalidad: string
    programa: string
    tieneEB3: boolean
    nucleoFamiliar: string
    dedicacion: string
    notas: string
  }
  setFormData: React.Dispatch<React.SetStateAction<LeadFormProps["formData"]>>
  cvFile: File | null
  setCvFile: React.Dispatch<React.SetStateAction<File | null>>
  isDragging: boolean
  handleDragOver: (e: React.DragEvent) => void
  handleDragLeave: (e: React.DragEvent) => void
  handleDrop: (e: React.DragEvent) => void
  handleFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void
  handleSubmit: (e: React.FormEvent) => void
  onCancel: () => void
}

function LeadForm({
  formData,
  setFormData,
  cvFile,
  setCvFile,
  isDragging,
  handleDragOver,
  handleDragLeave,
  handleDrop,
  handleFileChange,
  handleSubmit,
  onCancel,
}: LeadFormProps) {
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

      {/* Calificación */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-foreground border-b pb-2">
          Información Adicional
        </h3>

        <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
          <div>
            <Label htmlFor="tieneEB3" className="text-sm font-medium">
              Capacidad para programa EB-3
            </Label>
            <p className="text-xs text-muted-foreground mt-0.5">
              El candidato cumple requisitos básicos
            </p>
          </div>
          <Switch
            id="tieneEB3"
            checked={formData.tieneEB3}
            onCheckedChange={(checked) => setFormData({ ...formData, tieneEB3: checked })}
          />
        </div>

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

        <div className="space-y-3">
          <Label>Disponibilidad de Dedicación</Label>
          <RadioGroup
            value={formData.dedicacion}
            onValueChange={(value) => setFormData({ ...formData, dedicacion: value })}
            className="grid grid-cols-2 gap-2"
          >
            <Label
              htmlFor="full-time"
              className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5"
            >
              <RadioGroupItem value="full-time" id="full-time" />
              <span className="text-sm">Full-Time</span>
            </Label>
            <Label
              htmlFor="part-time"
              className="flex items-center gap-2 p-3 border rounded-lg cursor-pointer hover:bg-muted/50 transition-colors has-[:checked]:border-primary has-[:checked]:bg-primary/5"
            >
              <RadioGroupItem value="part-time" id="part-time" />
              <span className="text-sm">Part-Time</span>
            </Label>
          </RadioGroup>
        </div>
      </div>

      {/* CV Upload */}
      <div className="space-y-2">
        <Label>CV / Hoja de Vida (PDF)</Label>
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            isDragging ? "border-primary bg-primary/5" : "border-border"
          } ${cvFile ? "bg-green-50 border-green-300" : ""}`}
        >
          {cvFile ? (
            <div className="flex items-center justify-center gap-3">
              <FileText className="w-8 h-8 text-green-600" />
              <div className="text-left">
                <p className="text-sm font-medium text-foreground">{cvFile.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(cvFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setCvFile(null)}
                className="ml-2"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <>
              <Upload className="w-8 h-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-sm text-muted-foreground mb-2">
                Arrastra y suelta el archivo aquí
              </p>
              <label htmlFor="cv-upload">
                <Input
                  id="cv-upload"
                  type="file"
                  accept=".pdf"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <Button type="button" variant="outline" size="sm" asChild>
                  <span>Seleccionar archivo</span>
                </Button>
              </label>
            </>
          )}
        </div>
      </div>

      {/* Notas */}
      <div className="space-y-2">
        <Label htmlFor="notas">Notas Adicionales</Label>
        <Textarea
          id="notas"
          placeholder="Información adicional sobre el candidato..."
          value={formData.notas}
          onChange={(e) => setFormData({ ...formData, notas: e.target.value })}
          rows={3}
        />
      </div>

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <Button type="button" variant="outline" className="flex-1" onClick={onCancel}>
          Cancelar
        </Button>
        <Button type="submit" className="flex-1">
          Agregar Referido
        </Button>
      </div>
    </form>
  )
}
