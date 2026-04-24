"use client"

import { useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { ChevronLeft, Mail, CheckCircle2, Loader2 } from "lucide-react"

export default function OlvidoPasswordPage() {
  const [email, setEmail] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [isSent, setIsSent] = useState(false)
  const [error, setError] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email) return
    
    setIsLoading(true)
    setError("")
    
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      })
      
      if (res.ok) {
        setIsSent(true)
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

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-slate-50/50">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <Image src="/logo.png" alt="Global Express" width={60} height={60} className="mx-auto mb-6" />
        </div>

        <Card className="border-border/60 shadow-2xl shadow-primary/10 rounded-2xl">
          <CardHeader className="space-y-1 text-center">
            <CardTitle className="text-2xl font-bold">¿Olvidaste tu contraseña?</CardTitle>
            <CardDescription>
              No te preocupes, ingresa tu correo y te enviaremos instrucciones para restablecerla.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {isSent ? (
              <div className="py-6 text-center space-y-4 animate-in fade-in zoom-in">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-8 h-8 text-green-600" />
                </div>
                <div className="space-y-2">
                  <p className="font-bold text-lg">Correo enviado</p>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Hemos enviado un enlace de recuperación a <strong>{email}</strong>. Revisa tu bandeja de entrada (y la carpeta de spam).
                  </p>
                </div>
                <Link href="/" className="block pt-4">
                  <Button variant="outline" className="w-full">Volver al inicio</Button>
                </Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Input
                    type="email"
                    placeholder="tu@correo.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="h-11"
                  />
                  {error && <p className="text-destructive text-sm font-medium">{error}</p>}
                </div>
                
                <Button type="submit" className="w-full h-11 font-bold" disabled={isLoading}>
                  {isLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Mail className="w-4 h-4 mr-2" />}
                  Enviar instrucciones
                </Button>

                <div className="pt-2 text-center">
                  <Link href="/" className="text-sm text-primary hover:underline inline-flex items-center gap-2 font-medium">
                    <ChevronLeft className="w-4 h-4" />
                    Volver al login
                  </Link>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
