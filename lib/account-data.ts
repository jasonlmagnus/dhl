import fs from "fs"
import path from "path"

const DATA_ROOT = path.join(process.cwd(), "data")

type SuccessSignal = { signal: string; evidence?: string }

export interface AccountRecord {
  id: string
  name: string
  logo: string
  opportunity: {
    display: string
    valueMillions?: number
    currency?: "GBP" | "EUR"
  }
  sector: string
  region: string
  status: string
  description: string
  incumbent?: string
  contractExpiry?: string
  readinessScore?: number
  summary: {
    narrative: string[]
    accountContext: string[]
    keyChallenges: string[]
    knowledgeGaps: string[]
  }
  ambition: {
    statement: string[]
    howWeGetThere: string[]
  }
  acceleratorObjective?: string
  valueToDHL: string[]
  nearTermPriorities: string[]
  successSignals: SuccessSignal[]
  voiceOfCustomer: string[]
  decisionUnit: {
    decisionMakers: string[]
    influencers: string[]
    community: string[]
  }
  personas: string[]
  topPriorities: string[]
  additionalThemes: string[]
  differentiators: string[]
  valueFocus: string[]
  keyTakeaways: string[]
  // Optional rich persona data loaded from dedicated JSON documents
  supplyChainPersona?: SupplyChainPersona
  cfoPersona?: SupplyChainPersona
  // Optional structured value proposition content
  valueProp?: ValuePropContent
}

interface AccountConfig {
  id: string
  name: string
  folder: string
  logo: string
  opportunity: {
    display: string
    valueMillions?: number
    currency?: "GBP" | "EUR"
  }
  sector: string
  region: string
  status: string
  description: string
  incumbent?: string
  contractExpiry?: string
  readinessScore?: number
}

const ACCOUNT_CATALOG: AccountConfig[] = [
  {
    id: "ag-barr",
    name: "AG Barr",
    folder: "AG Barr",
    logo: "/ag_barr_colour.png",
    opportunity: { display: "£40m", valueMillions: 40, currency: "GBP" },
    sector: "FMCG",
    region: "UK",
    status: "Active",
    description: "Soft drinks leader seeking scalable warehousing, green transport, and trusted partnership.",
    incumbent: "Culina (Great Bear)",
    contractExpiry: "2027",
    readinessScore: 85,
  },
  {
    id: "saint-gobain",
    name: "Saint-Gobain",
    folder: "St Gobain",
    logo: "/Saint-Gobain_logo.png",
    opportunity: { display: "£100m+", valueMillions: 100, currency: "GBP" },
    sector: "Building Materials",
    region: "UK & Europe",
    status: "Active",
    description: "Global construction materials group building a 10-year logistics transformation programme.",
    incumbent: "GXO",
    contractExpiry: "2027 (target DC go-live)",
    readinessScore: 78,
  },
  {
    id: "msd",
    name: "MSD",
    folder: "TMC",
    logo: "/msd.svg",
    opportunity: { display: "€38m", valueMillions: 33, currency: "GBP" },
    sector: "Life Sciences",
    region: "UK & Ireland",
    status: "Active",
    description: "Pharma innovator consolidating human and animal health logistics with automation-first solutions.",
    incumbent: "Alloga",
    contractExpiry: "2026/27",
    readinessScore: 82,
  },
]

type WorkshopSummary = {
  voiceOfCustomer: string[]
  decisionUnit: {
    decisionMakers: string[]
    influencers: string[]
    community: string[]
  }
  personas: string[]
  topPriorities: string[]
  additionalThemes: string[]
  differentiators: string[]
  valueFocus: string[]
}

type AlignmentDeck = {
  narrative: string[]
  accountContext: string[]
  keyChallenges: string[]
  knowledgeGaps: string[]
  ambitionStatement: string[]
  ambitionHow: string[]
  acceleratorObjective?: string
  valueToDHL: string[]
  nearTermPriorities: string[]
  successSignals: SuccessSignal[]
}

// Minimal shape for the Supply Chain persona we render
export interface SupplyChainPersona {
  id: string
  title: string
  metadata?: {
    version?: string
    department?: string
    region?: string
    lastUpdated?: string
  }
  coreUnderstanding?: {
    core?: {
      role?: string
      userGoalStatement?: string
      coreBelief?: string
    }
    responsibilities?: {
      items?: Array<{ Category: string; Description: string }>
    }
  }
  strategicValuePoints?: {
    motivations?: { items?: string[] }
    needs?: { items?: Array<{ Category: string; Description: string }> }
  }
  painPointsAndChallenges?: {
    frustrations?: { items?: string[] }
  }
}

