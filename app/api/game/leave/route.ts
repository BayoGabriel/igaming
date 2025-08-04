import { type NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth"
import { getCurrentSession, leaveSession } from "@/lib/game"

export async function POST(request: NextRequest) {
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

    const session = await getCurrentSession()

    if (!session || session.status !== "active") {
      return NextResponse.json({ message: "No active session to leave" }, { status: 400 })
    }

    const userInSession = session.players.find((p) => p.userId === decoded.userId)
    if (!userInSession) {
      return NextResponse.json({ message: "You are not in this session" }, { status: 400 })
    }

    const left = await leaveSession(session._id!, decoded.userId)

    if (!left) {
      return NextResponse.json({ message: "Failed to leave session" }, { status: 400 })
    }

    return NextResponse.json({ message: "Left session successfully" })
  } catch (error) {
    console.error("Leave session error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
