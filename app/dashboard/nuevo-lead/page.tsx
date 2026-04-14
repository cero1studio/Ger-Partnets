"use client"

import { useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Upload, FileText, X, CheckCircle2, User, CreditCard, Users, Clock } from "lucide-react"

export default function NuevoLeadPage() {
  const router = useRouter()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [file, setFile] = useState<File | null>(null)
  const [dragActive, setDragActive] = useState(false)
  
  const [formData, setFormData] = useState({
    nombre: "",
    email: "",
    whatsapp: "",
    nacionalidad: "",
    estatusVisa: "",
    capacidadEB3: false,
    nucleoFamiliar: "",
    dedicacion: "",
  })

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const droppedFile = e.dataTransfer.files[0]
      if (droppedFile.type === "application/pdf") {
        setFile(droppedFile)
      }
    }
  }, [])

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500))
    
    setIsSubmitting(false)
    setIsSuccess(true)
    
    // Redirect after success
    setTimeout(() => {
      router.push("/dashboard/pipeline")
    }, 2000)
  }

  if (isSuccess) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="w-full max-w-md text-center">
          <CardContent className="pt-10 pb-8">
            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-600" />
            </div>
            <h2 className="text-2xl font-bold text-foreground mb-2">Lead Registrado</h2>
            <p className="text-muted-foreground">
              El lead ha sido registrado exitosamente y enviado a validación comercial.
            </p>
            <p className="text-sm text-muted-foreground mt-4">
              Redirigiendo al pipeline...
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-foreground">Registrar Nuevo Lead</h2>
        <p className="text-muted-foreground mt-1">
          Completa el formulario para registrar un nuevo referido en el sistema.
        </p>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="space-y-6">
          {/* Basic Information */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <User className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Información Básica</CardTitle>
                  <CardDescription>Datos de contacto del candidato</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="nombre">Nombre Completo *</Label>
                  <Input
                    id="nombre"
                    placeholder="Ej: Juan Pérez García"
                    value={formData.nombre}
                    onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
                    required
                  />
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
                  <Label htmlFor="whatsapp">WhatsApp *</Label>
                  <Input
                    id="whatsapp"
                    placeholder="+1 234 567 8900"
                    value={formData.whatsapp}
                    onChange={(e) => setFormData({ ...formData, whatsapp: e.target.value })}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nacionalidad">Nacionalidad *</Label>
                  <Select
                    value={formData.nacionalidad}
                    onValueChange={(value) => setFormData({ ...formData, nacionalidad: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecciona país" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="mexico">México</SelectItem>
                      <SelectItem value="colombia">Colombia</SelectItem>
                      <SelectItem value="venezuela">Venezuela</SelectItem>
                      <SelectItem value="argentina">Argentina</SelectItem>
                      <SelectItem value="peru">Perú</SelectItem>
                      <SelectItem value="chile">Chile</SelectItem>
                      <SelectItem value="ecuador">Ecuador</SelectItem>
                      <SelectItem value="guatemala">Guatemala</SelectItem>
                      <SelectItem value="otro">Otro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Special Qualification */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Calificación Especial</CardTitle>
                  <CardDescription>Preguntas críticas para el proceso migratorio</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Visa Status */}
              <div className="space-y-2">
                <Label htmlFor="visa">Estatus de Visa *</Label>
                <Select
                  value={formData.estatusVisa}
                  onValueChange={(value) => setFormData({ ...formData, estatusVisa: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona estatus de visa" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="sin-visa">Sin Visa</SelectItem>
                    <SelectItem value="b1-b2">Visa Turista B1/B2</SelectItem>
                    <SelectItem value="vencida">Visa Vencida</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              {/* EB-3 Capacity */}
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="eb3-capacity" className="text-base">
                    Capacidad EB-3
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    ¿Tiene capacidad financiera para iniciar el proceso de programa EB-3?
                  </p>
                </div>
                <Switch
                  id="eb3-capacity"
                  checked={formData.capacidadEB3}
                  onCheckedChange={(checked) => setFormData({ ...formData, capacidadEB3: checked })}
                />
              </div>

              <Separator />

              {/* Family */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Users className="w-4 h-4 text-muted-foreground" />
                  <Label>Núcleo Familiar *</Label>
                </div>
                <p className="text-sm text-muted-foreground">¿Viaja con familia?</p>
                <Select
                  value={formData.nucleoFamiliar}
                  onValueChange={(value) => setFormData({ ...formData, nucleoFamiliar: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecciona opción" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="solo">Solo</SelectItem>
                    <SelectItem value="pareja">Pareja</SelectItem>
                    <SelectItem value="pareja-hijos">Pareja e Hijos</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              {/* Dedication */}
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Clock className="w-4 h-4 text-muted-foreground" />
                  <Label>Dedicación *</Label>
                </div>
                <p className="text-sm text-muted-foreground">¿Disponibilidad de tiempo para el programa?</p>
                <RadioGroup
                  value={formData.dedicacion}
                  onValueChange={(value) => setFormData({ ...formData, dedicacion: value })}
                  className="flex flex-col sm:flex-row gap-4"
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="tiempo-completo" id="tiempo-completo" />
                    <Label htmlFor="tiempo-completo" className="font-normal cursor-pointer">
                      Tiempo Completo
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="medio-tiempo" id="medio-tiempo" />
                    <Label htmlFor="medio-tiempo" className="font-normal cursor-pointer">
                      Medio Tiempo
                    </Label>
                  </div>
                </RadioGroup>
              </div>
            </CardContent>
          </Card>

          {/* Document Upload */}
          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <CardTitle className="text-lg">Carga de Documentos</CardTitle>
                  <CardDescription>Adjunta el CV del candidato en formato PDF</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {file ? (
                <div className="flex items-center justify-between p-4 border border-border rounded-lg bg-muted/30">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                      <FileText className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <p className="font-medium text-sm">{file.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {(file.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() => setFile(null)}
                    className="text-muted-foreground hover:text-destructive"
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              ) : (
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    dragActive
                      ? "border-primary bg-primary/5"
                      : "border-border hover:border-primary/50"
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileChange}
                    className="hidden"
                    id="file-upload"
                  />
                  <label htmlFor="file-upload" className="cursor-pointer">
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                      <Upload className="w-6 h-6 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-medium text-foreground mb-1">
                      Arrastra y suelta tu archivo aquí
                    </p>
                    <p className="text-xs text-muted-foreground mb-3">
                      o haz clic para seleccionar
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Solo archivos PDF (máx. 10MB)
                    </p>
                  </label>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Submit Button */}
          <div className="flex items-center justify-end gap-4">
            <Button type="button" variant="outline" onClick={() => router.back()}>
              Cancelar
            </Button>
            <Button type="submit" disabled={isSubmitting} className="min-w-[200px]">
              {isSubmitting ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Registrando...
                </span>
              ) : (
                "Registrar y Enviar a Validación Comercial"
              )}
            </Button>
          </div>
        </div>
      </form>
    </div>
  )
}
