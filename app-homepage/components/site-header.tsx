import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Activity, Menu } from 'lucide-react'

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Activity className="h-5 w-5" />
          </div>
          <span className="text-lg font-bold tracking-tight">OriginStake</span>
        </div>

        <nav className="hidden md:flex items-center gap-6 text-sm font-medium text-muted-foreground">
          <Link href="#" className="hover:text-foreground transition-colors">
            Networks
          </Link>
          <Link href="#" className="hover:text-foreground transition-colors">
            Pricing
          </Link>
          <Link href="#" className="hover:text-foreground transition-colors">
            Docs
          </Link>
          <Link href="#" className="hover:text-foreground transition-colors">
            Status
          </Link>
        </nav>

        <div className="flex items-center gap-4">
          <Link href="#" className="hidden md:block text-sm font-medium text-muted-foreground hover:text-foreground">
            Log in
          </Link>
          <Button size="sm" className="hidden md:flex">
            Get API Key
          </Button>
          <Button variant="ghost" size="icon" className="md:hidden">
            <Menu className="h-5 w-5" />
            <span className="sr-only">Toggle menu</span>
          </Button>
        </div>
      </div>
    </header>
  )
}
