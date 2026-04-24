import Link from "next/link"
import { Button } from "@/components/ui/button"
import { ChevronLeft, ShieldCheck, Database, Users, FileText } from "lucide-react"

export default function TerminosPage() {
  return (
    <div className="min-h-screen bg-background py-12 px-6 sm:px-8">
      <div className="max-w-4xl mx-auto space-y-12">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6 pb-8 border-b border-border">
          <div className="space-y-2">
            <h1 className="text-3xl font-extrabold text-foreground tracking-tight">Términos y Condiciones</h1>
            <p className="text-muted-foreground">Última actualización: 24 de abril de 2026</p>
          </div>
          <Link href="/registro">
            <Button variant="outline" className="gap-2">
              <ChevronLeft className="w-4 h-4" />
              Volver al Registro
            </Button>
          </Link>
        </div>

        {/* Content */}
        <div className="grid gap-10 md:grid-cols-[1fr_250px]">
          <div className="space-y-10">
            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <ShieldCheck className="w-6 h-6 text-primary" />
                1. Introducción
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Bienvenido al Portal de Aliados Estratégicos de Global Express. Al registrarte y utilizar nuestra plataforma, aceptas cumplir con los siguientes términos y condiciones de uso. Por favor, léelos detenidamente antes de proceder.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <Database className="w-6 h-6 text-primary" />
                2. Tratamiento de Datos y Uso de HubSpot
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Nuestra plataforma utiliza <strong>HubSpot CRM</strong> para el almacenamiento y gestión de la información. Al registrar un referido, entiendes y aceptas que:
              </p>
              <ul className="list-disc pl-6 space-y-3 text-muted-foreground">
                <li>Los datos recolectados (nombre, email, teléfono, escolaridad, etc.) serán sincronizados en tiempo real con nuestra base de datos en HubSpot.</li>
                <li>Global Express actúa como responsable del tratamiento de datos bajo estándares internacionales de seguridad.</li>
                <li>La información se utilizará exclusivamente para el proceso de reclutamiento y perfilamiento de los candidatos hacia programas de vida y trabajo en los Estados Unidos.</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <Users className="w-6 h-6 text-primary" />
                3. Responsabilidades del Aliado
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Como aliado de Global Express, te comprometes a:
              </p>
              <ul className="list-disc pl-6 space-y-3 text-muted-foreground">
                <li>Obtener el consentimiento previo de los candidatos antes de registrar sus datos en esta plataforma.</li>
                <li>Proveer información veraz, actualizada y completa sobre los referidos.</li>
                <li>Mantener la confidencialidad de tus credenciales de acceso al portal.</li>
                <li>No utilizar la marca Global Express de forma no autorizada o que pueda inducir a error.</li>
              </ul>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <FileText className="w-6 h-6 text-primary" />
                4. Propósito de la Plataforma
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Este portal ha sido diseñado para facilitar la labor de los aliados en la identificación de talento calificado. El objetivo final es ayudar a los candidatos a cumplir su sueño de establecerse legalmente en los Estados Unidos mientras tú, como aliado, generas ingresos por cada referido exitoso según el plan de compensación vigente.
              </p>
            </section>

            <section className="space-y-4">
              <h2 className="text-2xl font-bold text-foreground flex items-center gap-2">
                <ShieldCheck className="w-6 h-6 text-primary" />
                5. Privacidad y Seguridad
              </h2>
              <p className="text-muted-foreground leading-relaxed">
                Implementamos medidas técnicas y organizativas para proteger los datos contra el acceso no autorizado. No vendemos ni compartimos la información de tus referidos con terceros ajenos al ecosistema de Global Express y sus socios de reclutamiento.
              </p>
            </section>
          </div>

          {/* Sidebar / Quick Links */}
          <aside className="space-y-6">
            <div className="bg-muted/30 p-6 rounded-2xl border border-border">
              <h3 className="font-bold text-foreground mb-4">Resumen Rápido</h3>
              <div className="space-y-4 text-sm">
                <div className="flex gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                  <p className="text-muted-foreground">Uso de HubSpot CRM para gestión segura.</p>
                </div>
                <div className="flex gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                  <p className="text-muted-foreground">Sincronización de leads en tiempo real.</p>
                </div>
                <div className="flex gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                  <p className="text-muted-foreground">Enfoque en programas USA (EB-3).</p>
                </div>
              </div>
            </div>

            <div className="p-4 border border-primary/20 bg-primary/5 rounded-2xl">
              <p className="text-xs text-center text-primary font-medium">
                Al continuar usando el portal, confirmas tu aceptación de estos términos.
              </p>
            </div>
          </aside>
        </div>

        {/* Footer Link */}
        <div className="pt-12 text-center">
          <Link href="/registro">
            <Button size="lg" className="w-full sm:w-64">
              Acepto y deseo registrarme
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
