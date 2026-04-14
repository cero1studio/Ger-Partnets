import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Users, UserCheck, Clock, TrendingUp, ArrowUpRight, ArrowDownRight } from "lucide-react"

const stats = [
  {
    title: "Total Leads",
    value: "248",
    change: "+12%",
    trend: "up",
    description: "vs. mes anterior",
    icon: Users,
  },
  {
    title: "En Proceso",
    value: "86",
    change: "+5%",
    trend: "up",
    description: "vs. mes anterior",
    icon: Clock,
  },
  {
    title: "Contratados",
    value: "32",
    change: "+18%",
    trend: "up",
    description: "vs. mes anterior",
    icon: UserCheck,
  },
  {
    title: "Tasa de Conversión",
    value: "12.9%",
    change: "-2%",
    trend: "down",
    description: "vs. mes anterior",
    icon: TrendingUp,
  },
]

const recentLeads = [
  { name: "María García", program: "EB-3 Healthcare", status: "Screening", date: "Hace 2 horas" },
  { name: "Carlos Rodríguez", program: "EB-3 IT", status: "Entrevista", date: "Hace 5 horas" },
  { name: "Ana Martínez", program: "EB-3 Hospitality", status: "Nuevo", date: "Hace 1 día" },
  { name: "Luis Hernández", program: "EB-3 Manufacturing", status: "Programa EB-3", date: "Hace 1 día" },
  { name: "Sofia López", program: "EB-3 IT", status: "Contratado", date: "Hace 2 días" },
]

const statusColors: Record<string, string> = {
  Nuevo: "bg-blue-100 text-blue-700",
  Screening: "bg-amber-100 text-amber-700",
  Entrevista: "bg-purple-100 text-purple-700",
  "Programa EB-3": "bg-primary/10 text-primary",
  Contratado: "bg-green-100 text-green-700",
}

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div>
        <h2 className="text-2xl font-bold text-foreground">Bienvenido, Juan</h2>
        <p className="text-muted-foreground mt-1">
          Aquí tienes un resumen de tu actividad reciente.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className="w-4 h-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stat.value}</div>
              <div className="flex items-center gap-1 mt-1">
                {stat.trend === "up" ? (
                  <ArrowUpRight className="w-4 h-4 text-green-600" />
                ) : (
                  <ArrowDownRight className="w-4 h-4 text-red-600" />
                )}
                <span
                  className={`text-sm font-medium ${
                    stat.trend === "up" ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {stat.change}
                </span>
                <span className="text-sm text-muted-foreground">{stat.description}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent Leads */}
      <Card>
        <CardHeader>
          <CardTitle>Leads Recientes</CardTitle>
          <CardDescription>Últimos referidos registrados en el sistema</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentLeads.map((lead, index) => (
              <div
                key={index}
                className="flex items-center justify-between py-3 border-b border-border last:border-0"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <span className="text-sm font-medium text-primary">
                      {lead.name.split(" ").map((n) => n[0]).join("")}
                    </span>
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{lead.name}</p>
                    <p className="text-sm text-muted-foreground">{lead.program}</p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span
                    className={`px-2.5 py-1 rounded-full text-xs font-medium ${
                      statusColors[lead.status] || "bg-muted text-muted-foreground"
                    }`}
                  >
                    {lead.status}
                  </span>
                  <span className="text-sm text-muted-foreground hidden sm:block">
                    {lead.date}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