export interface ValuePropContent {
  statement: string[]
  statementSource?: string
  subMessages: Array<{
    title: string
    bullets: string[]
    source?: string
  }>
  personaResonance: Array<{
    persona: string
    priorities: string[]
    resonance: string
    source?: string
  }>
}

type IntelligenceReport = {
  keyTakeaways: string[]
}

let accountCache: AccountRecord[] | null = null

export function getAccounts(): AccountRecord[] {
  if (!accountCache) {
    accountCache = ACCOUNT_CATALOG.map(buildAccountRecord)
  }
  return accountCache
}

export function getAccountById(id: string): AccountRecord | undefined {
  return getAccounts().find((account) => account.id === id)
}

function buildAccountRecord(config: AccountConfig): AccountRecord {
  const baseDir = path.join(DATA_ROOT, config.folder, "json")

  const workshop = loadWorkshopSummary(baseDir)
  const alignment = loadAlignmentDeck(baseDir)
  const intelligence = loadIntelligenceReport(baseDir)

  // Optionally load rich persona JSONs if present (AG Barr Supply Chain for now)
  const supplyChainPersona = loadPersonaDocument(baseDir, "supply_chain_persona.json")
  const cfoPersona = loadPersonaDocument(baseDir, "cfo_coo_persona.json")
  const valueProp = loadValueProp(baseDir)

  return {
    id: config.id,
    name: config.name,
    logo: config.logo,
    opportunity: config.opportunity,
    sector: config.sector,
    region: config.region,
    status: config.status,
    description: config.description,
    incumbent: config.incumbent,
    contractExpiry: config.contractExpiry,
    readinessScore: config.readinessScore,
    summary: {
      narrative: alignment.narrative,
      accountContext: alignment.accountContext,
      keyChallenges: alignment.keyChallenges,
      knowledgeGaps: alignment.knowledgeGaps,
    },
    ambition: {
      statement: alignment.ambitionStatement,
      howWeGetThere: alignment.ambitionHow,
    },
    acceleratorObjective: alignment.acceleratorObjective,
    valueToDHL: alignment.valueToDHL,
    nearTermPriorities: alignment.nearTermPriorities,
    successSignals: alignment.successSignals,
    voiceOfCustomer: workshop.voiceOfCustomer,
    decisionUnit: workshop.decisionUnit,
    personas: workshop.personas,
    topPriorities: workshop.topPriorities,
    additionalThemes: workshop.additionalThemes,
    differentiators: workshop.differentiators,
    valueFocus: workshop.valueFocus,
    keyTakeaways: intelligence.keyTakeaways,
    supplyChainPersona,
    cfoPersona,
    valueProp,
  }
}

function loadWorkshopSummary(baseDir: string): WorkshopSummary {
  const file = findFirst(baseDir, "Workshop Summary")
  if (!file) {
    return {
      voiceOfCustomer: [],
      decisionUnit: { decisionMakers: [], influencers: [], community: [] },
      personas: [],
      topPriorities: [],
      additionalThemes: [],
      differentiators: [],
      valueFocus: [],
    }
  }

  const raw = readJson<{ paragraphs: string[] }>(file)
  const lines = normaliseLines(raw.paragraphs)

  const voiceStart = findIndex(lines, (line) => line.toLowerCase().includes("your voice of the customer"))
  const decisionIndex = findIndex(lines, (line) => line.toLowerCase().startsWith("defining the decision"))
  const voiceOfCustomer = slice(lines, voiceStart + 1, decisionIndex)
    .filter((line) => !/key themes/i.test(line))
    .map(cleanTrailingPunctuation)

  const decisionMakers = collectDelimitedSection(lines, "decisions makers")
  const influencers = collectDelimitedSection(lines, "wider influencers")
  const community = collectDelimitedSection(lines, "wider community")

  const personasStart = findIndex(lines, (line) => /^themes$/i.test(line))
  const topPrioritiesIndex = findIndex(lines, (line) => /top 3 priorities/i.test(line))
  const personas = slice(lines, personasStart + 1, topPrioritiesIndex)
    .filter((line) => line && !/^themes$/i.test(line))
    .map(cleanTrailingPunctuation)

  const additionalThemesIndex = findIndex(lines, (line) => /all other themes/i.test(line))
  const topPriorities = slice(lines, topPrioritiesIndex + 1, additionalThemesIndex).map(cleanTrailingPunctuation)

  const differentiatorsIndex = findIndex(lines, (line) => /defining our points of difference/i.test(line))
  const differentiators = slice(lines, additionalThemesIndex + 1, differentiatorsIndex).map(cleanTrailingPunctuation)

  const valueSummaryIndex = findIndex(lines, (line) =>
    /summary of key areas identified for exploration in the value proposition/i.test(line),
  )
  const valueFocus = valueSummaryIndex === -1 ? [] : slice(lines, valueSummaryIndex + 1).map(cleanTrailingPunctuation)

  const additionalThemes =
    differentiatorsIndex === -1 || valueSummaryIndex === -1
      ? []
      : slice(lines, differentiatorsIndex + 1, valueSummaryIndex).map(cleanTrailingPunctuation)

  return {
    voiceOfCustomer,
    decisionUnit: {
      decisionMakers,
      influencers,
      community,
    },
    personas,
    topPriorities,
    additionalThemes,
    differentiators,
    valueFocus,
  }
}

