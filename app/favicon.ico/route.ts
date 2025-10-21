import { NextResponse } from "next/server"

export function GET(request: Request) {
  const url = new URL("/favicon.svg", request.url)
  return NextResponse.redirect(url, 308)
}


