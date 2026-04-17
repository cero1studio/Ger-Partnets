"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, Globe, Users, BarChart3, Eye, EyeOff } from "lucide-react"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})
  const [showMobileLogin, setShowMobileLogin] = useState(false)

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {}
    
    if (!email) {
      newErrors.email = "El correo electrónico es requerido"
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Ingresa un correo electrónico válido"
    }
    
    if (!password) {
      newErrors.password = "La contraseña es requerida"
    } else if (password.length < 6) {
      newErrors.password = "La contraseña debe tener al menos 6 caracteres"
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    setIsLoading(true)
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })
      const data = await res.json()
      if (!res.ok) {
        setErrors({ email: data.error ?? "Credenciales incorrectas" })
        return
      }
      router.push(data.role === "admin" ? "/admin" : "/dashboard")
    } catch {
      setErrors({ email: "Error de conexión. Intenta de nuevo." })
    } finally {
      setIsLoading(false)
    }
  }

  const features = [
    {
      icon: Users,
      text: "Registra tus referidos en segundos.",
    },
    {
      icon: BarChart3,
      text: "Trazabilidad completa: Revisa el estatus comercial en tiempo real.",
    },
    {
      icon: Globe,
      text: "Seguimiento EB-3: Control total sobre los aplicantes al programa.",
    },
  ]

  const mobileHighlights = [
    "Referidos en segundos",
    "Estatus comercial en tiempo real",
    "Control completo de aplicantes EB-3",
  ]

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-slate-50/50">
      {/* Left Panel - Brand */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary flex-col justify-between p-8 xl:p-12">
        <div className="flex items-center gap-3">
          <Image 
            src="/logo.png" 
            alt="Global Express" 
            width={48} 
            height={48}
            className="h-12 w-auto"
          />
        </div>
        
        <div className="space-y-8">
          <div>
            <h1 className="text-3xl xl:text-4xl font-bold text-primary-foreground leading-tight text-balance">
              Portal de Aliados Estratégicos
            </h1>
            <p className="text-primary-foreground/80 mt-4 text-lg">
              Gestiona tus referidos y accede a herramientas exclusivas para el programa de reclutamiento internacional.
            </p>
          </div>
          
          <div className="space-y-5">
            {features.map((feature, index) => (
              <div key={index} className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-primary-foreground/10 flex items-center justify-center shrink-0">
                  <feature.icon className="w-5 h-5 text-primary-foreground" />
                </div>
                <p className="text-primary-foreground/90 text-sm leading-relaxed pt-2">
                  {feature.text}
                </p>
              </div>
            ))}
          </div>
        </div>
        
        <div className="flex items-center gap-2 text-primary-foreground/60 text-sm">
          <CheckCircle className="w-4 h-4" />
          <span>Plataforma segura y certificada</span>
        </div>
      </div>

      {/* Mobile Fullscreen Hero */}
      <div
        className={`lg:hidden bg-primary min-h-screen px-5 py-8 flex items-center ${
          showMobileLogin ? "hidden" : "flex"
        }`}
      >
        <div className="mx-auto w-full max-w-md space-y-6">
          <div className="flex items-center gap-2.5">
            <Image
              src="/logo.png"
              alt="Global Express"
              width={40}
              height={40}
              className="h-10 w-auto"
            />
            <span className="text-primary-foreground/95 font-semibold tracking-wide">
              Global Express
            </span>
          </div>

          <div className="space-y-2.5">
            <h1 className="text-[1.7rem] leading-tight font-bold text-primary-foreground text-balance">
              Portal de Aliados Estratégicos
            </h1>
            <p className="text-sm leading-relaxed text-primary-foreground/85">
              Gestiona tus referidos y accede a herramientas exclusivas desde cualquier dispositivo.
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {mobileHighlights.map((highlight) => (
              <span
                key={highlight}
                className="inline-flex items-center rounded-full border border-primary-foreground/25 bg-primary-foreground/10 px-3 py-1.5 text-xs text-primary-foreground/95"
              >
                {highlight}
              </span>
            ))}
          </div>

          <Button
            variant="secondary"
            className="h-11 w-full bg-primary-foreground text-primary hover:bg-primary-foreground/90 font-semibold"
            onClick={() => setShowMobileLogin(true)}
          >
            Iniciar sesión
          </Button>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div
        className={`flex-1 items-start lg:items-center justify-center px-4 py-6 sm:px-6 lg:p-8 bg-background min-h-screen lg:min-h-0 ${
          showMobileLogin ? "flex" : "hidden"
        } lg:flex`}
      >
        <div className="w-full max-w-md">
          {showMobileLogin && (
            <div className="mb-4 rounded-xl bg-primary px-4 py-4 lg:hidden">
              <Image
                src="/logo.png"
                alt="Global Express"
                width={44}
                height={44}
                className="mx-auto h-11 w-auto"
              />
            </div>
          )}

          {showMobileLogin && (
            <Button
              type="button"
              variant="ghost"
              className="mb-3 px-1 text-sm lg:hidden"
              onClick={() => setShowMobileLogin(false)}
            >
              Volver
            </Button>
          )}

          <Card
            id="login-form"
            className="border border-border/60 shadow-2xl shadow-primary/10 rounded-2xl scroll-mt-6"
          >
            <CardHeader className="space-y-1 pb-6 pt-7">
              <CardTitle className="text-2xl font-bold text-center">Iniciar Sesión</CardTitle>
              <CardDescription className="text-center">
                Ingresa tus credenciales para acceder al portal
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="email">Correo Electrónico</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="tu@empresa.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={errors.email ? "h-11 border-destructive" : "h-11"}
                  />
                  {errors.email && (
                    <p className="text-destructive text-sm">{errors.email}</p>
                  )}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña</Label>
                  <div className="relative">
                    <Input
                      id="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="********"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className={errors.password ? "h-11 border-destructive pr-10" : "h-11 pr-10"}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4 h-4" />
                      ) : (
                        <Eye className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-destructive text-sm">{errors.password}</p>
                  )}
                </div>

                <div className="flex items-center justify-end">
                  <p className="text-xs text-muted-foreground">
                    ¿Olvidaste tu contraseña? Contacta al administrador para restablecerla.
                  </p>
                </div>

                <Button
                  type="submit"
                  className="w-full h-11 font-semibold"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                      Ingresando...
                    </span>
                  ) : (
                    "Ingresar al Portal"
                  )}
                </Button>
              </form>

              <div className="mt-6 pt-6 border-t">
                <p className="text-sm text-muted-foreground text-center">
                  ¿No tienes cuenta?{" "}
                  <Link href="/registro" className="text-primary hover:underline font-medium">
                    Regístrate aquí
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>

          <p className="mx-auto mt-5 max-w-sm text-center text-xs text-muted-foreground">
            Al iniciar sesión, aceptas nuestros términos de servicio y política de privacidad.
          </p>
        </div>
      </div>
    </div>
  )
}
