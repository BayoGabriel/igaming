import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { verifyToken } from "@/lib/auth"
import { getCurrentSession, createGameSession, joinSession, completeExpiredSessions } from "@/lib/game"
import { ObjectId } from "mongodb"
import { type User, COLLECTIONS } from "@/lib/models"

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

    const db = await getDatabase()
    const user = await db.collection<User>(COLLECTIONS.USERS).findOne({
      _id: new ObjectId(decoded.userId),
    })

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 })
    }

    await completeExpiredSessions()

    let session = await getCurrentSession()
    if (session && session.status === "active") {
      const userInSession = session.players.find((p) => p.userId === decoded.userId)
      if (userInSession) {
        return NextResponse.json({ message: "Already in session" })
      }
    }

    if (!session || session.status !== "active") {
      session = await createGameSession(decoded.userId, user.username)
    } else {
      const joined = await joinSession(session._id!, decoded.userId, user.username)
      if (!joined) {
        return NextResponse.json({ message: "Failed to join session. It may be full or expired." }, { status: 400 })
      }
    }

    return NextResponse.json({ message: "Joined session successfully" })
  } catch (error) {
    console.error("Join session error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
