"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { LogOut, Shield } from "lucide-react"

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const [admin, setAdmin] = useState<{ nombre: string; apellido: string; email: string } | null>(null)

  useEffect(() => {
    fetch("/api/auth/me")
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        if (!data?.user || data.user.role !== "admin") {
          router.replace("/")
          return
        }
        setAdmin(data.user)
      })
      .catch(() => router.replace("/"))
  }, [router])

  const handleLogout = async () => {
    await fetch("/api/auth/logout", { method: "POST" })
    router.push("/")
  }

  const initials = admin ? `${admin.nombre[0]}${admin.apellido[0]}` : "A"

  return (
    <div className="min-h-screen bg-muted/30">
      {/* Header admin */}
      <header className="bg-background border-b sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/admin" className="flex items-center gap-2.5">
              <Image src="/logo.png" alt="Global Express" width={32} height={32} className="h-8 w-auto" />
              <div className="hidden sm:block">
                <p className="text-sm font-semibold text-foreground leading-none">Panel de Administración</p>
                <p className="text-xs text-muted-foreground">Global Express</p>
              </div>
            </Link>
            <div className="h-5 w-px bg-border mx-1 hidden sm:block" />
            <div className="hidden sm:flex items-center gap-1.5 bg-primary/10 text-primary px-2.5 py-1 rounded-full text-xs font-medium">
              <Shield className="w-3 h-3" />
              Admin
            </div>
          </div>

          <div className="flex items-center gap-3">
            {admin && (
              <div className="flex items-center gap-2">
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="bg-primary text-primary-foreground text-sm font-bold">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium hidden sm:block">{admin.nombre} {admin.apellido}</span>
              </div>
            )}
            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-muted-foreground hover:text-destructive">
              <LogOut className="w-4 h-4 sm:mr-1.5" />
              <span className="hidden sm:inline">Cerrar Sesión</span>
            </Button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {children}
      </main>
    </div>
  )
}
