import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FileText, Download, Search, Upload, FolderOpen } from "lucide-react"

const files = [
  { name: "CV_Juan_Perez.pdf", type: "CV", size: "2.4 MB", date: "2024-01-15", lead: "Juan Pérez" },
  { name: "CV_Maria_Gonzalez.pdf", type: "CV", size: "1.8 MB", date: "2024-01-14", lead: "María González" },
  { name: "Contrato_EB3_Roberto.pdf", type: "Contrato", size: "3.2 MB", date: "2024-01-13", lead: "Roberto Silva" },
  { name: "CV_Ana_Martinez.pdf", type: "CV", size: "2.1 MB", date: "2024-01-12", lead: "Ana Martínez" },
  { name: "Documentos_Carlos.pdf", type: "Documentos", size: "4.5 MB", date: "2024-01-11", lead: "Carlos López" },
]

export default function ArchivosPage() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h2 className="text-2xl font-bold text-foreground">Archivos</h2>
          <p className="text-muted-foreground mt-1">
            Gestiona los documentos de tus leads
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input placeholder="Buscar archivos..." className="pl-9 w-64" />
          </div>
          <Button>
            <Upload className="w-4 h-4 mr-2" />
            Subir Archivo
          </Button>
        </div>
      </div>

      {/* Files Table */}
      <Card>
        <CardHeader>
          <CardTitle>Documentos Recientes</CardTitle>
          <CardDescription>Archivos subidos por tus leads</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {files.map((file, index) => (
              <div
                key={index}
                className="flex items-center justify-between py-3 border-b border-border last:border-0"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                    <FileText className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{file.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {file.lead} &middot; {file.type} &middot; {file.size}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-sm text-muted-foreground hidden sm:block">
                    {new Date(file.date).toLocaleDateString("es-ES")}
                  </span>
                  <Button variant="ghost" size="icon">
                    <Download className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Empty State */}
      <Card className="border-dashed">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mb-4">
            <FolderOpen className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-semibold text-foreground mb-1">Arrastra archivos aquí</h3>
          <p className="text-sm text-muted-foreground text-center max-w-sm">
            O haz clic en el botón de subir para agregar documentos a tu biblioteca.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
