"use client"

import { useState, useEffect, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { 
  Eye, EyeOff, Plus, Lock, Unlock, KeyRound, Users, UserCheck, 
  UserX, Tag, Search, Mail, Send, Check, Loader2, Info
} from "lucide-react"
import Image from "next/image"

type Aliado = {
  _id: string
  nombre: string
  apellido: string
  email: string
  etiqueta: string
  activo: boolean
  createdAt: string
  leadCount?: number
}

export default function AdminPage() {
  const [aliados, setAliados] = useState<Aliado[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  // Modal invitar
  const [showInvite, setShowInvite] = useState(false)
  const [inviting, setInviting] = useState(false)
  const [inviteForm, setInviteForm] = useState({ nombre: "", email: "" })
  const [inviteSent, setInviteSent] = useState(false)

  // Modal crear directo
  const [showCreate, setShowCreate] = useState(false)
  const [creating, setCreating] = useState(false)
  const [createForm, setCreateForm] = useState({ nombre: "", apellido: "", email: "", password: "" })
  const [createError, setCreateError] = useState("")
  const [showCreatePwd, setShowCreatePwd] = useState(false)

  // Modal cambiar contraseña
  const [pwdTarget, setPwdTarget] = useState<Aliado | null>(null)
  const [newPwd, setNewPwd] = useState("")
  const [showNewPwd, setShowNewPwd] = useState(false)
  const [savingPwd, setSavingPwd] = useState(false)
  const [pwdError, setPwdError] = useState("")

  // Alert bloquear/desbloquear
  const [toggleTarget, setToggleTarget] = useState<Aliado | null>(null)
  const [toggling, setToggling] = useState(false)

  const fetchAliados = useCallback(async () => {
    setLoading(true)
    const res = await fetch("/api/admin/aliados")
    if (res.ok) {
      const data = await res.json()
      setAliados(data.aliados)
    }
    setLoading(false)
  }, [])

  useEffect(() => { fetchAliados() }, [fetchAliados])

  // ── Enviar invitación ──────────────────────────────────────
  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inviteForm.nombre || !inviteForm.email) return
    setInviting(true)
    try {
      const res = await fetch("/api/admin/invite", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(inviteForm),
      })
      if (res.ok) {
        setInviteSent(true)
        setTimeout(() => {
          setShowInvite(false)
          setInviteSent(false)
          setInviteForm({ nombre: "", email: "" })
        }, 2000)
      }
    } catch (error) {
      console.error(error)
    } finally {
      setInviting(false)
    }
  }

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setCreateError("")
    if (!createForm.nombre || !createForm.apellido || !createForm.email || !createForm.password) {
      setCreateError("Todos los campos son requeridos")
      return
    }
    setCreating(true)
    try {
      const res = await fetch("/api/admin/aliados", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createForm),
      })
      const data = await res.json()
      if (!res.ok) { setCreateError(data.error ?? "Error al crear"); return }
      setShowCreate(false)
      setCreateForm({ nombre: "", apellido: "", email: "", password: "" })
      fetchAliados()
    } catch { setCreateError("Error de conexión") }
    finally { setCreating(false) }
  }

  const handlePwdSave = async () => {
    setPwdError("")
    if (!newPwd || newPwd.length < 6) { setPwdError("Mínimo 6 caracteres"); return }
    setSavingPwd(true)
    try {
      const res = await fetch(`/api/admin/aliados/${pwdTarget!._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newPassword: newPwd }),
      })
      const data = await res.json()
      if (!res.ok) { setPwdError(data.error ?? "Error"); return }
      setPwdTarget(null)
      setNewPwd("")
    } catch { setPwdError("Error de conexión") }
    finally { setSavingPwd(false) }
  }

  const handleToggle = async () => {
    if (!toggleTarget) return
    setToggling(true)
    try {
      const res = await fetch(`/api/admin/aliados/${toggleTarget._id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activo: !toggleTarget.activo }),
      })
      if (res.ok) {
        setAliados(prev =>
          prev.map(a => a._id === toggleTarget._id ? { ...a, activo: !a.activo } : a)
        )
      }
    } finally {
      setToggling(false)
      setToggleTarget(null)
    }
  }

  const filtered = aliados.filter(a => {
    const q = search.toLowerCase()
    return (
      a.nombre.toLowerCase().includes(q) ||
      a.apellido.toLowerCase().includes(q) ||
      a.email.toLowerCase().includes(q) ||
      a.etiqueta.toLowerCase().includes(q)
    )
  })

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground tracking-tight">Gestión de Aliados</h1>
          <p className="text-muted-foreground text-sm mt-1">Administra e invita a nuevos socios estratégicos</p>
        </div>
        <div className="flex items-center gap-2">
          <Button onClick={() => setShowInvite(true)} variant="default" className="shadow-lg shadow-primary/20 bg-primary hover:bg-primary/90 font-bold">
            <Mail className="w-4 h-4 mr-2" />
            Invitar Aliado
          </Button>
          <Button onClick={() => setShowCreate(true)} variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            Crear Directo
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0 text-primary">
              <Users className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold leading-none">{aliados.length}</p>
              <p className="text-[10px] uppercase font-bold text-muted-foreground mt-1 tracking-wider">Total</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/50">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-green-50 rounded-lg flex items-center justify-center shrink-0 text-green-600">
              <UserCheck className="w-5 h-5" />
            </div>
            <div>
              <p className="text-2xl font-bold leading-none text-green-600">{aliados.filter(a => a.activo).length}</p>
              <p className="text-[10px] uppercase font-bold text-muted-foreground mt-1 tracking-wider">Activos</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabla */}
      <Card className="border-border/50 overflow-hidden">
        <CardHeader className="bg-muted/30 pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Buscar por nombre, email o etiqueta..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 bg-background"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-20 text-muted-foreground">
              <Loader2 className="w-6 h-6 animate-spin mr-3 opacity-20" />
              <span className="text-sm font-medium">Cargando aliados...</span>
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20">
              <Users className="w-12 h-12 mx-auto mb-4 opacity-10 text-primary" />
              <p className="text-muted-foreground font-medium">No se encontraron aliados</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-muted/30 text-muted-foreground font-medium border-b border-border/50">
                  <tr>
                    <th className="px-6 py-3 text-left">Aliado</th>
                    <th className="px-6 py-3 text-left hidden sm:table-cell">Etiqueta</th>
                    <th className="px-6 py-3 text-center">Leads</th>
                    <th className="px-6 py-3 text-left">Estado</th>
                    <th className="px-6 py-3 text-right">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {filtered.map(aliado => (
                    <tr key={aliado._id} className="hover:bg-muted/20 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-9 h-9 border border-border">
                            <AvatarFallback className="bg-primary/5 text-primary text-xs font-bold uppercase">
                              {aliado.nombre[0]}{aliado.apellido[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <p className="font-bold text-foreground truncate">{aliado.nombre} {aliado.apellido}</p>
                            <p className="text-[11px] text-muted-foreground truncate">{aliado.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 hidden sm:table-cell">
                        <Badge variant="outline" className="bg-primary/5 text-primary border-primary/20 font-bold text-[10px]">
                          @{aliado.etiqueta}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-center font-bold text-primary">
                        {aliado.leadCount || 0}
                      </td>
                      <td className="px-6 py-4">
                        <Badge
                          className={aliado.activo
                            ? "bg-green-100 text-green-700 hover:bg-green-100 border-green-200"
                            : "bg-red-100 text-red-600 hover:bg-red-100 border-red-200"
                          }
                        >
                          {aliado.activo ? "Activo" : "Bloqueado"}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setPwdTarget(aliado)} title="Password">
                            <KeyRound className="w-4 h-4 text-muted-foreground" />
                          </Button>
                          <Button 
                            size="icon" 
                            variant="ghost" 
                            className={`h-8 w-8 ${aliado.activo ? 'text-red-400 hover:text-red-600' : 'text-green-400 hover:text-green-600'}`} 
                            onClick={() => setToggleTarget(aliado)}
                          >
                            {aliado.activo ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Modal: Invitar Aliado ──────────────────────────── */}
      <Dialog open={showInvite} onOpenChange={setShowInvite}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Invitar Nuevo Aliado</DialogTitle>
            <DialogDescription>
              Envía una invitación personalizada. El aliado recibirá un link único para registrarse.
            </DialogDescription>
          </DialogHeader>
          
          {inviteSent ? (
            <div className="py-8 text-center space-y-4 animate-in fade-in zoom-in">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <div>
                <p className="font-bold text-lg">¡Invitación Enviada!</p>
                <p className="text-sm text-muted-foreground">Se ha enviado el correo a <span className="font-semibold">{inviteForm.email}</span></p>
              </div>
            </div>
          ) : (
            <form onSubmit={handleInvite} className="space-y-5 pt-4">
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Nombre del Aliado</Label>
                <Input 
                  placeholder="Ej: Pedro Perez" 
                  value={inviteForm.nombre}
                  onChange={e => setInviteForm({ ...inviteForm, nombre: e.target.value })}
                  required
                  className="h-11"
                />
              </div>
              <div className="space-y-2">
                <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Correo Electrónico</Label>
                <Input 
                  type="email" 
                  placeholder="correo@ejemplo.com" 
                  value={inviteForm.email}
                  onChange={e => setInviteForm({ ...inviteForm, email: e.target.value })}
                  required
                  className="h-11"
                />
              </div>

              {/* Preview */}
              <div className="mt-6 p-4 rounded-2xl border border-muted bg-muted/10 space-y-3">
                <div className="flex items-center gap-2 text-[10px] font-black text-muted-foreground uppercase tracking-[0.2em]">
                  <Eye className="w-3 h-3" /> Preview del Correo
                </div>
                <div className="bg-white border rounded-xl p-5 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <Image src="/logo.png" alt="GER" width={32} height={32} className="h-6 w-auto" />
                    <div className="px-2 py-0.5 rounded bg-primary/10 text-[9px] font-bold text-primary uppercase">Invitación</div>
                  </div>
                  <p className="text-sm font-bold">¡Hola, {inviteForm.nombre || "..." }! 👋</p>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Has sido invitado a unirte a la familia Global Express. En esta plataforma generarás ingresos ayudando a otros a cumplir su sueño en USA...
                  </p>
                  <div className="h-8 w-full bg-primary rounded-lg flex items-center justify-center text-[10px] font-bold text-white shadow-lg shadow-primary/20">
                    ACEPTAR INVITACIÓN
                  </div>
                </div>
              </div>

              <DialogFooter className="pt-4 gap-2">
                <Button type="button" variant="ghost" onClick={() => setShowInvite(false)}>Cancelar</Button>
                <Button type="submit" disabled={inviting} className="gap-2 h-11 px-8 font-bold">
                  {inviting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Enviar Invitación
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* ── Modal: Crear Aliado Directo ────────────────────── */}
      <Dialog open={showCreate} onOpenChange={open => { setShowCreate(open); setCreateError("") }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nuevo Aliado (Registro Directo)</DialogTitle>
            <DialogDescription>Usa esta opción solo si no deseas enviar invitación por correo.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Nombre</Label>
                <Input placeholder="Juan" value={createForm.nombre}
                  onChange={e => setCreateForm({ ...createForm, nombre: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Apellido</Label>
                <Input placeholder="Pérez" value={createForm.apellido}
                  onChange={e => setCreateForm({ ...createForm, apellido: e.target.value })} />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Correo Electrónico</Label>
              <Input type="email" placeholder="aliado@empresa.com" value={createForm.email}
                onChange={e => setCreateForm({ ...createForm, email: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Contraseña inicial</Label>
              <div className="relative">
                <Input
                  type={showCreatePwd ? "text" : "password"}
                  placeholder="Mínimo 6 caracteres"
                  value={createForm.password}
                  onChange={e => setCreateForm({ ...createForm, password: e.target.value })}
                  className="pr-10"
                />
                <button type="button" onClick={() => setShowCreatePwd(!showCreatePwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showCreatePwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {createError && <p className="text-destructive text-sm font-medium">{createError}</p>}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>Cancelar</Button>
              <Button type="submit" disabled={creating}>
                {creating ? "Creando..." : "Crear Aliado"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Modal: Cambiar Contraseña ──────────────────────── */}
      <Dialog open={!!pwdTarget} onOpenChange={open => { if (!open) { setPwdTarget(null); setNewPwd("") } }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Cambiar Contraseña</DialogTitle>
            <DialogDescription>
              Establece una nueva contraseña para <span className="font-semibold">{pwdTarget?.nombre}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nueva contraseña</Label>
              <div className="relative">
                <Input
                  type={showNewPwd ? "text" : "password"}
                  value={newPwd}
                  onChange={e => setNewPwd(e.target.value)}
                  className="pr-10"
                />
                <button type="button" onClick={() => setShowNewPwd(!showNewPwd)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                  {showNewPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            {pwdError && <p className="text-destructive text-sm font-medium">{pwdError}</p>}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPwdTarget(null)}>Cancelar</Button>
            <Button onClick={handlePwdSave} disabled={savingPwd}>
              {savingPwd ? "Guardando..." : "Guardar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ── Alert: Bloquear/Desbloquear ───────────────────── */}
      <AlertDialog open={!!toggleTarget} onOpenChange={open => { if (!open) setToggleTarget(null) }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {toggleTarget?.activo ? "¿Bloquear aliado?" : "¿Activar aliado?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {toggleTarget?.activo
                ? `El aliado ${toggleTarget?.nombre} ya no podrá acceder al portal.`
                : `El aliado ${toggleTarget?.nombre} recuperará el acceso al portal.`
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleToggle}
              disabled={toggling}
              className={toggleTarget?.activo ? "bg-destructive hover:bg-destructive/90" : ""}
            >
              {toggling ? "Procesando..." : toggleTarget?.activo ? "Bloquear" : "Activar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
