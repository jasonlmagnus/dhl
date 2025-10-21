"use client"

import { useState } from "react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { CheckCircle2, Target, Users, MessageSquare, Send, TrendingUp, AlertCircle, Zap } from "lucide-react"

interface AccountTabsProps {
  account: any
}

export function AccountTabs({ account }: AccountTabsProps) {
  const [chatMessages, setChatMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([
    {
      role: "assistant",
      content: `Hello! I'm your AI assistant for ${account.name}. I have access to all account intelligence, competitor analysis, personas, and value propositions. How can I help you today?`,
    },
  ])
  const [inputMessage, setInputMessage] = useState("")

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return

    setChatMessages([
      ...chatMessages,
      { role: "user", content: inputMessage },
      {
        role: "assistant",
        content: `Based on ${account.name}'s intelligence: ${inputMessage.includes("supply chain") ? "Their current supply chain director is focused on capacity expansion and real-time visibility. Key pain point is warehouse constraints in the Midlands region." : "I can help you with that. What specific aspect would you like to explore?"}`,
      },
    ])
    setInputMessage("")
  }

  return (
    <Tabs defaultValue="strategy" className="w-full">
      <TabsList className="grid w-full grid-cols-4 mb-8 bg-muted p-1 h-auto">
        <TabsTrigger
          value="strategy"
          className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[hsl(45,100%,50%)] data-[state=active]:to-[hsl(40,100%,50%)] data-[state=active]:text-black data-[state=active]:shadow-lg py-3"
        >
          <Target className="h-4 w-4" />
          Account Strategy
        </TabsTrigger>
        <TabsTrigger
          value="value-prop"
          className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[hsl(45,100%,50%)] data-[state=active]:to-[hsl(40,100%,50%)] data-[state=active]:text-black data-[state=active]:shadow-lg py-3"
        >
          <TrendingUp className="h-4 w-4" />
          Value Proposition
        </TabsTrigger>
        <TabsTrigger
          value="personas"
          className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[hsl(45,100%,50%)] data-[state=active]:to-[hsl(40,100%,50%)] data-[state=active]:text-black data-[state=active]:shadow-lg py-3"
        >
          <Users className="h-4 w-4" />
          Personas
        </TabsTrigger>
        <TabsTrigger
          value="chatbot"
          className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[hsl(45,100%,50%)] data-[state=active]:to-[hsl(40,100%,50%)] data-[state=active]:text-black data-[state=active]:shadow-lg py-3"
        >
          <MessageSquare className="h-4 w-4" />
          Ask Magnus AI
        </TabsTrigger>
      </TabsList>

      {/* Account Strategy Tab */}
      <TabsContent value="strategy" className="space-y-6">
        <Card className="border-2 border-[hsl(45,100%,50%)] shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[hsl(45,100%,50%)]/10 to-transparent rounded-bl-full" />
          <CardHeader className="relative">
            <CardTitle className="text-foreground flex items-center gap-2">
              <Zap className="h-5 w-5 text-[hsl(45,100%,50%)]" />
              Account Overview
            </CardTitle>
            <CardDescription>Strategic intelligence and readiness assessment</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 relative">
            <p className="text-sm leading-relaxed text-muted-foreground">{account.summary}</p>

            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-2 p-4 bg-gradient-to-br from-[hsl(45,100%,50%)]/10 to-[hsl(45,100%,50%)]/5 rounded-lg border border-[hsl(45,100%,50%)]/30">
                <div className="text-sm font-medium text-muted-foreground">Incumbent Provider</div>
                <div className="text-2xl font-bold text-foreground">{account.incumbent}</div>
              </div>
              <div className="space-y-2 p-4 bg-gradient-to-br from-[hsl(355,85%,45%)]/10 to-[hsl(355,85%,45%)]/5 rounded-lg border border-[hsl(355,85%,45%)]/30">
                <div className="text-sm font-medium text-muted-foreground">Contract Expiry</div>
                <div className="text-2xl font-bold text-[hsl(355,85%,45%)]">{account.contractExpiry}</div>
              </div>
            </div>

            <div className="space-y-3 p-4 bg-muted/50 rounded-lg border-2 border-[hsl(45,100%,50%)]/30">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-foreground">Account Readiness Score</span>
                <span className="text-3xl font-bold text-[hsl(45,100%,50%)]">{account.readinessScore}%</span>
              </div>
              <Progress value={account.readinessScore} className="h-3 bg-muted" />
              <p className="text-xs text-muted-foreground flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-[hsl(45,100%,50%)]" />
                High readiness - Active procurement phase with budget allocated
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="border-l-4 border-l-[hsl(45,100%,50%)] shadow-lg">
            <CardHeader className="bg-[hsl(45,100%,50%)]/5">
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Target className="h-5 w-5 text-[hsl(45,100%,50%)]" />
                Key Objectives
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <ul className="space-y-3">
                {account.objectives.map((objective: string, index: number) => (
                  <li
                    key={index}
                    className="flex items-start gap-3 p-2 rounded hover:bg-[hsl(45,100%,50%)]/5 transition-colors"
                  >
                    <CheckCircle2 className="h-5 w-5 text-[hsl(45,100%,50%)] mt-0.5 flex-shrink-0" />
                    <span className="text-sm leading-relaxed text-foreground">{objective}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-[hsl(355,85%,45%)] shadow-lg">
            <CardHeader className="bg-[hsl(355,85%,45%)]/5">
              <CardTitle className="flex items-center gap-2 text-foreground">
                <AlertCircle className="h-5 w-5 text-[hsl(355,85%,45%)]" />
                Success Signals
              </CardTitle>
            </CardHeader>
            <CardContent className="pt-6">
              <ul className="space-y-3">
                {account.successSignals.map((signal: string, index: number) => (
                  <li
                    key={index}
                    className="flex items-start gap-3 p-2 rounded hover:bg-[hsl(355,85%,45%)]/5 transition-colors"
                  >
                    <div className="h-2 w-2 rounded-full bg-[hsl(355,85%,45%)] mt-2 flex-shrink-0" />
                    <span className="text-sm leading-relaxed text-foreground">{signal}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="value-prop" className="space-y-6">
        <Card className="border-2 border-[hsl(45,100%,50%)] shadow-lg">
          <CardHeader className="bg-gradient-to-r from-[hsl(45,100%,50%)]/10 to-[hsl(355,85%,45%)]/10">
            <CardTitle className="text-foreground">Core Value Proposition</CardTitle>
            <CardDescription>Growth at pace, without compromise</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 pt-6">
            <div className="p-6 bg-gradient-to-br from-[hsl(45,100%,50%)]/10 via-background to-[hsl(355,85%,45%)]/10 border-2 border-[hsl(45,100%,50%)] rounded-lg shadow-inner">
              <h3 className="text-xl font-bold mb-3 text-balance text-foreground">
                "Expand your reach and scale operations confidently, backed by logistics that never lets you down"
              </h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                For ambitious FMCG brands like {account.name}, growth means entering new markets, launching products
                faster, and meeting surging demand—all without risking the reliability your customers expect.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card className="border-2 border-[hsl(45,100%,50%)] shadow-md hover:shadow-lg transition-shadow">
                <CardHeader>
                  <Badge className="w-fit mb-2 bg-[hsl(45,100%,50%)] text-black border-0">Functional</Badge>
                  <CardTitle className="text-lg text-foreground">Expand at Pace</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Flexible warehouse capacity and distribution networks that scale with your ambitions
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2 border-[hsl(355,85%,45%)] shadow-md hover:shadow-lg transition-shadow">
                <CardHeader>
                  <Badge className="w-fit mb-2 bg-[hsl(355,85%,45%)] text-white border-0">Emotional</Badge>
                  <CardTitle className="text-lg text-foreground">Confidence & Peace of Mind</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Sleep soundly knowing your supply chain is resilient, monitored 24/7, and backed by experts
                  </p>
                </CardContent>
              </Card>

              <Card className="border-2 border-[hsl(9,85%,60%)] shadow-md hover:shadow-lg transition-shadow">
                <CardHeader>
                  <Badge className="w-fit mb-2 bg-[hsl(9,85%,60%)] text-white border-0">Societal</Badge>
                  <CardTitle className="text-lg text-foreground">Sustainable Growth</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Reduce carbon footprint with optimized routes and green logistics solutions
                  </p>
                </CardContent>
              </Card>
            </div>
          </CardContent>
        </Card>

        <Card className="border-border shadow-lg">
          <CardHeader>
            <CardTitle className="text-foreground">Messaging Framework</CardTitle>
            <CardDescription>Tailored messaging for different stakeholders</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2 p-4 bg-[hsl(45,100%,50%)]/5 rounded-lg">
              <div className="font-semibold text-sm text-foreground">For Supply Chain Directors:</div>
              <p className="text-sm text-muted-foreground leading-relaxed pl-4 border-l-4 border-[hsl(45,100%,50%)]">
                "Real-time visibility across your entire supply chain, with predictive analytics that help you stay
                ahead of disruptions"
              </p>
            </div>
            <div className="space-y-2 p-4 bg-[hsl(355,85%,45%)]/5 rounded-lg">
              <div className="font-semibold text-sm text-foreground">For CFOs:</div>
              <p className="text-sm text-muted-foreground leading-relaxed pl-4 border-l-4 border-[hsl(355,85%,45%)]">
                "Transparent pricing with no hidden costs, plus efficiency gains that improve your bottom line by up to
                15%"
              </p>
            </div>
            <div className="space-y-2 p-4 bg-[hsl(9,85%,60%)]/5 rounded-lg">
              <div className="font-semibold text-sm text-foreground">For CEOs:</div>
              <p className="text-sm text-muted-foreground leading-relaxed pl-4 border-l-4 border-[hsl(9,85%,60%)]">
                "A strategic logistics partner that enables your growth ambitions while strengthening your
                sustainability credentials"
              </p>
            </div>
          </CardContent>
        </Card>
      </TabsContent>

      <TabsContent value="personas" className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-2 border-[hsl(45,100%,50%)] shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-[hsl(45,100%,50%)] to-[hsl(40,100%,50%)] flex items-center justify-center mb-4 shadow-lg">
                <Users className="h-8 w-8 text-black" />
              </div>
              <CardTitle className="text-foreground">Supply Chain Director</CardTitle>
              <CardDescription>Operations & Logistics Lead</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 bg-[hsl(45,100%,50%)]/10 rounded-lg">
                <div className="text-sm font-semibold mb-2 text-foreground">Goals</div>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Increase distribution capacity</li>
                  <li>Improve delivery reliability</li>
                  <li>Gain real-time visibility</li>
                </ul>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="text-sm font-semibold mb-2 text-foreground">Challenges</div>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Limited warehouse space</li>
                  <li>Inflexible current provider</li>
                  <li>Manual tracking processes</li>
                </ul>
              </div>
              <div className="p-3 bg-[hsl(45,100%,50%)]/10 rounded-lg border-l-4 border-[hsl(45,100%,50%)]">
                <div className="text-sm font-semibold mb-2 text-foreground">What DHL Offers</div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Scalable infrastructure, advanced WMS, and dedicated account management
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-[hsl(355,85%,45%)] shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-[hsl(355,85%,45%)] to-[hsl(350,85%,40%)] flex items-center justify-center mb-4 shadow-lg">
                <Users className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-foreground">Chief Financial Officer</CardTitle>
              <CardDescription>Financial Decision Maker</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 bg-[hsl(355,85%,45%)]/10 rounded-lg">
                <div className="text-sm font-semibold mb-2 text-foreground">Goals</div>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Reduce logistics costs</li>
                  <li>Improve cash flow predictability</li>
                  <li>Minimize capital expenditure</li>
                </ul>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="text-sm font-semibold mb-2 text-foreground">Challenges</div>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Rising transportation costs</li>
                  <li>Unpredictable logistics spend</li>
                  <li>ROI justification pressure</li>
                </ul>
              </div>
              <div className="p-3 bg-[hsl(355,85%,45%)]/10 rounded-lg border-l-4 border-[hsl(355,85%,45%)]">
                <div className="text-sm font-semibold mb-2 text-foreground">What DHL Offers</div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Transparent pricing, efficiency gains, and flexible payment terms
                </p>
              </div>
            </CardContent>
          </Card>

          <Card className="border-2 border-[hsl(9,85%,60%)] shadow-lg hover:shadow-xl transition-shadow">
            <CardHeader>
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-[hsl(9,85%,60%)] to-[hsl(9,85%,55%)] flex items-center justify-center mb-4 shadow-lg">
                <Users className="h-8 w-8 text-white" />
              </div>
              <CardTitle className="text-foreground">Chief Executive Officer</CardTitle>
              <CardDescription>Strategic Vision Leader</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="p-3 bg-[hsl(9,85%,60%)]/10 rounded-lg">
                <div className="text-sm font-semibold mb-2 text-foreground">Goals</div>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Drive sustainable growth</li>
                  <li>Enhance brand reputation</li>
                  <li>Meet ESG commitments</li>
                </ul>
              </div>
              <div className="p-3 bg-muted/50 rounded-lg">
                <div className="text-sm font-semibold mb-2 text-foreground">Challenges</div>
                <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
                  <li>Balancing growth with sustainability</li>
                  <li>Stakeholder pressure on ESG</li>
                  <li>Market expansion risks</li>
                </ul>
              </div>
              <div className="p-3 bg-[hsl(9,85%,60%)]/10 rounded-lg border-l-4 border-[hsl(9,85%,60%)]">
                <div className="text-sm font-semibold mb-2 text-foreground">What DHL Offers</div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  Carbon-neutral solutions, strategic partnership, and proven track record
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="chatbot" className="space-y-6">
        <Card className="border-2 border-[hsl(45,100%,50%)] shadow-lg">
          <CardHeader className="bg-gradient-to-r from-[hsl(45,100%,50%)]/10 to-[hsl(355,85%,45%)]/10">
            <CardTitle className="flex items-center gap-2 text-foreground">
              <MessageSquare className="h-5 w-5 text-[hsl(45,100%,50%)]" />
              Ask Magnus AI
            </CardTitle>
            <CardDescription>
              Search across all {account.name} intelligence – competitor reports, personas, workshop notes, and
              propositions
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {/* Chat Messages */}
              <div className="h-96 overflow-y-auto space-y-4 p-4 bg-gradient-to-b from-muted/30 to-muted/10 rounded-lg border-2 border-[hsl(45,100%,50%)]/30">
                {chatMessages.map((message, index) => (
                  <div key={index} className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}>
                    <div
                      className={`max-w-[80%] rounded-lg p-3 shadow-md ${
                        message.role === "user"
                          ? "bg-gradient-to-r from-[hsl(45,100%,50%)] to-[hsl(40,100%,50%)] text-black"
                          : "bg-card border-2 border-[hsl(45,100%,50%)]/30 text-foreground"
                      }`}
                    >
                      <p className="text-sm leading-relaxed">{message.content}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Input Area */}
              <div className="flex gap-2">
                <Input
                  placeholder="Ask about AG Barr's supply chain priorities or DHL positioning..."
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={(e) => e.key === "Enter" && handleSendMessage()}
                  className="flex-1 bg-background border-2 border-[hsl(45,100%,50%)]/30 focus:border-[hsl(45,100%,50%)]"
                />
                <Button
                  onClick={handleSendMessage}
                  size="icon"
                  className="bg-gradient-to-r from-[hsl(45,100%,50%)] to-[hsl(40,100%,50%)] hover:from-[hsl(45,100%,45%)] hover:to-[hsl(40,100%,45%)] text-black shadow-lg"
                >
                  <Send className="h-4 w-4" />
                </Button>
              </div>

              {/* Suggested Questions */}
              <div className="space-y-2">
                <div className="text-sm font-medium text-foreground">Suggested questions:</div>
                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setInputMessage("What are AG Barr's main supply chain challenges?")}
                    className="border-2 border-[hsl(45,100%,50%)]/50 hover:bg-[hsl(45,100%,50%)]/10 hover:border-[hsl(45,100%,50%)]"
                  >
                    Supply chain challenges
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setInputMessage("Who are the key decision makers?")}
                    className="border-2 border-[hsl(355,85%,45%)]/50 hover:bg-[hsl(355,85%,45%)]/10 hover:border-[hsl(355,85%,45%)]"
                  >
                    Key decision makers
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setInputMessage("What's our competitive advantage?")}
                    className="border-2 border-[hsl(9,85%,60%)]/50 hover:bg-[hsl(9,85%,60%)]/10 hover:border-[hsl(9,85%,60%)]"
                  >
                    Competitive advantage
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}
