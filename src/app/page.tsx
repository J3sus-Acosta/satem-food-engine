import { APP_CONFIG } from '@/config'
import { Button } from '@/components/ui/button'

/**
 * Home page — temporary scaffold.
 * Replace with the (marketing) landing page once development begins.
 */
export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 p-8 text-center">
      <div className="flex flex-col items-center gap-2">
        <h1 className="text-4xl font-bold tracking-tight">{APP_CONFIG.name}</h1>
        <p className="text-muted-foreground max-w-md text-lg">{APP_CONFIG.description}</p>
        <p className="text-muted-foreground/60 text-sm">v{APP_CONFIG.version}</p>
      </div>

      <div className="flex gap-3">
        <Button>
          <a href="https://github.com" target="_blank" rel="noopener noreferrer">
            Repositorio
          </a>
        </Button>
        <Button variant="outline">
          <a href="/docs" rel="noopener noreferrer">
            Documentación
          </a>
        </Button>
      </div>

      <p className="text-muted-foreground/40 text-xs">
        Next.js · React 19 · Tailwind CSS 4 · shadcn/ui
      </p>
    </main>
  )
}
