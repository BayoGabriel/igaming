import { type NextRequest, NextResponse } from "next/server"
import { verifyToken } from "@/lib/auth"
import { getCurrentSession, selectNumber } from "@/lib/game"

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

    const { number } = await request.json()

    if (!number || number < 1 || number > 9) {
      return NextResponse.json({ message: "Number must be between 1 and 9" }, { status: 400 })
    }

    const session = await getCurrentSession()

    if (!session || session.status !== "active") {
      return NextResponse.json({ message: "No active session" }, { status: 400 })
    }

    const userInSession = session.players.find((p) => p.userId === decoded.userId)
    if (!userInSession) {
      return NextResponse.json({ message: "You are not in this session" }, { status: 400 })
    }

    if (userInSession.selectedNumber !== undefined) {
      return NextResponse.json({ message: "You have already selected a number" }, { status: 400 })
    }

    const selected = await selectNumber(session._id!, decoded.userId, number)

    if (!selected) {
      return NextResponse.json({ message: "Failed to select number" }, { status: 400 })
    }

    return NextResponse.json({ message: "Number selected successfully" })
  } catch (error) {
    console.error("Select number error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
