"use client"

import { useState, useCallback, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
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
  Upload,
  X,
  FileText,
  MessageSquare,
  Video,
  User,
  Clock,
} from "lucide-react"

type Comment = {
  id: string
  autor: string
  texto: string
  fecha: string
}

type Meeting = {
  id: string
  titulo: string
  fecha: string
  tipo: "llamada" | "video" | "presencial"
  notas?: string
}

type Lead = {
  id: string
  nombre: string
  email: string
  telefono: string
  ciudad: string
  nacionalidad: string
  programa: string
  etapa: string
  fechaRegistro: string
  tuvoVisa: boolean
  tipoVisa?: string
  puedeCubrirCostos: string
  aceptaInversion: boolean
  profesion: string
  nivelEscolaridad: string
  nucleoFamiliar: number
  notas?: string
  responsable: string
  comentarios?: Comment[]
  reuniones?: Meeting[]
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
        ciudad: "Caracas",
        nacionalidad: "Venezuela",
        programa: "EB-3 Unskilled Worker",
        etapa: "appointmentscheduled",
        fechaRegistro: "10/04/2026",
        tuvoVisa: true,
        tipoVisa: "B1/B2 Turista",
        puedeCubrirCostos: "si",
        aceptaInversion: true,
        profesion: "Administradora",
        nivelEscolaridad: "Universitario",
        nucleoFamiliar: 4,
        notas: "Interesada en trabajos de procesamiento de alimentos",
        responsable: "Ana García",
        comentarios: [
          { id: "c1", autor: "Ana García", texto: "Primera llamada realizada, muy interesada en el programa.", fecha: "10/04/2026 10:30" },
          { id: "c2", autor: "Ana García", texto: "Documentos pendientes: pasaporte y certificado de antecedentes.", fecha: "11/04/2026 15:00" },
        ],
        reuniones: [
          { id: "r1", titulo: "Llamada de introducción", fecha: "10/04/2026 10:00", tipo: "llamada", notas: "Explicación inicial del programa" },
        ],
      },
      {
        id: "2",
        nombre: "Roberto Herrera",
        email: "roberto.h@gmail.com",
        telefono: "+57 311 987 6543",
        ciudad: "Bogotá",
        nacionalidad: "Colombia",
        programa: "EB-3 Skilled Worker",
        etapa: "presentationscheduled",
        fechaRegistro: "08/04/2026",
        tuvoVisa: true,
        tipoVisa: "H-1B",
        puedeCubrirCostos: "si",
        aceptaInversion: true,
        profesion: "Ingeniero Industrial",
        nivelEscolaridad: "Posgrado",
        nucleoFamiliar: 2,
        notas: "Ingeniero industrial con 5 años de experiencia",
        responsable: "Luis Martínez",
        comentarios: [
          { id: "c3", autor: "Luis Martínez", texto: "CV revisado, perfil excelente para EB-3 Skilled.", fecha: "09/04/2026 09:00" },
        ],
        reuniones: [
          { id: "r2", titulo: "Video llamada de evaluación", fecha: "09/04/2026 14:00", tipo: "video", notas: "Evaluación técnica completada" },
        ],
      },
      {
        id: "3",
        nombre: "Ana Martínez",
        email: "ana.martinez@outlook.com",
        telefono: "+52 55 8765 4321",
        ciudad: "Ciudad de México",
        nacionalidad: "México",
        programa: "EB-3 Unskilled Worker",
        etapa: "decisionmakerboughtin",
        fechaRegistro: "01/04/2026",
        tuvoVisa: false,
        puedeCubrirCostos: "con-financiamiento",
        aceptaInversion: true,
        profesion: "Técnica en Enfermería",
        nivelEscolaridad: "Técnico",
        nucleoFamiliar: 3,
        notas: "Disponibilidad inmediata",
        responsable: "Carmen López",
        comentarios: [
          { id: "c4", autor: "Carmen López", texto: "Reunión agendada para el viernes.", fecha: "03/04/2026 11:00" },
          { id: "c5", autor: "Carmen López", texto: "Muy motivada, familia lista para mudarse.", fecha: "05/04/2026 16:30" },
        ],
        reuniones: [
          { id: "r3", titulo: "Asesoría completa", fecha: "05/04/2026 10:00", tipo: "video", notas: "Se explicó todo el proceso EB-3" },
        ],
      },
      {
        id: "4",
        nombre: "Luis Fernández",
        email: "luis.f@email.com",
        telefono: "+51 999 111 2222",
        ciudad: "Lima",
        nacionalidad: "Perú",
        programa: "EB-3 Skilled Worker",
        etapa: "closedwon",
        fechaRegistro: "15/03/2026",
        tuvoVisa: true,
        tipoVisa: "B1/B2 Turista",
        puedeCubrirCostos: "si",
        aceptaInversion: true,
        profesion: "Técnico en Soldadura",
        nivelEscolaridad: "Técnico",
        nucleoFamiliar: 5,
        notas: "Técnico en soldadura certificado",
        responsable: "Ana García",
        comentarios: [
          { id: "c6", autor: "Ana García", texto: "Pago G1 confirmado, procesando documentación.", fecha: "20/03/2026 14:00" },
        ],
        reuniones: [],
      },
      {
        id: "5",
        nombre: "Carmen Rojas",
        email: "carmen.rojas@gmail.com",
        telefono: "+593 98 765 4321",
        ciudad: "Guayaquil",
        nacionalidad: "Ecuador",
        programa: "EB-3 Unskilled Worker",
        etapa: "1062656364",
        fechaRegistro: "01/03/2026",
        tuvoVisa: false,
        puedeCubrirCostos: "si",
        aceptaInversion: true,
        profesion: "Operaria de Producción",
        nivelEscolaridad: "Bachillerato",
        nucleoFamiliar: 2,
        notas: "Proceso completado exitosamente",
        responsable: "Luis Martínez",
        comentarios: [
          { id: "c7", autor: "Luis Martínez", texto: "Caso cerrado exitosamente. Cliente muy satisfecha.", fecha: "10/04/2026 09:00" },
        ],
        reuniones: [
          { id: "r4", titulo: "Llamada de cierre", fecha: "10/04/2026 09:00", tipo: "llamada", notas: "Felicitaciones y próximos pasos" },
        ],
      },
      {
        id: "6",
        nombre: "Pedro Sánchez",
        email: "pedro.s@hotmail.com",
        telefono: "+58 412 333 4444",
        ciudad: "Maracaibo",
        nacionalidad: "Venezuela",
        programa: "H-2B Visa",
        etapa: "qualifiedtobuy",
        fechaRegistro: "12/04/2026",
        tuvoVisa: false,
        puedeCubrirCostos: "no",
        aceptaInversion: false,
        profesion: "Electricista",
        nivelEscolaridad: "Bachillerato",
        nucleoFamiliar: 1,
        notas: "",
        responsable: "Carmen López",
        comentarios: [
          { id: "c8", autor: "Carmen López", texto: "Tercer intento de contacto sin respuesta.", fecha: "14/04/2026 10:00" },
        ],
        reuniones: [],
      },
      {
        id: "7",
        nombre: "Isabella Torres",
        email: "isabella.t@email.com",
        telefono: "+57 320 555 6666",
        ciudad: "Medellín",
        nacionalidad: "Colombia",
        programa: "EB-3 Unskilled Worker",
        etapa: "1226150813",
        fechaRegistro: "05/04/2026",
        tuvoVisa: true,
        tipoVisa: "B1/B2 Turista",
        puedeCubrirCostos: "si",
        aceptaInversion: true,
        profesion: "Auxiliar Contable",
        nivelEscolaridad: "Técnico",
        nucleoFamiliar: 3,
        notas: "Referencias laborales verificadas",
        responsable: "Ana García",
        comentarios: [
          { id: "c9", autor: "Ana García", texto: "En proceso de recopilar documentos adicionales.", fecha: "12/04/2026 11:00" },
        ],
        reuniones: [
          { id: "r5", titulo: "Seguimiento semanal", fecha: "12/04/2026 11:00", tipo: "llamada" },
        ],
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

export default function DashboardPage() {
  const [currentUser, setCurrentUser] = useState("demo@ger.com")
  const [leads, setLeads] = useState<Lead[]>([])
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null)
  const [cvFile, setCvFile] = useState<File | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  
  useEffect(() => {
    const storedUser = localStorage.getItem("ger_demo_user") || "demo@ger.com"
    setCurrentUser(storedUser)
    const userData = demoUsers[storedUser as keyof typeof demoUsers] || demoUsers["demo@ger.com"]
    setLeads(userData.leads)
  }, [])
  
  // Form state
  const [formData, setFormData] = useState({
    nombre: "",
    apellido: "",
    email: "",
    telefono: "",
    ciudad: "",
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
      etapa: "appointmentscheduled",
      fechaRegistro: new Date().toLocaleDateString("es-ES"),
      tieneEB3: formData.tieneEB3,
      nucleoFamiliar: parseInt(formData.nucleoFamiliar),
      dedicacion: formData.dedicacion,
      notas: formData.notas,
      responsable: "Sin asignar",
      comentarios: [],
      reuniones: [],
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
  const commentCount = lead.comentarios?.length || 0
  const meetingCount = lead.reuniones?.length || 0
  
  return (
    <Card 
      className="bg-card hover:shadow-md transition-shadow cursor-pointer"
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-medium text-foreground text-sm">{lead.nombre}</h3>
          {lead.tieneEB3 && (
            <Badge className="bg-secondary text-secondary-foreground text-xs shrink-0">EB-3</Badge>
          )}
        </div>
        
        <div className="space-y-1.5 text-xs text-muted-foreground mb-3">
          <div className="flex items-center gap-2">
            <MapPin className="w-3 h-3 shrink-0" />
            <span>{lead.nacionalidad}</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-3 h-3 shrink-0" />
            <span>{lead.fechaRegistro}</span>
          </div>
        </div>

        {/* Responsable */}
        <div className="flex items-center gap-2 mb-3 p-2 bg-muted/50 rounded-md">
          <Avatar className="w-5 h-5">
            <AvatarFallback className="text-[10px] bg-primary text-primary-foreground">
              {lead.responsable.split(" ").map(n => n[0]).join("")}
            </AvatarFallback>
          </Avatar>
          <span className="text-xs text-muted-foreground">{lead.responsable}</span>
        </div>

        <div className="pt-2 border-t flex items-center justify-between">
          <Badge variant="outline" className="text-xs">
            {lead.programa}
          </Badge>
          <div className="flex items-center gap-2 text-muted-foreground">
            {commentCount > 0 && (
              <div className="flex items-center gap-1 text-xs">
                <MessageSquare className="w-3 h-3" />
                {commentCount}
              </div>
            )}
            {meetingCount > 0 && (
              <div className="flex items-center gap-1 text-xs">
                <Video className="w-3 h-3" />
                {meetingCount}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function LeadDetail({ lead, onClose }: { lead: Lead; onClose: () => void }) {
  const etapa = etapas.find(e => e.id === lead.etapa)
  
  return (
    <div className="space-y-6">
      <SheetHeader>
        <SheetTitle className="flex items-center gap-3">
          <Avatar className="w-10 h-10">
            <AvatarFallback className="bg-primary text-primary-foreground">
              {lead.nombre.split(" ").map(n => n[0]).join("").slice(0, 2)}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="text-lg font-semibold">{lead.nombre}</p>
            <Badge className={`${etapa?.color} text-white text-xs mt-1`}>
              {etapa?.nombre}
            </Badge>
          </div>
        </SheetTitle>
        <SheetDescription>Hoja de vida del candidato</SheetDescription>
      </SheetHeader>

      {/* Información de Contacto */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground border-b pb-2">Contacto</h3>
        <div className="grid gap-2 text-sm">
          <div className="flex items-center gap-3">
            <Mail className="w-4 h-4 text-muted-foreground" />
            <a href={`mailto:${lead.email}`} className="text-primary hover:underline">{lead.email}</a>
          </div>
          <div className="flex items-center gap-3">
            <Phone className="w-4 h-4 text-muted-foreground" />
            <a href={`tel:${lead.telefono}`} className="text-primary hover:underline">{lead.telefono}</a>
          </div>
          <div className="flex items-center gap-3">
            <MapPin className="w-4 h-4 text-muted-foreground" />
            <span>{lead.nacionalidad}</span>
          </div>
        </div>
      </div>

      {/* Información del Programa */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground border-b pb-2">Programa</h3>
        <div className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <p className="text-muted-foreground text-xs">Programa</p>
            <p className="font-medium">{lead.programa}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Capacidad EB-3</p>
            <p className="font-medium">{lead.tieneEB3 ? "Sí" : "No"}</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Núcleo Familiar</p>
            <p className="font-medium">{lead.nucleoFamiliar} personas</p>
          </div>
          <div>
            <p className="text-muted-foreground text-xs">Dedicación</p>
            <p className="font-medium">{lead.dedicacion === "full-time" ? "Tiempo completo" : "Medio tiempo"}</p>
          </div>
        </div>
      </div>

      {/* Responsable */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-foreground border-b pb-2">Responsable</h3>
        <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
          <Avatar className="w-8 h-8">
            <AvatarFallback className="bg-primary text-primary-foreground text-sm">
              {lead.responsable.split(" ").map(n => n[0]).join("")}
            </AvatarFallback>
          </Avatar>
          <div>
            <p className="font-medium text-sm">{lead.responsable}</p>
            <p className="text-xs text-muted-foreground">Asesor asignado en HubSpot</p>
          </div>
        </div>
      </div>

      {/* Notas */}
      {lead.notas && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground border-b pb-2">Notas</h3>
          <p className="text-sm text-muted-foreground bg-muted/50 p-3 rounded-lg">{lead.notas}</p>
        </div>
      )}

      {/* Reuniones */}
      {lead.reuniones && lead.reuniones.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground border-b pb-2 flex items-center gap-2">
            <Video className="w-4 h-4" />
            Reuniones ({lead.reuniones.length})
          </h3>
          <div className="space-y-2">
            {lead.reuniones.map((reunion) => (
              <div key={reunion.id} className="p-3 bg-muted/50 rounded-lg text-sm">
                <div className="flex items-center justify-between mb-1">
                  <p className="font-medium">{reunion.titulo}</p>
                  <Badge variant="outline" className="text-xs capitalize">
                    {reunion.tipo === "llamada" ? "Llamada" : reunion.tipo === "video" ? "Video" : "Presencial"}
                  </Badge>
                </div>
                <div className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Clock className="w-3 h-3" />
                  {reunion.fecha}
                </div>
                {reunion.notas && (
                  <p className="text-xs text-muted-foreground mt-2">{reunion.notas}</p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Comentarios */}
      {lead.comentarios && lead.comentarios.length > 0 && (
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground border-b pb-2 flex items-center gap-2">
            <MessageSquare className="w-4 h-4" />
            Comentarios ({lead.comentarios.length})
          </h3>
          <div className="space-y-3">
            {lead.comentarios.map((comment) => (
              <div key={comment.id} className="text-sm">
                <div className="flex items-center gap-2 mb-1">
                  <Avatar className="w-5 h-5">
                    <AvatarFallback className="text-[10px] bg-muted-foreground text-muted">
                      {comment.autor.split(" ").map(n => n[0]).join("")}
                    </AvatarFallback>
                  </Avatar>
                  <span className="font-medium text-xs">{comment.autor}</span>
                  <span className="text-xs text-muted-foreground">{comment.fecha}</span>
                </div>
                <p className="text-muted-foreground pl-7">{comment.texto}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Fecha de Registro */}
      <div className="pt-4 border-t text-xs text-muted-foreground">
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
            className="flex gap-4"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="full-time" id="full-time" />
              <Label htmlFor="full-time" className="font-normal cursor-pointer">Tiempo completo</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="part-time" id="part-time" />
              <Label htmlFor="part-time" className="font-normal cursor-pointer">Medio tiempo</Label>
            </div>
          </RadioGroup>
        </div>
      </div>

      {/* CV Upload */}
      <div className="space-y-3">
        <Label>Currículum (PDF)</Label>
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={`border-2 border-dashed rounded-lg p-6 text-center transition-colors ${
            isDragging ? "border-primary bg-primary/5" : "border-border"
          }`}
        >
          {cvFile ? (
            <div className="flex items-center justify-center gap-3">
              <FileText className="w-8 h-8 text-primary" />
              <div className="text-left">
                <p className="text-sm font-medium">{cvFile.name}</p>
                <p className="text-xs text-muted-foreground">
                  {(cvFile.size / 1024 / 1024).toFixed(2)} MB
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="ml-2"
                onClick={() => setCvFile(null)}
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
          ) : (
            <>
              <Upload className="w-8 h-8 mx-auto text-muted-foreground mb-2" />
              <p className="text-sm text-muted-foreground mb-1">
                Arrastra el archivo aquí o
              </p>
              <label className="text-sm text-primary hover:underline cursor-pointer">
                selecciona un archivo
                <input
                  type="file"
                  accept=".pdf"
                  className="hidden"
                  onChange={handleFileChange}
                />
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
        <Button type="submit" className="flex-1">
          Guardar Referido
        </Button>
      </div>
    </form>
  )
}
