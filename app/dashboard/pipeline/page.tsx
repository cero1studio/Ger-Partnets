"use client"

import { useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Search, MoreVertical, Calendar, User, AlertCircle, CheckCircle2, Plus } from "lucide-react"

interface Lead {
  id: string
  name: string
  program: string
  date: string
  priority: "alta" | "media" | "baja"
  completion: number
  email: string
}

interface Column {
  id: string
  title: string
  color: string
  leads: Lead[]
}

const initialColumns: Column[] = [
  {
    id: "registro",
    title: "Asignación / Registro",
    color: "bg-blue-500",
    leads: [
      {
        id: "1",
        name: "Juan Pérez",
        program: "EB-3 IT",
        date: "2024-01-15",
        priority: "alta",
        completion: 40,
        email: "juan@email.com",
      },
      {
        id: "2",
        name: "María González",
        program: "EB-3 Healthcare",
        date: "2024-01-14",
        priority: "media",
        completion: 25,
        email: "maria@email.com",
      },
      {
        id: "3",
        name: "Roberto Silva",
        program: "EB-3 Manufacturing",
        date: "2024-01-13",
        priority: "baja",
        completion: 60,
        email: "roberto@email.com",
      },
    ],
  },
  {
    id: "screening",
    title: "Screening Inicial",
    color: "bg-amber-500",
    leads: [
      {
        id: "4",
        name: "Ana Martínez",
        program: "EB-3 Hospitality",
        date: "2024-01-12",
        priority: "alta",
        completion: 55,
        email: "ana@email.com",
      },
      {
        id: "5",
        name: "Carlos López",
        program: "EB-3 IT",
        date: "2024-01-11",
        priority: "media",
        completion: 70,
        email: "carlos@email.com",
      },
    ],
  },
  {
    id: "entrevistas",
    title: "Entrevistas / Evaluación",
    color: "bg-purple-500",
    leads: [
      {
        id: "6",
        name: "Sofía Hernández",
        program: "EB-3 IT",
        date: "2024-01-10",
        priority: "alta",
        completion: 80,
        email: "sofia@email.com",
      },
      {
        id: "7",
        name: "Diego Ramírez",
        program: "EB-3 Healthcare",
        date: "2024-01-09",
        priority: "media",
        completion: 85,
        email: "diego@email.com",
      },
      {
        id: "8",
        name: "Laura Torres",
        program: "EB-3 Manufacturing",
        date: "2024-01-08",
        priority: "baja",
        completion: 75,
        email: "laura@email.com",
      },
    ],
  },
  {
    id: "eb3-pago",
    title: "Programa EB-3 / Pago",
    color: "bg-primary",
    leads: [
      {
        id: "9",
        name: "Fernando Castro",
        program: "EB-3 IT",
        date: "2024-01-07",
        priority: "alta",
        completion: 90,
        email: "fernando@email.com",
      },
    ],
  },
  {
    id: "contratado",
    title: "Contratado / Aplicado",
    color: "bg-green-500",
    leads: [
      {
        id: "10",
        name: "Patricia Morales",
        program: "EB-3 Healthcare",
        date: "2024-01-06",
        priority: "alta",
        completion: 100,
        email: "patricia@email.com",
      },
      {
        id: "11",
        name: "Miguel Ángel Ruiz",
        program: "EB-3 IT",
        date: "2024-01-05",
        priority: "media",
        completion: 100,
        email: "miguel@email.com",
      },
    ],
  },
]

const priorityColors = {
  alta: "bg-red-100 text-red-700 border-red-200",
  media: "bg-amber-100 text-amber-700 border-amber-200",
  baja: "bg-green-100 text-green-700 border-green-200",
}

const priorityLabels = {
  alta: "Alta",
  media: "Media",
  baja: "Baja",
}

function LeadCard({ lead }: { lead: Lead }) {
  return (
    <Card className="shadow-sm hover:shadow-md transition-shadow cursor-pointer">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
              <User className="w-4 h-4 text-primary" />
            </div>
            <div>
              <p className="font-medium text-sm text-foreground">{lead.name}</p>
              <p className="text-xs text-muted-foreground">{lead.program}</p>
            </div>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" className="h-6 w-6">
                <MoreVertical className="w-4 h-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Ver detalles</DropdownMenuItem>
              <DropdownMenuItem>Editar</DropdownMenuItem>
              <DropdownMenuItem>Mover a siguiente etapa</DropdownMenuItem>
              <DropdownMenuItem className="text-destructive">Archivar</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="space-y-3">
          {/* Priority Badge */}
          <div className="flex items-center gap-2">
            <Badge variant="outline" className={`text-xs ${priorityColors[lead.priority]}`}>
              {lead.priority === "alta" && <AlertCircle className="w-3 h-3 mr-1" />}
              Prioridad {priorityLabels[lead.priority]}
            </Badge>
          </div>

          {/* Profile Completion */}
          <div>
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs text-muted-foreground">Compleción de Perfil</span>
              <span className="text-xs font-medium">{lead.completion}%</span>
            </div>
            <div className="w-full h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all ${
                  lead.completion === 100 ? "bg-green-500" : "bg-primary"
                }`}
                style={{ width: `${lead.completion}%` }}
              />
            </div>
          </div>

          {/* Date */}
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="w-3 h-3" />
            <span>Registrado: {new Date(lead.date).toLocaleDateString("es-ES")}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function PipelinePage() {
  const [columns] = useState<Column[]>(initialColumns)
  const [searchTerm, setSearchTerm] = useState("")

  const filteredColumns = columns.map((column) => ({
    ...column,
    leads: column.leads.filter(
      (lead) =>
        lead.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.program.toLowerCase().includes(searchTerm.toLowerCase()) ||
        lead.email.toLowerCase().includes(searchTerm.toLowerCase())
    ),
  }))

  const totalLeads = columns.reduce((acc, col) => acc + col.leads.length, 0)

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Pipeline de Leads</h2>
          <p className="text-muted-foreground mt-1">
            {totalLeads} leads en el pipeline
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar leads..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 w-64"
            />
          </div>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Nuevo Lead
          </Button>
        </div>
      </div>

      {/* Kanban Board */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {filteredColumns.map((column) => (
          <div key={column.id} className="flex-shrink-0 w-80">
            <Card className="bg-muted/30">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-3 h-3 rounded-full ${column.color}`} />
                    <CardTitle className="text-sm font-semibold">{column.title}</CardTitle>
                  </div>
                  <Badge variant="secondary" className="text-xs">
                    {column.leads.length}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-3 min-h-[400px]">
                {column.leads.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                    <CheckCircle2 className="w-8 h-8 mb-2 opacity-50" />
                    <p className="text-sm">Sin leads</p>
                  </div>
                ) : (
                  column.leads.map((lead) => <LeadCard key={lead.id} lead={lead} />)
                )}
              </CardContent>
            </Card>
          </div>
        ))}
      </div>
    </div>
  )
}