function loadAlignmentDeck(baseDir: string): AlignmentDeck {
  const file = findFirst(baseDir, "Alignment WS Deck")
  if (!file) {
    return {
      narrative: [],
      accountContext: [],
      keyChallenges: [],
      knowledgeGaps: [],
      ambitionStatement: [],
      ambitionHow: [],
      acceleratorObjective: undefined,
      valueToDHL: [],
      nearTermPriorities: [],
      successSignals: [],
    }
  }

  const raw = readJson<{ slides: Array<{ slide_number: number; text: string[] }> }>(file)
  const slides = raw.slides.map((slide) => normaliseLines(slide.text))

  const currentStateSlide = slides.find((slide) => slide.some((text) => /diagnosing the current state/i.test(text)))
  const ambitionSlide = slides.find((slide) => slide.some((text) => /dhl.?s ambition/i.test(text)))
  const objectivesSlide = slides.find((slide) => slide.some((text) => /objectives to deliver the ambition/i.test(text)))
  const successSlide = slides.find((slide) => slide.some((text) => /success signals/i.test(text)))

  const accountContext = currentStateSlide
    ? collectBetween(currentStateSlide, "account context", "key challenges").map(cleanTrailingPunctuation)
    : []
  const keyChallenges = currentStateSlide
    ? collectBetween(currentStateSlide, "key challenges", "knowledge gaps").map(cleanTrailingPunctuation)
    : []
  const knowledgeGaps = currentStateSlide
    ? collectBetween(currentStateSlide, "knowledge gaps").map(cleanTrailingPunctuation)
    : []

  const narrative = currentStateSlide ? collectBetween(currentStateSlide, "diagnosing the current state", "account context") : []

  const ambitionStatement = ambitionSlide
    ? collectBetween(ambitionSlide, "dhl", "how we get there:").map(cleanTrailingPunctuation)
    : []
  const ambitionHow = ambitionSlide ? collectBetween(ambitionSlide, "how we get there:").map(cleanTrailingPunctuation) : []

  const acceleratorObjective = objectivesSlide
    ? collectBetween(objectivesSlide, "accelerator objective", "value to dhl").join(" ")
    : undefined
  const valueToDHL = objectivesSlide
    ? collectBetween(objectivesSlide, "value to dhl", "near-term priorities").map(cleanTrailingPunctuation)
    : []
  const nearTermPriorities = objectivesSlide
    ? collectBetween(objectivesSlide, "near-term priorities").map(cleanTrailingPunctuation)
    : []

  const successSignals = successSlide ? parseSuccessSignals(successSlide) : []

  return {
    narrative,
    accountContext,
    keyChallenges,
    knowledgeGaps,
    ambitionStatement,
    ambitionHow,
    acceleratorObjective,
    valueToDHL,
    nearTermPriorities,
    successSignals,
  }
}

function loadIntelligenceReport(baseDir: string): IntelligenceReport {
  const file = findFirst(baseDir, "Intelligence Report")
  if (!file) {
    return { keyTakeaways: [] }
  }

  const raw = readJson<{ slides: Array<{ slide_number: number; text: string[] }> }>(file)
  const slides = raw.slides.map((slide) => normaliseLines(slide.text))

  const keyTakeaways: string[] = []

  slides.forEach((slide) => {
    const indexes = slide
      .map((line, idx) => ({ line, idx }))
      .filter(({ line }) => /key takeaway/i.test(line))

    indexes.forEach(({ line, idx }) => {
      if (/key takeaway:/i.test(line)) {
        keyTakeaways.push(cleanTrailingPunctuation(line.replace(/.*key takeaway[:\s-]*/i, "")))
      } else if (/overarching key takeaways/i.test(line)) {
        const windowStart = Math.max(0, idx - 4)
        const windowItems = slide.slice(windowStart, idx).filter((item) => item && !/^\d+$/.test(item))
        windowItems.forEach((item) => keyTakeaways.push(cleanTrailingPunctuation(item)))
      }
    })
  })

  const uniqueTakeaways = Array.from(new Set(keyTakeaways.filter(Boolean)))

  return { keyTakeaways: uniqueTakeaways }
}

