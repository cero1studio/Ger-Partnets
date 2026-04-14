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
    // Store selected demo user
    localStorage.setItem("ger_demo_user", email)
    await new Promise((resolve) => setTimeout(resolve, 1000))
    router.push("/dashboard")
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

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left Panel - Brand */}
      <div className="hidden lg:flex lg:w-1/2 bg-primary flex-col justify-between p-8 xl:p-12">
        <div>
          <Image 
            src="/logo-full.png" 
            alt="Global Express Recruiting" 
            width={280} 
            height={60}
            className="h-14 w-auto"
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

      {/* Right Panel - Login Form */}
      <div className="flex-1 flex items-center justify-center p-6 sm:p-8 bg-background min-h-screen lg:min-h-0">
        <div className="w-full max-w-md">
          {/* Mobile Logo */}
          <div className="lg:hidden flex items-center mb-8 justify-center">
            <Image 
              src="/logo-full.png" 
              alt="Global Express Recruiting" 
              width={220} 
              height={50}
              className="h-12 w-auto bg-primary rounded-lg p-2"
            />
          </div>

          <Card className="border-0 shadow-xl">
            <CardHeader className="space-y-1 pb-6">
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
                    className={errors.email ? "border-destructive" : ""}
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
                      className={errors.password ? "border-destructive pr-10" : "pr-10"}
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
                  <button
                    type="button"
                    className="text-sm text-primary hover:underline"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                </div>

                <Button
                  type="submit"
                  className="w-full h-11"
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

              <div className="mt-6 pt-6 border-t space-y-4">
                <div className="bg-muted/50 rounded-lg p-3 text-xs text-muted-foreground space-y-1">
                  <p className="font-medium text-foreground text-sm mb-2">Usuarios Demo:</p>
                  <p><span className="font-mono bg-muted px-1 rounded">demo@ger.com</span> - Con leads de ejemplo</p>
                  <p><span className="font-mono bg-muted px-1 rounded">nuevo@ger.com</span> - Sin leads (vacío)</p>
                  <p className="text-xs mt-1">Contraseña: cualquiera (6+ caracteres)</p>
                </div>
                <p className="text-sm text-muted-foreground text-center">
                  ¿No tienes cuenta?{" "}
                  <Link href="/registro" className="text-primary hover:underline font-medium">
                    Regístrate aquí
                  </Link>
                </p>
              </div>
            </CardContent>
          </Card>

          <p className="text-center text-xs text-muted-foreground mt-6">
            Al iniciar sesión, aceptas nuestros términos de servicio y política de privacidad.
          </p>
        </div>
      </div>
    </div>
  )
}
