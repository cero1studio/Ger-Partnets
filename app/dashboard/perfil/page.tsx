"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Eye, EyeOff, Check, Tag, AlertCircle } from "lucide-react"

export default function PerfilPage() {
  const [user, setUser] = useState<{ nombre: string; apellido: string; email: string; etiqueta: string } | null>(null)
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showCurrentPassword, setShowCurrentPassword] = useState(false)
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  useEffect(() => {
    fetch("/api/auth/me")
      .then(r => r.ok ? r.json() : null)
      .then(data => { if (data?.user) setUser(data.user) })
      .catch(() => {})
  }, [])

  const validateForm = () => {
    const errs: Record<string, string> = {}
    if (!currentPassword) errs.currentPassword = "Ingresa tu contraseña actual"
    if (!newPassword) errs.newPassword = "Ingresa tu nueva contraseña"
    else if (newPassword.length < 6) errs.newPassword = "Mínimo 6 caracteres"
    if (!confirmPassword) errs.confirmPassword = "Confirma tu nueva contraseña"
    else if (newPassword !== confirmPassword) errs.confirmPassword = "Las contraseñas no coinciden"
    setErrors(errs)
    return Object.keys(errs).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    setIsLoading(true)
    setSuccess(false)
    setErrors({})

    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ currentPassword, newPassword }),
      })
      const data = await res.json()
      if (!res.ok) {
        setErrors({ currentPassword: data.error ?? "Error al cambiar contraseña" })
        return
      }
      setSuccess(true)
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
      setTimeout(() => setSuccess(false), 4000)
    } catch {
      setErrors({ currentPassword: "Error de conexión. Intenta de nuevo." })
    } finally {
      setIsLoading(false)
    }
  }

  const initials = user ? `${user.nombre[0]}${user.apellido[0]}` : "…"

  return (
    <div className="p-4 sm:p-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-foreground mb-6">Mi Perfil</h1>

      {/* Info del aliado */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row items-center gap-5">
            <Avatar className="w-20 h-20 shrink-0">
              <AvatarFallback className="bg-primary text-primary-foreground text-2xl font-bold">
                {initials}
              </AvatarFallback>
            </Avatar>
            <div className="text-center sm:text-left space-y-1">
              <h2 className="text-xl font-semibold text-foreground">
                {user ? `${user.nombre} ${user.apellido}` : "Cargando…"}
              </h2>
              <p className="text-muted-foreground text-sm">{user?.email}</p>
              <div className="inline-flex items-center gap-2 bg-primary/10 text-primary px-3 py-1 rounded-full">
                <Tag className="w-3.5 h-3.5" />
                <span className="text-sm font-semibold">@{user?.etiqueta}</span>
              </div>
              <p className="text-xs text-muted-foreground pt-1">
                Este es tu nombre de usuario. Identifica todos tus referidos en el sistema.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cambiar contraseña */}
      <Card>
        <CardHeader>
          <CardTitle>Cambiar Contraseña</CardTitle>
          <CardDescription>Actualiza tu contraseña para mantener tu cuenta segura.</CardDescription>
        </CardHeader>
        <CardContent>
          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg flex items-center gap-2 text-green-700">
              <Check className="w-4 h-4 shrink-0" />
              <span className="text-sm font-medium">Contraseña actualizada correctamente</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Contraseña actual */}
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
                <button type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  {showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.currentPassword && (
                <p className="text-destructive text-sm flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />{errors.currentPassword}
                </p>
              )}
            </div>

            {/* Nueva contraseña */}
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
                <button type="button" onClick={() => setShowNewPassword(!showNewPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  {showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.newPassword && (
                <p className="text-destructive text-sm flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />{errors.newPassword}
                </p>
              )}
            </div>

            {/* Confirmar */}
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
                <button type="button" onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors">
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.confirmPassword && (
                <p className="text-destructive text-sm flex items-center gap-1">
                  <AlertCircle className="w-3.5 h-3.5" />{errors.confirmPassword}
                </p>
              )}
            </div>

            <Button type="submit" className="w-full sm:w-auto" disabled={isLoading}>
              {isLoading ? (
                <span className="flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                  Guardando...
                </span>
              ) : "Guardar Contraseña"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
