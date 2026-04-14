"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Eye, EyeOff, Check, Tag } from "lucide-react"

// Demo users info
const demoUsers: Record<string, { nombre: string; apellido: string; email: string; etiqueta: string }> = {
  "demo@ger.com": { nombre: "Carlos", apellido: "Mendoza", email: "demo@ger.com", etiqueta: "carlos.mendoza" },
  "nuevo@ger.com": { nombre: "Patricia", apellido: "López", email: "nuevo@ger.com", etiqueta: "patricia.lopez" },
}

export default function PerfilPage() {
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [user, setUser] = useState({ nombre: "Usuario", apellido: "", email: "", etiqueta: "usuario" })

  useEffect(() => {
    const storedUser = localStorage.getItem("ger_demo_user") || "demo@ger.com"
    const userData = demoUsers[storedUser] || demoUsers["demo@ger.com"]
    setUser(userData)
  }, [])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!currentPassword) {
      newErrors.currentPassword = "Ingresa tu contraseña actual"
    }

    if (!newPassword) {
      newErrors.newPassword = "Ingresa tu nueva contraseña"
    } else if (newPassword.length < 6) {
      newErrors.newPassword = "La contraseña debe tener al menos 6 caracteres"
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = "Confirma tu nueva contraseña"
    } else if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = "Las contraseñas no coinciden"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    setIsLoading(true)
    setSuccess(false)

    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1500))

    setIsLoading(false)
    setSuccess(true)
    setCurrentPassword("")
    setNewPassword("")
    setConfirmPassword("")

    // Clear success message after 3 seconds
    setTimeout(() => setSuccess(false), 3000)
  }

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-foreground mb-6">Mi Perfil</h1>

      {/* User Info Card */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-center gap-4">
            <Avatar className="w-20 h-20">
              <AvatarFallback className="bg-primary text-primary-foreground text-2xl">
                {user.nombre[0]}{user.apellido[0]}
              </AvatarFallback>
            </Avatar>
            <div className="text-center sm:text-left">
              <h2 className="text-xl font-semibold text-foreground">
                {user.nombre} {user.apellido}
              </h2>
              <p className="text-muted-foreground text-sm">{user.email}</p>
              <div className="flex items-center gap-2 mt-2 justify-center sm:justify-start">
                <Tag className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-primary">@{user.etiqueta}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Change Password Card */}
      <Card>
        <CardHeader>
          <CardTitle>Cambiar Contraseña</CardTitle>
          <CardDescription>
            Actualiza tu contraseña para mantener tu cuenta segura.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700">
              <Check className="w-5 h-5" />
              <span className="text-sm font-medium">Contraseña actualizada correctamente</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="currentPassword">Contraseña Actual</Label>
              <div className="relative">
                <Input
                  id="currentPassword"
                  type={showCurrentPassword ? "text" : "password"}
                  placeholder="********"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className={errors.currentPassword ? "border-destructive pr-10" : "pr-10"}
                />
                <button
                  type="button"
                  onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.currentPassword && (
                <p className="text-destructive text-sm">{errors.currentPassword}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="newPassword">Nueva Contraseña</Label>
              <div className="relative">
                <Input
                  id="newPassword"
                  type={showNewPassword ? "text" : "password"}
                  placeholder="********"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className={errors.newPassword ? "border-destructive pr-10" : "pr-10"}
                />
                <button
                  type="button"
                  onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.newPassword && (
                <p className="text-destructive text-sm">{errors.newPassword}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="confirmPassword">Confirmar Nueva Contraseña</Label>
              <div className="relative">
                <Input
                  id="confirmPassword"
                  type={showConfirmPassword ? "text" : "password"}
                  placeholder="********"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className={errors.confirmPassword ? "border-destructive pr-10" : "pr-10"}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-destructive text-sm">{errors.confirmPassword}</p>
              )}
            </div>

            <Button type="submit" className="w-full sm:w-auto" disabled={isLoading}>
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Guardando...
                </span>
              ) : (
                "Guardar Contraseña"
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
