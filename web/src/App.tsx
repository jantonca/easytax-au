import { Button } from '@/components/ui/button'

function App() {
  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="container flex min-h-screen flex-col items-center justify-center gap-6">
        <div className="space-y-2 text-center">
          <p className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground">
            EasyTax-AU
          </p>
          <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">
            Simpler BAS &amp; GST for Australian freelancers
          </h1>
          <p className="text-sm text-muted-foreground">
            Frontend scaffold · Phase F1.1
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button size="lg">Open dashboard</Button>
          <Button variant="outline" size="lg">
            View API docs
          </Button>
        </div>
      </div>
    </div>
  )
}

export default App
