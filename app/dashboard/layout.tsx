"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Kanban,
  User,
  LogOut,
  Menu,
  X,
} from "lucide-react"

const navigation = [
  { name: "Mis Referidos", href: "/dashboard", icon: Kanban },
  { name: "Mi Perfil", href: "/dashboard/perfil", icon: User },
]

// Demo users info
const demoUsers: Record<string, { nombre: string; apellido: string; etiqueta: string }> = {
  "demo@ger.com": { nombre: "Carlos", apellido: "Mendoza", etiqueta: "carlos.mendoza" },
  "nuevo@ger.com": { nombre: "Patricia", apellido: "López", etiqueta: "patricia.lopez" },
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [user, setUser] = useState({ nombre: "Usuario", apellido: "", etiqueta: "usuario" })
  const pathname = usePathname()
  const router = useRouter()

  useEffect(() => {
    const storedUser = localStorage.getItem("ger_demo_user") || "demo@ger.com"
    const userData = demoUsers[storedUser] || demoUsers["demo@ger.com"]
    setUser(userData)
  }, [])

  const handleLogout = () => {
    localStorage.removeItem("ger_demo_user")
    router.push("/")
  }
  
  const initials = `${user.nombre.charAt(0)}${user.apellido.charAt(0)}`

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <header className="h-16 bg-primary border-b border-primary/20 flex items-center justify-between px-4 sm:px-6 sticky top-0 z-50 shrink-0">
        <div className="flex items-center gap-3">
          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="lg:hidden text-primary-foreground hover:bg-primary-foreground/10"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </Button>

          <Link href="/dashboard" className="flex items-center gap-3">
            <Image 
              src="/logo.png" 
              alt="G.E.R. Logo" 
              width={36} 
              height={36}
              className="h-9 w-auto shrink-0"
            />
            <span className="text-lg font-bold text-primary-foreground hidden sm:inline">G.E.R. Partner Pipeline</span>
            <span className="text-lg font-bold text-primary-foreground sm:hidden">G.E.R.</span>
          </Link>
        </div>

        {/* Desktop Navigation */}
        <nav className="hidden lg:flex items-center gap-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                className={cn(
                  "flex items-center gap-2 px-4 py-2 rounded-lg transition-colors text-sm font-medium",
                  isActive
                    ? "bg-primary-foreground/20 text-primary-foreground"
                    : "text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10"
                )}
              >
                <item.icon className="w-4 h-4" />
                {item.name}
              </Link>
            )
          })}
        </nav>

        <div className="flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center gap-2 h-auto py-1.5 px-2 hover:bg-primary-foreground/10">
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="bg-primary-foreground text-primary text-sm">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="text-left hidden sm:block">
                  <p className="text-sm font-medium text-primary-foreground">{user.nombre} {user.apellido}</p>
                  <p className="text-xs text-primary-foreground/70">@{user.etiqueta}</p>
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <div className="px-2 py-1.5 sm:hidden">
                <p className="text-sm font-medium">{user.nombre} {user.apellido}</p>
                <p className="text-xs text-muted-foreground">@{user.etiqueta}</p>
              </div>
              <DropdownMenuSeparator className="sm:hidden" />
              <DropdownMenuItem asChild>
                <Link href="/dashboard/perfil" className="cursor-pointer">
                  <User className="w-4 h-4 mr-2" />
                  Mi Perfil
                </Link>
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={handleLogout} className="text-destructive cursor-pointer">
                <LogOut className="w-4 h-4 mr-2" />
                Cerrar Sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </header>

      {/* Mobile Navigation Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden bg-card border-b border-border px-4 py-3 space-y-1">
          {navigation.map((item) => {
            const isActive = pathname === item.href
            return (
              <Link
                key={item.name}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors",
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-muted"
                )}
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.name}</span>
              </Link>
            )
          })}
        </div>
      )}

      {/* Page Content - body scroll */}
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}
