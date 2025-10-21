import Link from "next/link"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { getAccounts } from "@/lib/account-data"
import { ArrowRight, Building2, GaugeCircle, Sparkles } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"

const accounts = getAccounts()

const totalOpportunityMillions = accounts.reduce((sum, account) => sum + (account.opportunity.valueMillions ?? 0), 0)
const formattedTotalOpportunity =
  totalOpportunityMillions > 0 ? `£${Math.round(totalOpportunityMillions)}m` : accounts.map((a) => a.opportunity.display).join(" / ")

const readinessScores = accounts.filter((account) => typeof account.readinessScore === "number")
const averageReadiness =
  readinessScores.length > 0
    ? Math.round(
        readinessScores.reduce((sum, account) => sum + (account.readinessScore ?? 0), 0) / readinessScores.length,
      )
    : undefined

export default function HomePage() {
  return (
    <div className="min-h-screen bg-background">
      <header className="bg-[hsl(45,100%,50%)] border-b border-[hsl(45,100%,45%)]">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <div className="flex items-center">
                <svg className="h-10 w-auto" viewBox="0 0 120 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect width="120" height="40" fill="#FFCC00" />
                  <path d="M15 12H25L20 20H30L25 28H15L20 20H10L15 12Z" fill="#D40511" />
                  <text x="35" y="26" fontFamily="Arial, sans-serif" fontSize="18" fontWeight="bold" fill="#D40511">
                    DHL
                  </text>
                </svg>
              </div>

              <div className="h-8 w-px bg-black/20" />

              <div className="flex items-center gap-2">
                <span className="text-2xl font-bold tracking-tight text-[#D40511]">MAGNUS</span>
                <span className="text-xs font-semibold tracking-wider text-black/60">CONSULTING</span>
              </div>
            </div>

            <nav className="flex items-center gap-6">
              <Link href="#" className="text-sm font-medium text-black/70 hover:text-black transition-colors">
                Dashboard
              </Link>
              <Link href="#" className="text-sm font-medium text-black/70 hover:text-black transition-colors">
                Analytics
              </Link>
              <Link href="#" className="text-sm font-medium text-black/70 hover:text-black transition-colors">
                Reports
              </Link>
              <ThemeToggle />
            </nav>
          </div>
        </div>
      </header>

      <section className="relative border-b border-border bg-gradient-to-br from-[hsl(45,100%,50%)] via-[hsl(45,100%,55%)] to-[hsl(40,100%,50%)] overflow-hidden">
        <div className="absolute inset-0 bg-[url('/grid.svg')] opacity-10" />
        <div className="absolute top-0 right-0 w-96 h-96 bg-[hsl(355,85%,45%)] rounded-full blur-3xl opacity-20" />
        <div className="container relative mx-auto px-6 py-16">
          <div className="max-w-3xl">
            <Badge className="mb-4 bg-black/90 text-[hsl(45,100%,50%)] border-black hover:bg-black">
              <Sparkles className="h-3 w-3 mr-1" />
              Golden Ticket Program
            </Badge>
            <h1 className="text-5xl font-bold mb-4 text-balance text-black">Golden Ticket Accounts</h1>
            <p className="text-xl text-black/80 leading-relaxed">
              Intelligence hub for DHL&apos;s three priority growth accounts. Explore curated insight packs, value
              propositions, and readiness signals direct from the Golden Ticket data room.
            </p>
          </div>
        </div>
      </section>

      <section className="border-b border-border bg-gradient-to-r from-muted/50 to-muted/30">
        <div className="container mx-auto px-6 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-card border-2 border-[hsl(45,100%,50%)] rounded-lg p-6 shadow-lg">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-[hsl(45,100%,50%)] flex items-center justify-center">
                  <Building2 className="h-6 w-6 text-black" />
                </div>
                <div>
                  <div className="text-3xl font-bold text-foreground">{accounts.length}</div>
                  <div className="text-sm text-muted-foreground">Active Accounts</div>
                </div>
              </div>
            </div>
            <div className="bg-card border-2 border-[hsl(355,85%,45%)] rounded-lg p-6 shadow-lg">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-[hsl(355,85%,45%)] flex items-center justify-center">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
                <div>
                  <div className="text-3xl font-bold text-[hsl(355,85%,45%)]">{formattedTotalOpportunity}</div>
                  <div className="text-sm text-muted-foreground">Total Pipeline</div>
                </div>
              </div>
            </div>
            <div className="bg-gradient-to-br from-[hsl(45,100%,50%)] to-[hsl(355,85%,45%)] rounded-lg p-6 shadow-lg">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-full bg-white/90 flex items-center justify-center">
                  <GaugeCircle className="h-6 w-6 text-[hsl(355,85%,45%)]" />
                </div>
                <div>
                  <div className="text-3xl font-bold text-white">{averageReadiness ? `${averageReadiness}%` : "—"}</div>
                  <div className="text-sm text-white/80">Readiness Score</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-12 bg-gradient-to-b from-background to-muted/20">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {accounts.map((account, index) => (
              <Link key={account.id} href={`/account/${account.id}`}>
                <Card className="group hover:border-[hsl(45,100%,50%)] hover:shadow-2xl hover:shadow-[hsl(45,100%,50%)]/20 transition-all duration-300 cursor-pointer h-full border-2 relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-[hsl(45,100%,50%)]/10 to-transparent rounded-bl-full" />
                  <CardHeader className="relative">
                    <div className="flex items-start justify-between mb-4">
                      <div className="h-16 w-16 rounded-lg overflow-hidden border-2 border-[hsl(45,100%,50%)] shadow-md">
                        <img
                          src={account.logo || "/placeholder.svg"}
                          alt={`${account.name} logo`}
                          className="h-full w-full object-cover bg-white"
                        />
                      </div>
                      <Badge className="bg-[hsl(355,85%,45%)] text-white border-0 shadow-md">{account.status}</Badge>
                    </div>
                    <CardTitle className="text-2xl mb-2 text-foreground">{account.name}</CardTitle>
                    <CardDescription className="text-sm leading-relaxed">{account.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-[hsl(45,100%,50%)]/10 rounded-lg border border-[hsl(45,100%,50%)]/30">
                        <span className="text-sm font-medium text-muted-foreground">Opportunity</span>
                        <span className="font-bold text-lg text-[hsl(355,85%,45%)]">{account.opportunity.display}</span>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Sector</span>
                        <Badge variant="outline" className="font-medium border-[hsl(45,100%,50%)]/50">
                          {account.sector}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">Region</span>
                        <span className="font-medium text-foreground">{account.region}</span>
                      </div>
                      <div className="pt-3 mt-3 border-t-2 border-[hsl(45,100%,50%)]/30">
                        <div className="flex items-center justify-between text-sm font-semibold group-hover:text-[hsl(355,85%,45%)] transition-colors">
                          <span>View Intelligence</span>
                          <ArrowRight className="h-4 w-4" />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}
