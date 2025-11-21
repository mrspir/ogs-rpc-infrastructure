import { SiteHeader } from "@/components/site-header"
import { HeroSection } from "@/components/hero-section"
import { GlobalMetrics } from "@/components/global-metrics"
import { NetworkExplorer } from "@/components/network-explorer"
import { SiteFooter } from "@/components/site-footer"

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col">
      <SiteHeader />
      <main className="flex-1">
        <HeroSection />
        <GlobalMetrics />
        <NetworkExplorer />
      </main>
      <SiteFooter />
    </div>
  )
}
