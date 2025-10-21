import { NextResponse } from "next/server"
import OpenAI from "openai"
import { getAccountById } from "@/lib/account-data"

const VECTOR_STORE_ENV_MAP: Record<string, string> = {
  "ag-barr": "AGB_VS",
  "saint-gobain": "SG_VS",
  "msd": "TMC_VS",
}

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

type MessagePayload = {
  role: "user" | "assistant"
  content: string
}

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const accountId: string | undefined = body.accountId
    const messages: MessagePayload[] | undefined = body.messages

    if (!accountId || !Array.isArray(messages)) {
      return NextResponse.json({ error: "accountId and messages are required" }, { status: 400 })
    }

    const envVar = VECTOR_STORE_ENV_MAP[accountId]
    const vectorStoreId = envVar ? process.env[envVar] : undefined

    if (!vectorStoreId) {
      return NextResponse.json({ error: `Vector store ID not configured for ${accountId}` }, { status: 400 })
    }

    const account = getAccountById(accountId)
    if (!account) {
      return NextResponse.json({ error: `Unknown account ${accountId}` }, { status: 404 })
    }

    const systemPrompt = [
      `You are Magnus AI, the DHL Golden Ticket assistant for ${account.name}.`,
      "Use the provided file search tool to ground every answer in the uploaded workshop summaries, alignment decks, and intelligence reports.",
      "Give concise, executive-friendly answers. Reference the source slide or document when useful.",
    ].join(" ")

    const formattedInput = [
      { role: "system" as const, content: systemPrompt, type: "message" as const },
      ...messages.map((message) => ({
        role: message.role,
        content: message.content,
        type: "message" as const,
      })),
    ]

    const stream = await client.responses.stream({
      model: "gpt-4.1-mini",
      input: formattedInput,
      temperature: 0.2,
      tools: [
        {
          type: "file_search",
          vector_store_ids: [vectorStoreId],
        },
      ],
    })

    const encoder = new TextEncoder()

    const readableStream = new ReadableStream({
      start(controller) {
        const send = (payload: unknown) => {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(payload)}\n\n`))
        }

        const closeStream = () => {
          controller.enqueue(encoder.encode("data: [DONE]\n\n"))
          controller.close()
        }

        stream.on("response.output_text.delta", (event) => {
          send({ type: event.type, delta: event.delta })
        })

        stream.on("response.output_text.done", () => {
          send({ type: "response.output_text.done" })
        })

        stream.on("response.completed", () => {
          send({ type: "response.completed" })
          closeStream()
        })

        stream.on("error", (error) => {
          send({ type: "response.error", error: { message: error.message ?? "Assistant error" } })
          closeStream()
        })

        stream.on("abort", () => {
          send({ type: "response.aborted" })
          closeStream()
        })

        stream.on("end", () => {
          closeStream()
        })
      },
      cancel() {
        stream.abort()
      },
    })

    return new Response(readableStream, {
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-cache, no-transform",
        Connection: "keep-alive",
      },
    })
  } catch (error) {
    console.error("Chat route error:", error)
    return NextResponse.json({ error: "Failed to contact assistant" }, { status: 500 })
  }
}
