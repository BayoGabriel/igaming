import { type NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth"
import { getCurrentSession, completeExpiredSessions } from "@/lib/game"

export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get("authorization")
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json({ message: "No token provided" }, { status: 401 })
    }

    const token = authHeader.substring(7)
    const decoded = verifyToken(token)

    if (!decoded) {
      return NextResponse.json({ message: "Invalid token" }, { status: 401 })
    }

    await completeExpiredSessions()

    const session = await getCurrentSession()
    console.log("Fetched current session:", session ? session._id : "none") 

    if (!session) {
      return NextResponse.json(null)
    }

    const sessionResponse = {
      _id: session._id?.toString(),
      startTime: session.startTime.toISOString(),
      endTime: session.endTime.toISOString(),
      status: session.status,
      players: session.players,
      winningNumber: session.winningNumber,
      maxPlayers: session.maxPlayers,
    }

    console.log("Returning session:", sessionResponse) 
    return NextResponse.json(sessionResponse)
  } catch (error) {
    console.error("Get current session error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