function loadPersonaDocument(baseDir: string, fileName: string): SupplyChainPersona | undefined {
  const candidate = path.join(baseDir, fileName)
  if (!fs.existsSync(candidate)) return undefined
  try {
    return readJson<SupplyChainPersona>(candidate)
  } catch {
    return undefined
  }
}

function loadValueProp(baseDir: string): ValuePropContent | undefined {
  const candidate = path.join(baseDir, "value_proposition.json")
  if (!fs.existsSync(candidate)) return undefined
  try {
    return readJson<ValuePropContent>(candidate)
  } catch {
    return undefined
  }
}

function collectDelimitedSection(lines: string[], heading: string): string[] {
  const start = findIndex(lines, (line) => line.toLowerCase().startsWith(heading))
  if (start === -1) return []

  const collected: string[] = []
  for (let i = start + 1; i < lines.length; i++) {
    const line = lines[i]
    if (!line) continue
    if (line.includes(":") || /^themes$/i.test(line)) break
    if (/three confirmed audience groups/i.test(line)) break
    collected.push(line)
  }

  return splitList(collected.join(" "))
}

function parseSuccessSignals(lines: string[]): SuccessSignal[] {
  const cleaned = lines.filter((line) => line && !/^\d+$/.test(line))
  const start = cleaned.findIndex((line) => /success signals -/i.test(line))
  if (start === -1) return []

  const data = cleaned
    .slice(start + 1)
    .filter((line) => !/success signals/i.test(line) && !/evidence/i.test(line))

  const signals: SuccessSignal[] = []
  for (let i = 0; i < data.length; i += 2) {
    const signal = data[i]
    const evidence = data[i + 1]
    if (!signal) continue
    signals.push({
      signal: cleanTrailingPunctuation(signal),
      evidence: evidence ? cleanTrailingPunctuation(evidence) : undefined,
    })
  }
  return signals
}

function collectBetween(lines: string[], startMarker: string, endMarker?: string): string[] {
  const start = findIndex(lines, (line) => line.toLowerCase().includes(startMarker.toLowerCase()))
  if (start === -1) return []

  let end = endMarker
    ? findIndex(lines, (line, idx) => idx > start && line.toLowerCase().includes(endMarker.toLowerCase()))
    : -1
  if (end === -1) end = lines.length

  return slice(lines, start + 1, end)
}

function findFirst(dir: string, fragment: string): string | undefined {
  if (!fs.existsSync(dir)) return undefined
  const entries = fs.readdirSync(dir)
  const match = entries.find((entry) => entry.toLowerCase().includes(fragment.toLowerCase()))
  if (!match) return undefined
  return path.join(dir, match)
}

function readJson<T>(filePath: string): T {
  return JSON.parse(fs.readFileSync(filePath, "utf-8")) as T
}

function normaliseLines(lines: string[]): string[] {
  return lines
    .map((line) =>
      line
        .replace(/\u2018|\u2019/g, "'")
        .replace(/\u201c|\u201d/g, '"')
        .replace(/\u2013|\u2014/g, "-")
        .replace(/\s+/g, " ")
        .trim(),
    )
    .filter(Boolean)
}

function findIndex<T>(arr: T[], predicate: (value: T, index: number) => boolean): number {
  for (let i = 0; i < arr.length; i++) {
    if (predicate(arr[i], i)) return i
  }
  return -1
}

function slice<T>(arr: T[], start: number, end?: number): T[] {
  const safeStart = Math.max(0, start)
  const safeEnd = end === undefined ? arr.length : Math.max(safeStart, end)
  return arr.slice(safeStart, safeEnd)
}

function splitList(value: string): string[] {
  return value
    .split(/,| and | \/ |·|\u2022/)
    .map((item) => item.replace(/^\s*-\s*/, "").trim())
    .filter(Boolean)
}

function cleanTrailingPunctuation(value: string): string {
  return value.replace(/\s*[-–—]\s*$/g, "").trim()
}
