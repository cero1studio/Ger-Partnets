"use client"

import { useState, useMemo, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle, Globe, Users, BarChart3, Eye, EyeOff, Tag, PartyPopper, UserX } from "lucide-react"

export default function RegistroPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center bg-background"><span className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" /></div>}>
      <RegistroContent />
    </Suspense>
  )
}

function RegistroContent() {
  const router = useRouter()
  const [firstName, setFirstName] = useState("")
  const [lastName, setLastName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [password, setPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const searchParams = useSearchParams()
  const [isValidating, setIsValidating] = useState(true)
  const [inviteError, setInviteError] = useState("")
  const [createdUser, setCreatedUser] = useState<{ nombre: string; etiqueta: string } | null>(null)

  // Validar invitación al cargar
  useEffect(() => {
    const token = searchParams.get("token")
    const emailParam = searchParams.get("email")
    const nombreParam = searchParams.get("nombre")

    if (!token) {
      setInviteError("Este portal requiere una invitación válida para registrarse.")
      setIsValidating(false)
      return
    }

    if (emailParam) setEmail(emailParam)
    if (nombreParam) setFirstName(nombreParam)
    setIsValidating(false)
  }, [searchParams])

  // Generate username tag from first name and last name
  const generatedTag = useMemo(() => {
    if (firstName && lastName) {
      const cleanFirst = firstName.toLowerCase().trim().replace(/\s+/g, '')
      const cleanLast = lastName.toLowerCase().trim().replace(/\s+/g, '')
      return `${cleanFirst}.${cleanLast}`
    }
    if (email && email.includes('@')) {
      return email.split('@')[0].toLowerCase()
    }
    return ''
  }, [firstName, lastName, email])

  const validateForm = () => {
    const newErrors: Record<string, string> = {}
    
    if (!firstName.trim()) {
      newErrors.firstName = "El nombre es requerido"
    }
    
    if (!lastName.trim()) {
      newErrors.lastName = "El apellido es requerido"
    }
    
    if (!email) {
      newErrors.email = "El correo electrónico es requerido"
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Ingresa un correo electrónico válido"
    }

    if (!phone.trim()) {
      newErrors.phone = "El teléfono es requerido"
    }
    
    if (!password) {
      newErrors.password = "La contraseña es requerida"
    } else if (password.length < 6) {
      newErrors.password = "La contraseña debe tener al menos 6 caracteres"
    }
    
    if (!confirmPassword) {
      newErrors.confirmPassword = "Confirma tu contraseña"
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Las contraseñas no coinciden"
    }
    
    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!validateForm()) return

    setIsLoading(true)
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          nombre: firstName, 
          apellido: lastName, 
          email, 
          telefono: phone, 
          password,
          token: searchParams.get("token")
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        setErrors({ email: data.error ?? "Error al registrarse" })
        return
      }
      // Mostrar pantalla de bienvenida con el username antes de entrar
      setCreatedUser({ nombre: data.user.nombre, etiqueta: data.user.etiqueta })
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

  // ── Pantalla de bienvenida post-registro ────────────────
  if (createdUser) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-background relative overflow-hidden">
        {/* Decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-primary/5 rounded-full translate-y-1/2 -translate-x-1/2 blur-3xl" />

        <div className="w-full max-w-xl text-center space-y-8 relative">
          <div className="space-y-4">
            <Image 
              src="/logo.png" 
              alt="Global Express" 
              width={100} 
              height={100}
              className="mx-auto h-20 w-auto animate-in fade-in zoom-in duration-700"
            />
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider animate-in slide-in-from-top duration-500 delay-150">
              <PartyPopper className="w-3 h-3" />
              Registro Exitoso
            </div>
          </div>

          <div className="space-y-3">
            <h1 className="text-3xl sm:text-4xl font-extrabold text-foreground tracking-tight">
              ¡Bienvenido a la familia <span className="text-primary">Global Express</span>, {createdUser.nombre}!
            </h1>
            <p className="text-lg text-muted-foreground max-w-lg mx-auto leading-relaxed">
              Ahora eres parte de una de las empresas líderes en reclutamiento internacional. Prepárate para transformar vidas.
            </p>
          </div>

          <Card className="border-primary/20 bg-card/50 backdrop-blur-sm shadow-2xl overflow-hidden">
            <CardContent className="p-8 space-y-6">
              <div className="grid sm:grid-cols-2 gap-6 text-left">
                <div className="space-y-2">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Users className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-bold text-foreground">Genera Ingresos</h3>
                  <p className="text-sm text-muted-foreground">Registra a tus referidos y monitorea su progreso comercial en tiempo real.</p>
                </div>
                <div className="space-y-2">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Globe className="w-5 h-5 text-primary" />
                  </div>
                  <h3 className="font-bold text-foreground">Cumple Sueños</h3>
                  <p className="text-sm text-muted-foreground">Ayuda a cientos de personas a cumplir su proyecto de vida en los Estados Unidos.</p>
                </div>
              </div>

              <div className="pt-6 border-t border-border">
                <p className="text-sm text-muted-foreground mb-3 font-medium uppercase tracking-widest">Tu Identificador de Aliado</p>
                <div className="flex items-center justify-center gap-3 bg-primary/5 rounded-2xl py-4 border border-primary/10 group transition-all hover:border-primary/30">
                  <Tag className="w-6 h-6 text-primary animate-pulse" />
                  <span className="text-3xl font-black text-primary tracking-tighter">@{createdUser.etiqueta}</span>
                </div>
                <p className="text-xs text-muted-foreground mt-4 italic">
                  * Este es el código que identificará a todos tus referidos dentro de nuestro CRM.
                </p>
              </div>
            </CardContent>
          </Card>

          <div className="pt-4">
            <Button size="lg" className="w-full sm:w-64 h-12 text-lg font-bold shadow-lg shadow-primary/20" onClick={() => router.push("/dashboard")}>
              Ir a mi Dashboard
            </Button>
            <p className="text-sm text-muted-foreground mt-6">
              ¿Tienes dudas? Contacta a tu asesor asignado desde el panel principal.
            </p>
          </div>
        </div>
      </div>
    )
  }

  if (isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <span className="w-8 h-8 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
      </div>
    )
  }

  if (inviteError) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-background">
        <Card className="max-w-md w-full border-destructive/20 shadow-xl">
          <CardHeader className="text-center">
            <div className="w-16 h-16 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-4">
              <UserX className="w-8 h-8 text-destructive" />
            </div>
            <CardTitle className="text-destructive">Acceso Restringido</CardTitle>
            <CardDescription>{inviteError}</CardDescription>
          </CardHeader>
          <CardContent className="text-center pb-8">
            <Link href="/">
              <Button variant="outline" className="w-full">Volver al Inicio</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
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
              Únete como Aliado Estratégico
            </h1>
            <p className="text-primary-foreground/80 mt-4 text-lg">
              Crea tu cuenta y comienza a referir candidatos al programa de reclutamiento internacional.
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

      {/* Right Panel - Registration Form */}
      <div className="flex-1 flex items-start lg:items-center justify-center px-4 pt-0 pb-4 sm:px-6 lg:p-8 bg-background min-h-screen lg:min-h-0">
        <div className="w-full max-w-md">
          {/* Mobile Header */}
          <div className="-mx-4 mb-3 bg-primary px-4 py-3 lg:hidden sm:mx-0 sm:rounded-xl">
            <Image 
              src="/logo.png" 
              alt="Global Express" 
              width={44} 
              height={44}
              className="mx-auto h-11 w-auto"
            />
          </div>

          <Card className="border-0 shadow-xl">
            <CardHeader className="space-y-1 pb-4">
              <CardTitle className="text-2xl font-bold text-center">Crear Cuenta</CardTitle>
              <CardDescription className="text-center">
                Completa tus datos para registrarte como aliado
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="firstName">Nombre</Label>
                    <Input
                      id="firstName"
                      type="text"
                      placeholder="Juan"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className={errors.firstName ? "border-destructive" : ""}
                    />
                    {errors.firstName && (
                      <p className="text-destructive text-xs">{errors.firstName}</p>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="lastName">Apellido</Label>
                    <Input
                      id="lastName"
                      type="text"
                      placeholder="Pérez"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className={errors.lastName ? "border-destructive" : ""}
                    />
                    {errors.lastName && (
                      <p className="text-destructive text-xs">{errors.lastName}</p>
                    )}
                  </div>
                </div>

                {/* Tag preview */}
                {generatedTag && (
                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 flex items-center gap-3">
                    <Tag className="w-4 h-4 text-primary shrink-0" />
                    <div>
                      <p className="text-xs text-muted-foreground">Tu nombre de usuario será:</p>
                      <p className="text-sm font-semibold text-primary">@{generatedTag}</p>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  <Label htmlFor="email">Correo Electrónico</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="tu@empresa.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className={errors.email ? "border-destructive" : ""}
                  />
                  {errors.email && (
                    <p className="text-destructive text-xs">{errors.email}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">WhatsApp / Teléfono</Label>
                  <Input
                    id="phone"
                    type="tel"
                    placeholder="+57 300 123 4567"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className={errors.phone ? "border-destructive" : ""}
                  />
                  {errors.phone && (
                    <p className="text-destructive text-xs">{errors.phone}</p>
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
                      className={errors.password ? "border-destructive pr-10" : "pr-10"}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                    >
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="text-destructive text-xs">{errors.password}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmar Contraseña</Label>
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
                    <p className="text-destructive text-xs">{errors.confirmPassword}</p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full h-11"
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <span className="flex items-center gap-2">
                      <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                      Creando cuenta...
                    </span>
                  ) : (
                    "Crear Cuenta"
                  )}
                </Button>
              </form>

              <div className="mt-6 pt-6 border-t text-center">
                <p className="text-sm text-muted-foreground">
                  ¿Ya tienes cuenta?{" "}
                  <Link href="/" className="text-primary hover:underline font-medium">
                    Inicia sesión
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>

          <p className="text-center text-xs text-muted-foreground mt-6">
            Al registrarte, aceptas nuestros <Link href="/terminos" className="text-primary hover:underline">términos de servicio</Link> y política de privacidad.
          </p>
        </div>
      </div>
    </div>
  )
}
