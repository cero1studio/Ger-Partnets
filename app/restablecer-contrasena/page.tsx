"use client"

import { useState, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Eye, EyeOff, CheckCircle2, Loader2, AlertCircle } from "lucide-react"

export default function RestablecerPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}>
      <RestablecerContent />
    </Suspense>
  )
}

function RestablecerContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const token = searchParams.get("token")

  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [isSuccess, setIsSuccess] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!token) return setError("Token de recuperación no encontrado")
    if (password.length < 6) return setError("La contraseña debe tener al menos 6 caracteres")
    if (password !== confirmPassword) return setError("Las contraseñas no coinciden")
    
    setIsLoading(true)
    setError("")
    
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      })
      
      if (res.ok) {
        setIsSuccess(true)
        setTimeout(() => router.push("/"), 3000)
      } else {
        const data = await res.json()
        setError(data.error || "Ocurrió un error")
      }
    } catch {
      setError("Error de conexión")
    } finally {
      setIsLoading(false)
    }
  }

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-background">
        <Card className="max-w-md w-full border-destructive/20 shadow-xl">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4 text-destructive">
              <AlertCircle className="w-8 h-8" />
            </div>
            <CardTitle>Enlace Inválido</CardTitle>
            <CardDescription>
              Este enlace de recuperación es inválido o ha expirado. Por favor solicita uno nuevo.
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-8">
            <Link href="/olvido-contrasena">
              <Button variant="outline" className="w-full">Solicitar nuevo enlace</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50/50">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <Image src="/logo.png" alt="Global Express" width={60} height={60} className="mx-auto mb-6" />
        </div>

        <Card className="border-border/60 shadow-2xl shadow-primary/10 rounded-2xl overflow-hidden">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-bold">Nueva Contraseña</CardTitle>
            <CardDescription>
              Establece una contraseña segura para tu cuenta.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isSuccess ? (
              <div className="py-6 text-center space-y-4 animate-in fade-in zoom-in">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto shadow-inner">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
                <div className="space-y-2">
                  <p className="font-bold text-lg">Contraseña Actualizada</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Tu contraseña ha sido cambiada con éxito. Serás redirigido al login en unos segundos.
                  </p>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label>Nueva Contraseña</Label>
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Mínimo 6 caracteres"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      required
                      className="h-11 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Confirmar Contraseña</Label>
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Repite tu contraseña"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    required
                    className="h-11"
                  />
                </div>

                {error && <p className="text-destructive text-sm font-medium">{error}</p>}
                
                <Button type="submit" className="w-full h-11 font-bold" disabled={isLoading}>
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : "Cambiar Contraseña"}
                </Button>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
