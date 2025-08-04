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

    // Complete any expired sessions first
    await completeExpiredSessions()

    const session = await getCurrentSession()

    if (!session) {
      return NextResponse.json(null)
    }

    return NextResponse.json({
      _id: session._id?.toString(),
      startTime: session.startTime,
      endTime: session.endTime,
      status: session.status,
      players: session.players,
      winningNumber: session.winningNumber,
      maxPlayers: session.maxPlayers,
    })
  } catch (error) {
    console.error("Get current session error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
