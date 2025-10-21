import { notFound } from "next/navigation"
import Link from "next/link"
import { AccountTabs } from "@/components/account-tabs"
import { Badge } from "@/components/ui/badge"
import { getAccountById } from "@/lib/account-data"
import { ArrowLeft } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"

type AccountPageProps = {
  params: Promise<{ id: string }>
}

export default async function AccountPage({ params }: AccountPageProps) {
  const resolvedParams = await params
  const account = getAccountById(resolvedParams.id)

  if (!account) {
    notFound()
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background via-muted/10 to-background">
      <header className="bg-[hsl(45,100%,50%)] border-b border-[hsl(45,100%,45%)] sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-6">
              <Link
                href="/"
                className="flex items-center gap-2 text-sm font-medium text-black/70 hover:text-black transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Back to Accounts
              </Link>
              <div className="h-6 w-px bg-black/20" />
              <div className="flex items-center gap-3">
                <img
                  src={account.logo || "/placeholder.svg"}
                  alt={`${account.name} logo`}
                  className="h-8 w-8 rounded object-cover bg-white"
                />
                <h1 className="text-lg font-semibold text-black">{account.name}</h1>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="bg-white/90 text-black border-black/20">
                {account.sector}
              </Badge>
              <Badge className="bg-[hsl(355,85%,45%)] text-white border-0">{account.opportunity.display} opportunity</Badge>
              <ThemeToggle />
            </div>
          </div>
        </div>
      </header>

      <div className="h-1 bg-gradient-to-r from-[hsl(45,100%,50%)] via-[hsl(355,85%,45%)] to-[hsl(45,100%,50%)]" />

      {/* Account Content */}
      <div className="container mx-auto px-6 py-8">
        <AccountTabs account={account} />
      </div>
    </div>
  )
}
