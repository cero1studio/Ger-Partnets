"use client"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts"

const leadSourceData = [
  { name: "Referidos Directos", value: 45, color: "#004675" },
  { name: "Eventos", value: 25, color: "#0088cc" },
  { name: "Redes Sociales", value: 20, color: "#66b3e0" },
  { name: "Otros", value: 10, color: "#b3d9f0" },
]

const conversionData = [
  { name: "Ene", leads: 45, convertidos: 8 },
  { name: "Feb", leads: 52, convertidos: 12 },
  { name: "Mar", leads: 61, convertidos: 15 },
  { name: "Abr", leads: 48, convertidos: 10 },
  { name: "May", leads: 55, convertidos: 14 },
  { name: "Jun", leads: 67, convertidos: 18 },
]

const programData = [
  { name: "EB-3 IT", value: 35 },
  { name: "EB-3 Healthcare", value: 28 },
  { name: "EB-3 Manufacturing", value: 22 },
  { name: "EB-3 Hospitality", value: 15 },
]

const stats = [
  { label: "Leads Este Mes", value: "67", change: "+12%" },
  { label: "Tasa de Conversión", value: "26.8%", change: "+4.2%" },
  { label: "Tiempo Promedio", value: "18 días", change: "-3 días" },
  { label: "Valor Promedio", value: "$4,500", change: "+$200" },
]

export default function AnaliticaPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Analítica</h2>
          <p className="text-muted-foreground mt-1">
            Visualiza el rendimiento de tus leads y conversiones
          </p>
        </div>
        <Select defaultValue="month">
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Período" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="week">Esta Semana</SelectItem>
            <SelectItem value="month">Este Mes</SelectItem>
            <SelectItem value="quarter">Este Trimestre</SelectItem>
            <SelectItem value="year">Este Año</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Quick Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-6">
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <div className="flex items-baseline gap-2 mt-1">
                <span className="text-2xl font-bold">{stat.value}</span>
                <span className="text-sm text-green-600 font-medium">{stat.change}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Lead Source Donut Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Origen de Leads</CardTitle>
            <CardDescription>Distribución por fuente de adquisición</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={leadSourceData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {leadSourceData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number) => [`${value}%`, "Porcentaje"]}
                  />
                  <Legend
                    verticalAlign="bottom"
                    height={36}
                    formatter={(value) => (
                      <span className="text-sm text-foreground">{value}</span>
                    )}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Conversion Bar Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Estado de Conversiones</CardTitle>
            <CardDescription>Leads vs conversiones por mes</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={conversionData}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                    axisLine={{ stroke: "hsl(var(--border))" }}
                  />
                  <YAxis
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                    axisLine={{ stroke: "hsl(var(--border))" }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend
                    formatter={(value) => (
                      <span className="text-sm text-foreground">
                        {value === "leads" ? "Total Leads" : "Convertidos"}
                      </span>
                    )}
                  />
                  <Bar dataKey="leads" fill="#66b3e0" radius={[4, 4, 0, 0]} name="leads" />
                  <Bar dataKey="convertidos" fill="#004675" radius={[4, 4, 0, 0]} name="convertidos" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Program Distribution */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>Distribución por Programa</CardTitle>
            <CardDescription>Leads activos por tipo de programa EB-3</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={programData} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border" horizontal={false} />
                  <XAxis
                    type="number"
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                    axisLine={{ stroke: "hsl(var(--border))" }}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 12 }}
                    axisLine={{ stroke: "hsl(var(--border))" }}
                    width={120}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number) => [`${value} leads`, "Cantidad"]}
                  />
                  <Bar dataKey="value" fill="#004675" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
