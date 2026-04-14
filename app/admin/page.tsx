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
import { Eye, EyeOff, Plus, Lock, Unlock, KeyRound, Users, UserCheck, UserX, Tag, Search } from "lucide-react"

type Aliado = {
  _id: string
  nombre: string
  apellido: string
  email: string
  etiqueta: string
  activo: boolean
  createdAt: string
}

export default function AdminPage() {
  const [aliados, setAliados] = useState<Aliado[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  // Modal crear
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

  // ── Filtro local ───────────────────────────────────────────
  const filtered = aliados.filter(a => {
    const q = search.toLowerCase()
    return (
      a.nombre.toLowerCase().includes(q) ||
      a.apellido.toLowerCase().includes(q) ||
      a.email.toLowerCase().includes(q) ||
      a.etiqueta.toLowerCase().includes(q)
    )
  })

  const stats = {
    total: aliados.length,
    activos: aliados.filter(a => a.activo).length,
    bloqueados: aliados.filter(a => !a.activo).length,
  }

  // ── Crear aliado ───────────────────────────────────────────
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

  // ── Cambiar contraseña ─────────────────────────────────────
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

  // ── Bloquear/Desbloquear ───────────────────────────────────
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

  return (
    <div className="space-y-6">
      {/* Encabezado */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Gestión de Aliados</h1>
          <p className="text-muted-foreground text-sm mt-1">Administra los referidores registrados en la plataforma</p>
        </div>
        <Button onClick={() => setShowCreate(true)} className="w-full sm:w-auto">
          <Plus className="w-4 h-4 mr-2" />
          Nuevo Aliado
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center shrink-0">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <div>
              <p className="text-2xl font-bold">{stats.total}</p>
              <p className="text-xs text-muted-foreground">Total aliados</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center shrink-0">
              <UserCheck className="w-5 h-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-600">{stats.activos}</p>
              <p className="text-xs text-muted-foreground">Activos</p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center shrink-0">
              <UserX className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <p className="text-2xl font-bold text-red-500">{stats.bloqueados}</p>
              <p className="text-xs text-muted-foreground">Bloqueados</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabla */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por nombre, email o @usuario..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-muted-foreground text-sm">
              <span className="w-5 h-5 border-2 border-primary/30 border-t-primary rounded-full animate-spin mr-2" />
              Cargando...
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              <Users className="w-10 h-10 mx-auto mb-3 opacity-30" />
              <p className="text-sm">{search ? "Sin resultados" : "No hay aliados registrados aún"}</p>
            </div>
          ) : (
            <div className="divide-y">
              {filtered.map(aliado => (
                <div key={aliado._id} className="flex items-center gap-4 px-6 py-4 hover:bg-muted/30 transition-colors">
                  <Avatar className="w-10 h-10 shrink-0">
                    <AvatarFallback className="bg-primary/10 text-primary font-semibold text-sm">
                      {aliado.nombre[0]}{aliado.apellido[0]}
                    </AvatarFallback>
                  </Avatar>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-medium text-foreground">{aliado.nombre} {aliado.apellido}</p>
                      <Badge
                        variant={aliado.activo ? "default" : "secondary"}
                        className={aliado.activo
                          ? "bg-green-100 text-green-700 border-green-200 hover:bg-green-100"
                          : "bg-red-100 text-red-600 border-red-200 hover:bg-red-100"
                        }
                      >
                        {aliado.activo ? "Activo" : "Bloqueado"}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground truncate">{aliado.email}</p>
                    <div className="flex items-center gap-1 mt-0.5">
                      <Tag className="w-3 h-3 text-primary" />
                      <span className="text-xs font-medium text-primary">@{aliado.etiqueta}</span>
                    </div>
                  </div>

                  <div className="text-xs text-muted-foreground hidden md:block shrink-0">
                    {new Date(aliado.createdAt).toLocaleDateString("es-CO", {
                      day: "numeric", month: "short", year: "numeric"
                    })}
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => { setPwdTarget(aliado); setNewPwd(""); setPwdError("") }}
                      title="Cambiar contraseña"
                    >
                      <KeyRound className="w-4 h-4 sm:mr-1.5" />
                      <span className="hidden sm:inline">Contraseña</span>
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setToggleTarget(aliado)}
                      className={aliado.activo
                        ? "text-red-500 hover:text-red-600 hover:border-red-300"
                        : "text-green-600 hover:text-green-700 hover:border-green-300"
                      }
                      title={aliado.activo ? "Bloquear" : "Desbloquear"}
                    >
                      {aliado.activo
                        ? <><Lock className="w-4 h-4 sm:mr-1.5" /><span className="hidden sm:inline">Bloquear</span></>
                        : <><Unlock className="w-4 h-4 sm:mr-1.5" /><span className="hidden sm:inline">Activar</span></>
                      }
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Modal: Crear Aliado ────────────────────────────── */}
      <Dialog open={showCreate} onOpenChange={open => { setShowCreate(open); setCreateError("") }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Nuevo Aliado</DialogTitle>
            <DialogDescription>Crea la cuenta de un nuevo referidor. Se creará su etiqueta en HubSpot automáticamente.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Nombre *</Label>
                <Input placeholder="Juan" value={createForm.nombre}
                  onChange={e => setCreateForm({ ...createForm, nombre: e.target.value })} />
              </div>
              <div className="space-y-2">
                <Label>Apellido *</Label>
                <Input placeholder="Pérez" value={createForm.apellido}
                  onChange={e => setCreateForm({ ...createForm, apellido: e.target.value })} />
              </div>
            </div>

            {createForm.nombre && createForm.apellido && (
              <div className="bg-primary/5 border border-primary/20 rounded-lg px-3 py-2 flex items-center gap-2">
                <Tag className="w-3.5 h-3.5 text-primary shrink-0" />
                <span className="text-sm text-primary font-medium">
                  @{createForm.nombre.toLowerCase().replace(/\s+/g, "")}.{createForm.apellido.toLowerCase().replace(/\s+/g, "")}
                </span>
              </div>
            )}

            <div className="space-y-2">
              <Label>Correo Electrónico *</Label>
              <Input type="email" placeholder="aliado@empresa.com" value={createForm.email}
                onChange={e => setCreateForm({ ...createForm, email: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Contraseña inicial *</Label>
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

            {createError && <p className="text-destructive text-sm">{createError}</p>}

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowCreate(false)}>Cancelar</Button>
              <Button type="submit" disabled={creating}>
                {creating ? (
                  <span className="flex items-center gap-2">
                    <span className="w-4 h-4 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
                    Creando...
                  </span>
                ) : "Crear Aliado"}
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
              Establece una nueva contraseña para{" "}
              <span className="font-semibold">{pwdTarget?.nombre} {pwdTarget?.apellido}</span>
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Nueva contraseña</Label>
              <div className="relative">
                <Input
                  type={showNewPwd ? "text" : "password"}
                  placeholder="Mínimo 6 caracteres"
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
            {pwdError && <p className="text-destructive text-sm">{pwdError}</p>}
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
                ? `${toggleTarget?.nombre} ${toggleTarget?.apellido} no podrá iniciar sesión ni registrar referidos.`
                : `${toggleTarget?.nombre} ${toggleTarget?.apellido} volverá a tener acceso a la plataforma.`
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
              {toggling ? "Procesando..." : toggleTarget?.activo ? "Sí, bloquear" : "Sí, activar"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
