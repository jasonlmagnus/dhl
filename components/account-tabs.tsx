"use client"

import { useEffect, useMemo, useRef, useState } from "react"
import type { AccountRecord } from "@/lib/account-data"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import rehypeHighlight from "rehype-highlight"
import {
  AlertCircle,
  CheckCircle2,
  MessageSquare,
  Send,
  Sparkles,
  Target,
  TrendingUp,
  Users,
  Zap,
} from "lucide-react"

interface AccountTabsProps {
  account: AccountRecord
}

type ChatMessage = { role: "user" | "assistant"; content: string }

const SECTION_BG = "bg-muted/40"

export function AccountTabs({ account }: AccountTabsProps) {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([
    {
      role: "assistant",
      content: `Hello! I'm your AI assistant for ${account.name}. I'm connected to the Golden Ticket data room, including workshop summaries, competitor intelligence, and value proposition routes. What would you like to explore first?`,
    },
  ])
  const [inputMessage, setInputMessage] = useState("")
  const [isStreaming, setIsStreaming] = useState(false)
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [selectedPersona, setSelectedPersona] = useState<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)
  const chatContainerRef = useRef<HTMLDivElement | null>(null)

  const readinessLabel = useMemo(() => {
    if (!account.readinessScore) return "Not yet scored"
    if (account.readinessScore >= 80) return "Momentum building"
    if (account.readinessScore >= 60) return "In motion"
    return "Foundational"
  }, [account.readinessScore])

  const objectiveSummary = account.nearTermPriorities.slice(0, 3).join("; ")
  const keyChallengeSummary = account.summary.keyChallenges.slice(0, 2).join("; ")
  const differentiatorSummary = account.differentiators.slice(0, 2).join("; ")

  const personaDocument =
    selectedPersona === "Supply Chain Officer"
      ? account.supplyChainPersona
      : selectedPersona === "CFO/COO"
        ? account.cfoPersona
        : undefined

  const updateAssistantMessage = (content: string) => {
    setChatMessages((prev) => {
      const updated = [...prev]
      const lastIndex = updated.length - 1
      if (lastIndex >= 0 && updated[lastIndex].role === "assistant") {
        updated[lastIndex] = { ...updated[lastIndex], content }
      }
      return updated
    })
  }

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight
    }
  }, [chatMessages, isStreaming])

  const handleSendMessage = async () => {
    const trimmedMessage = inputMessage.trim()
    if (!trimmedMessage || isStreaming) return

    const userMessage: ChatMessage = { role: "user", content: trimmedMessage }
    const historyPayload = [...chatMessages, userMessage].map((message) => ({
      role: message.role,
      content: message.content,
    }))

    setChatMessages((prev) => [...prev, userMessage, { role: "assistant", content: "" }])
    setInputMessage("")
    setErrorMessage(null)
    setIsStreaming(true)

    const controller = new AbortController()
    abortControllerRef.current = controller

    try {
      const response = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          accountId: account.id,
          messages: historyPayload,
        }),
        signal: controller.signal,
      })

      if (!response.ok) {
        let message = "Assistant request failed"
        try {
          const errorPayload = await response.json()
          message = typeof errorPayload.error === "string" ? errorPayload.error : message
        } catch {
          const fallback = await response.text()
          if (fallback) {
            message = fallback
          }
        }
        throw new Error(message)
      }

      if (!response.body) {
        throw new Error("Assistant response did not include a body")
      }

      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ""
      let assistantContent = ""
      let streamingError: Error | null = null
      let streamComplete = false

      const processEventChunk = (chunk: string): boolean => {
        const lines = chunk.split("\n")
        for (const rawLine of lines) {
          const line = rawLine.trim()
          if (!line.startsWith("data:")) {
            continue
          }
          const dataStr = line.slice(5).trim()
          if (!dataStr) {
            continue
          }
          if (dataStr === "[DONE]") {
            return false
          }

          let parsed: any
          try {
            parsed = JSON.parse(dataStr)
          } catch {
            continue
          }

          switch (parsed.type) {
            case "response.output_text.delta": {
              const delta = typeof parsed.delta === "string" ? parsed.delta : ""
              if (delta) {
                assistantContent += delta
                updateAssistantMessage(assistantContent)
              }
              break
            }
            case "response.output_text.done": {
              const finalText = typeof parsed.output_text === "string" ? parsed.output_text : assistantContent
              assistantContent = finalText
              updateAssistantMessage(assistantContent)
              break
            }
            case "response.completed": {
              return false
            }
            case "response.error": {
              streamingError = new Error(parsed.error?.message ?? "Assistant encountered an error")
              return false
            }
            default:
              break
          }
        }
        return true
      }

      while (!streamComplete) {
        const { value, done } = await reader.read()
        if (done) {
          if (buffer.trim()) {
            processEventChunk(buffer)
          }
          break
        }

        buffer += decoder.decode(value, { stream: true })
        const events = buffer.split("\n\n")
        buffer = events.pop() ?? ""

        for (const event of events) {
          if (!processEventChunk(event)) {
            streamComplete = true
            break
          }
        }
      }

      if (streamingError) {
        throw streamingError
      }

      if (!assistantContent.trim()) {
        updateAssistantMessage("I wasn’t able to find relevant information in the knowledge base for that query.")
      }
    } catch (error) {
      const message =
        error instanceof DOMException && error.name === "AbortError"
          ? "Assistant response was cancelled."
          : error instanceof Error
            ? error.message
            : "Unexpected error contacting the assistant."

      setErrorMessage(message)
      updateAssistantMessage(`⚠️ ${message}`)
    } finally {
      abortControllerRef.current = null
      setIsStreaming(false)
    }
  }

  return (
    <Tabs defaultValue="strategy" className="w-full">
      <TabsList className="grid w-full grid-cols-4 mb-8 bg-muted p-1 h-auto">
        <TabsTrigger
          value="strategy"
          className="flex items-center gap-2 data-[state=active]:bg-gradient-to-r data-[state=active]:from-[hsl(45,100%,50%)] data-[state=active]:to-[hsl(40,100%,50%)] data-[state=active]:text-black data-[state=active]:shadow-lg py-3"
        >
          <Target className="h-4 w-4" />
          Strategy
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

      <TabsContent value="strategy" className="space-y-6">
        <Card className="border-2 border-[hsl(45,100%,50%)] shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-[hsl(45,100%,50%)]/10 to-transparent rounded-bl-full" />
          <CardHeader className="relative">
            <CardTitle className="text-foreground flex items-center gap-2">
              <Zap className="h-5 w-5 text-[hsl(45,100%,50%)]" />
              Account Overview
            </CardTitle>
            <CardDescription>Extracted from the Alignment Workshop deck.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6 relative">
            {account.summary.narrative.length > 0 && (
              <p className="text-sm leading-relaxed text-muted-foreground">{account.summary.narrative.join(" ")}</p>
            )}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className={`rounded-lg border border-[hsl(45,100%,50%)]/30 p-4 ${SECTION_BG}`}>
                <div className="text-xs uppercase font-semibold text-muted-foreground mb-1">Incumbent</div>
                <div className="text-base font-semibold text-foreground">{account.incumbent ?? "—"}</div>
              </div>
              <div className={`rounded-lg border border-[hsl(355,85%,45%)]/30 p-4 ${SECTION_BG}`}>
                <div className="text-xs uppercase font-semibold text-muted-foreground mb-1">Contract Horizon</div>
                <div className="text-base font-semibold text-[hsl(355,85%,45%)]">{account.contractExpiry ?? "—"}</div>
              </div>
              <div className="rounded-lg border border-muted p-4 flex flex-col gap-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs uppercase font-semibold text-muted-foreground">Readiness</span>
                  <Badge variant="outline" className="border-[hsl(45,100%,50%)]/40 text-[hsl(355,85%,45%)]">
                    {readinessLabel}
                  </Badge>
                </div>
                <Progress value={account.readinessScore ?? 0} />
                <span className="text-sm font-semibold text-foreground">
                  {account.readinessScore ? `${account.readinessScore}%` : "Scoring in progress"}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <StrategyColumn title="Account context" items={account.summary.accountContext} />
              <StrategyColumn title="Key challenges" items={account.summary.keyChallenges} highlight />
              <StrategyColumn title="Knowledge gaps" items={account.summary.knowledgeGaps} />
            </div>
          </CardContent>
        </Card>

        <Card className="border-2 border-[hsl(355,85%,45%)]/50 shadow-lg">
          <CardHeader className="bg-[hsl(355,85%,45%)]/5">
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Target className="h-5 w-5 text-[hsl(355,85%,45%)]" />
              Growth Objectives
            </CardTitle>
            <CardDescription>
              Anchored in accelerator planning and the near-term priorities agreed during the workshop.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {account.acceleratorObjective && (
              <div className="p-4 rounded-lg border border-[hsl(355,85%,45%)]/40 bg-[hsl(355,85%,45%)]/10">
                <div className="text-xs uppercase font-semibold text-[hsl(355,85%,45%)] mb-2">
                  Accelerator objective
                </div>
                <p className="text-sm text-foreground leading-relaxed">{account.acceleratorObjective}</p>
              </div>
            )}
            {account.valueToDHL.length > 0 && (
              <BulletSection
                title="Value to DHL"
                items={account.valueToDHL}
                iconColor="text-[hsl(355,85%,45%)]"
              />
            )}
            {account.nearTermPriorities.length > 0 && (
              <BulletSection
                title="Near-term priorities"
                items={account.nearTermPriorities}
                iconColor="text-[hsl(45,100%,50%)]"
              />
            )}
          </CardContent>
        </Card>

        {account.keyTakeaways.length > 0 && (
          <Card className="border-2 border-[hsl(45,100%,50%)]/40 shadow-md">
            <CardHeader className="bg-muted/60">
              <CardTitle className="flex items-center gap-2 text-foreground">
                <Sparkles className="h-5 w-5 text-[hsl(45,100%,50%)]" />
                Analyst Takeaways
              </CardTitle>
              <CardDescription>Headline market and competitor insights pulled from the CCC report.</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {account.keyTakeaways.map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle2 className="h-4 w-4 text-[hsl(45,100%,50%)] mt-1 flex-shrink-0" />
                    <span className="text-sm leading-relaxed text-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {account.successSignals.length > 0 && (
          <Card className="border-l-4 border-l-[hsl(355,85%,45%)] shadow-lg">
            <CardHeader className="bg-[hsl(355,85%,45%)]/5">
              <CardTitle className="flex items-center gap-2 text-foreground">
                <AlertCircle className="h-5 w-5 text-[hsl(355,85%,45%)]" />
                Success Signals
              </CardTitle>
              <CardDescription>Signals and proof points confirming traction with the customer.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <ul className="space-y-3">
                {account.successSignals.map((item, index) => (
                  <li key={index} className="flex items-start gap-3 p-3 rounded hover:bg-[hsl(355,85%,45%)]/5 transition-colors">
                    <div className="h-2 w-2 rounded-full bg-[hsl(355,85%,45%)] mt-2 flex-shrink-0" />
                    <div>
                      <p className="text-sm font-semibold text-foreground">{item.signal}</p>
                      {item.evidence && (
                        <p className="text-xs text-muted-foreground leading-relaxed mt-1">{item.evidence}</p>
                      )}
                    </div>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}
      </TabsContent>

      <TabsContent value="value-prop" className="space-y-6">
        {account.valueProp && (
          <Card className="border-2 border-[hsl(45,100%,50%)] shadow-lg">
            <CardHeader className="bg-gradient-to-r from-[hsl(45,100%,50%)]/10 to-[hsl(355,85%,45%)]/10">
              <CardTitle className="text-foreground">Value Proposition Statement</CardTitle>
              {account.valueProp.statementSource && (
                <CardDescription>Source: {account.valueProp.statementSource}</CardDescription>
              )}
            </CardHeader>
            <CardContent className="space-y-3">
              {account.valueProp.statement.map((p, idx) => (
                <p key={idx} className="text-sm leading-relaxed text-foreground">
                  {p}
                </p>
              ))}
            </CardContent>
          </Card>
        )}

        {account.valueProp?.subMessages?.length ? (
          <Card className="border-2 border-[hsl(355,85%,45%)]/50 shadow-lg">
            <CardHeader>
              <CardTitle className="text-foreground">Supporting Sub-Messages / Proof Points</CardTitle>
              {account.valueProp.subMessages[0]?.source && (
                <CardDescription>Source: {account.valueProp.subMessages[0].source}</CardDescription>
              )}
            </CardHeader>
            <CardContent className="grid gap-6 md:grid-cols-3">
              {account.valueProp.subMessages.map((msg, idx) => (
                <div key={idx} className="p-4 rounded-lg border border-[hsl(45,100%,50%)]/30 bg-muted/30">
                  <div className="text-sm font-semibold text-foreground mb-2">{msg.title}</div>
                  <ul className="space-y-2">
                    {msg.bullets.map((b, i) => (
                      <li key={i} className="text-sm text-muted-foreground leading-relaxed">{b}</li>
                    ))}
                  </ul>
                </div>
              ))}
            </CardContent>
          </Card>
        ) : null}

        {account.valueProp?.personaResonance?.length ? (
          <Card className="border-2 border-muted/70 shadow-md">
            <CardHeader>
              <CardTitle className="text-foreground">Persona Resonance Mapping</CardTitle>
              {account.valueProp.personaResonance[0]?.source && (
                <CardDescription>Source: {account.valueProp.personaResonance[0].source}</CardDescription>
              )}
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-muted-foreground border-b">
                      <th className="py-2 pr-4">Persona</th>
                      <th className="py-2 pr-4">Top 3 Priorities</th>
                      <th className="py-2">Message Resonance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {account.valueProp.personaResonance.map((row, idx) => (
                      <tr key={idx} className="border-b last:border-b-0 align-top">
                        <td className="py-3 pr-4 font-medium text-foreground whitespace-nowrap">{row.persona}</td>
                        <td className="py-3 pr-4">
                          <ul className="list-disc pl-5 space-y-1 text-muted-foreground">
                            {row.priorities.map((p, i) => (
                              <li key={i}>{p}</li>
                            ))}
                          </ul>
                        </td>
                        <td className="py-3 text-muted-foreground">{row.resonance}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        ) : null}

        {!account.valueProp && account.voiceOfCustomer.length > 0 && (
          <Card className="border-2 border-[hsl(45,100%,50%)] shadow-lg">
            <CardHeader className="bg-gradient-to-r from-[hsl(45,100%,50%)]/10 to-[hsl(355,85%,45%)]/10">
              <CardTitle className="text-foreground">Voice of the Customer</CardTitle>
              <CardDescription>Direct quotes and themes captured in the VP and DMU workshop.</CardDescription>
            </CardHeader>
            <CardContent className="pt-6">
              <ul className="space-y-3">
                {account.voiceOfCustomer.map((line, index) => (
                  <li key={index} className="text-sm leading-relaxed text-muted-foreground border-l-2 border-[hsl(45,100%,50%)] pl-3">
                    {line}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {account.differentiators.length > 0 && (
          <Card className="border-2 border-[hsl(355,85%,45%)] shadow-lg">
            <CardHeader>
              <CardTitle className="text-foreground">Points of Difference</CardTitle>
              <CardDescription>The proof-led messages that distinguish DHL for this account.</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {account.differentiators.map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle2 className="h-4 w-4 text-[hsl(355,85%,45%)] mt-1 flex-shrink-0" />
                    <span className="text-sm leading-relaxed text-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {account.valueFocus.length > 0 && (
          <Card className="border-2 border-[hsl(45,100%,50%)]/60 shadow-lg">
            <CardHeader>
              <CardTitle className="text-foreground">Value Proposition Focus Areas</CardTitle>
              <CardDescription>Priority stories to build into campaigns and executive outreach.</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {account.valueFocus.map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <Sparkles className="h-4 w-4 text-[hsl(45,100%,50%)] mt-1 flex-shrink-0" />
                    <span className="text-sm leading-relaxed text-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {(objectiveSummary || keyChallengeSummary || differentiatorSummary) && (
          <Card className="border border-muted/60 bg-muted/30">
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase">Quick recap</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 md:grid-cols-3 text-xs text-muted-foreground">
              {objectiveSummary && (
                <div>
                  <span className="block font-semibold text-foreground mb-1">Near-term focus</span>
                  {objectiveSummary}
                </div>
              )}
              {keyChallengeSummary && (
                <div>
                  <span className="block font-semibold text-foreground mb-1">Challenges</span>
                  {keyChallengeSummary}
                </div>
              )}
              {differentiatorSummary && (
                <div>
                  <span className="block font-semibold text-foreground mb-1">Differentiators</span>
                  {differentiatorSummary}
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </TabsContent>

      <TabsContent value="personas" className="space-y-6">
        <Card className="border-2 border-[hsl(45,100%,50%)]/60 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-foreground">
              <Users className="h-5 w-5 text-[hsl(45,100%,50%)]" />
              Decision-Making Unit
            </CardTitle>
            <CardDescription>Stakeholder landscape sourced from the workshop summary.</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-6 md:grid-cols-3">
            <PersonaColumn title="Decision makers" entries={account.decisionUnit.decisionMakers} accent="border-[hsl(355,85%,45%)]" />
            <PersonaColumn title="Influencers" entries={account.decisionUnit.influencers} accent="border-[hsl(45,100%,50%)]" />
            <PersonaColumn title="Wider community" entries={account.decisionUnit.community} accent="border-muted" />
          </CardContent>
        </Card>

        {account.personas.length > 0 && (
          <Card className="border-2 border-[hsl(355,85%,45%)]/50 shadow-lg">
            <CardHeader>
              <CardTitle className="text-foreground">Audience Groups</CardTitle>
              <CardDescription>Focus personas and the themes that resonated in discovery. Click to explore details.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Badge className="bg-[hsl(355,85%,45%)]/10 text-[hsl(355,85%,45%)] border-[hsl(355,85%,45%)]/40">
                Persona focus
              </Badge>
              <div className="flex flex-wrap gap-3">
                {account.personas.map((persona, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedPersona(selectedPersona === persona ? null : persona)}
                    className={`px-3 py-1 rounded-full text-sm border transition-all duration-200 ${
                      selectedPersona === persona
                        ? "bg-[hsl(355,85%,45%)] text-white border-[hsl(355,85%,45%)] shadow-md"
                        : "bg-white text-foreground border-[hsl(355,85%,45%)]/40 hover:bg-[hsl(355,85%,45%)]/10 hover:border-[hsl(355,85%,45%)]"
                    }`}
                  >
                    {persona}
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {selectedPersona && (
          <Card className="border-2 border-[hsl(45,100%,50%)]/60 shadow-lg">
            <CardHeader>
              <CardTitle className="text-foreground">{selectedPersona} Persona</CardTitle>
              <CardDescription>
                {personaDocument
                  ? "Rendered from the approved persona document for this account."
                  : "Persona details and characteristics based on workshop insights."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-5">
              {personaDocument ? (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="p-4 rounded-lg border border-[hsl(45,100%,50%)]/30 bg-muted/30">
                      <div className="text-xs uppercase text-muted-foreground mb-1">Title</div>
                      <div className="text-sm font-semibold text-foreground">{personaDocument.title}</div>
                    </div>
                    <div className="p-4 rounded-lg border border-[hsl(45,100%,50%)]/30 bg-muted/30">
                      <div className="text-xs uppercase text-muted-foreground mb-1">Department</div>
                      <div className="text-sm text-foreground">{personaDocument.metadata?.department ?? "—"}</div>
                    </div>
                    <div className="p-4 rounded-lg border border-[hsl(45,100%,50%)]/30 bg-muted/30">
                      <div className="text-xs uppercase text-muted-foreground mb-1">Region</div>
                      <div className="text-sm text-foreground">{personaDocument.metadata?.region ?? "—"}</div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-3">
                      <div className="text-sm font-semibold text-foreground">Role</div>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {personaDocument.coreUnderstanding?.core?.role ?? "—"}
                      </p>
                    </div>
                    <div className="space-y-3">
                      <div className="text-sm font-semibold text-foreground">Primary Goal</div>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {personaDocument.coreUnderstanding?.core?.userGoalStatement ?? "—"}
                      </p>
                    </div>
                  </div>

                  {personaDocument.coreUnderstanding?.responsibilities?.items && (
                    <div>
                      <div className="text-sm font-semibold text-foreground mb-2">Key Responsibilities</div>
                      <ul className="space-y-2">
                        {personaDocument.coreUnderstanding.responsibilities.items.map((item, idx) => (
                          <li key={idx} className="text-sm text-muted-foreground leading-relaxed">
                            <span className="font-medium text-foreground">{item.Category}:</span> {item.Description}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {personaDocument.strategicValuePoints?.motivations?.items && (
                    <div>
                      <div className="text-sm font-semibold text-foreground mb-2">Motivations</div>
                      <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {personaDocument.strategicValuePoints.motivations.items.map((item, idx) => (
                          <li key={idx} className="text-sm text-muted-foreground leading-relaxed">{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {personaDocument.strategicValuePoints?.needs?.items && (
                    <div>
                      <div className="text-sm font-semibold text-foreground mb-2">Needs</div>
                      <ul className="space-y-2">
                        {personaDocument.strategicValuePoints.needs.items.map((item, idx) => (
                          <li key={idx} className="text-sm text-muted-foreground leading-relaxed">
                            <span className="font-medium text-foreground">{item.Category}:</span> {item.Description}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {personaDocument.painPointsAndChallenges?.frustrations?.items && (
                    <div>
                      <div className="text-sm font-semibold text-foreground mb-2">Frustrations</div>
                      <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                        {personaDocument.painPointsAndChallenges.frustrations.items.map((item, idx) => (
                          <li key={idx} className="text-sm text-muted-foreground leading-relaxed">{item}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center py-8">
                  <div className="text-muted-foreground mb-2">
                    {selectedPersona} persona details are being prepared.
                  </div>
                  <div className="text-sm text-muted-foreground">
                    This persona will be populated with detailed insights from workshop data and intelligence reports.
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {account.topPriorities.length > 0 && (
          <Card className="border-2 border-muted/70 shadow-md">
            <CardHeader>
              <CardTitle className="text-foreground">Top Priorities</CardTitle>
              <CardDescription>What stakeholders expect DHL to solve.</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-3">
                {account.topPriorities.map((item, index) => (
                  <li key={index} className="flex items-start gap-3">
                    <CheckCircle2 className="h-4 w-4 text-[hsl(45,100%,50%)] mt-1 flex-shrink-0" />
                    <span className="text-sm leading-relaxed text-foreground">{item}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        {account.additionalThemes.length > 0 && (
          <Card className="border border-muted bg-muted/20">
            <CardHeader>
              <CardTitle className="text-sm font-semibold text-muted-foreground uppercase">Supporting themes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-2">
                {account.additionalThemes.map((theme, index) => (
                  <Badge key={index} variant="outline" className="text-xs border-[hsl(45,100%,50%)]/30">
                    {theme}
                  </Badge>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </TabsContent>

      <TabsContent value="chatbot">
        <Card className="border-2 border-[hsl(45,100%,50%)] shadow-lg">
          <CardHeader className="bg-[hsl(45,100%,50%)]/10">
            <CardTitle className="flex items-center gap-2 text-foreground">
              <MessageSquare className="h-5 w-5 text-[hsl(45,100%,50%)]" />
              Magnus AI Assistant
            </CardTitle>
            <CardDescription>
              Ask questions about priorities, stakeholders, differentiators, or market context. Responses reference the
              curated data shown in the other tabs.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              ref={chatContainerRef}
              className="h-80 overflow-y-auto rounded border border-muted bg-background/80 p-4 space-y-4"
              aria-live="polite"
            >
              {chatMessages.map((message, index) => (
                <div
                  key={index}
                  className={`flex ${message.role === "assistant" ? "justify-start" : "justify-end"}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg px-4 py-3 text-sm leading-relaxed ${
                      message.role === "assistant"
                        ? "bg-[hsl(45,100%,50%)]/10 text-foreground"
                        : "bg-[hsl(355,85%,45%)] text-white"
                    }`}
                  >
                     {message.role === "assistant" ? (
                       <div className="prose prose-sm max-w-none prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-code:text-foreground prose-pre:bg-muted prose-pre:text-foreground">
                         <ReactMarkdown
                           remarkPlugins={[remarkGfm]}
                           rehypePlugins={[rehypeHighlight]}
                         >
                           {message.content}
                         </ReactMarkdown>
                       </div>
                     ) : (
                       message.content
                     )}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex flex-col gap-2">
              <div className="flex gap-2">
                <Input
                  placeholder={`Ask about ${account.name}'s priorities, stakeholders, or differentiators`}
                  value={inputMessage}
                  onChange={(event) => setInputMessage(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === "Enter" && !event.shiftKey) {
                      event.preventDefault()
                      handleSendMessage()
                    }
                  }}
                  disabled={isStreaming}
                />
                <Button
                  type="button"
                  onClick={handleSendMessage}
                  variant="default"
                  disabled={isStreaming || !inputMessage.trim()}
                  className="bg-[hsl(355,85%,45%)] hover:bg-[hsl(355,85%,40%)] disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <Send className="h-4 w-4 mr-2" />
                  {isStreaming ? "Working..." : "Send"}
                </Button>
              </div>
              {errorMessage && <p className="text-sm text-[hsl(355,85%,45%)]">⚠️ {errorMessage}</p>}
            </div>
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  )
}

function StrategyColumn({ title, items, highlight }: { title: string; items: string[]; highlight?: boolean }) {
  if (items.length === 0) return null
  return (
    <div
      className={`space-y-3 p-4 rounded-lg border ${
        highlight ? "border-[hsl(355,85%,45%)]/40 bg-[hsl(355,85%,45%)]/5" : "border-[hsl(45,100%,50%)]/30 bg-[hsl(45,100%,50%)]/5"
      }`}
    >
      <div className="text-sm font-semibold text-foreground">{title}</div>
      <ul className="space-y-2">
        {items.map((item, index) => (
          <li key={index} className="text-xs text-muted-foreground leading-relaxed">
            {item}
          </li>
        ))}
      </ul>
    </div>
  )
}

function BulletSection({ title, items, iconColor }: { title: string; items: string[]; iconColor: string }) {
  if (items.length === 0) return null
  return (
    <div>
      <div className="text-sm font-semibold text-foreground mb-2">{title}</div>
      <ul className="space-y-2">
        {items.map((item, index) => (
          <li key={index} className="flex items-start gap-3">
            <CheckCircle2 className={`h-4 w-4 mt-1 flex-shrink-0 ${iconColor}`} />
            <span className="text-sm leading-relaxed text-muted-foreground">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  )
}

function PersonaColumn({ title, entries, accent }: { title: string; entries: string[]; accent: string }) {
  return (
    <div className={`p-4 rounded-lg border ${accent} bg-muted/30 space-y-3`}>
      <div className="text-sm font-semibold text-foreground">{title}</div>
      {entries.length > 0 ? (
        <ul className="space-y-2">
          {entries.map((entry, index) => (
            <li key={index} className="text-sm text-muted-foreground leading-relaxed">
              {entry}
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted-foreground">To be validated.</p>
      )}
    </div>
  )
}
