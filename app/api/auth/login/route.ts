import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { generateToken } from "@/lib/auth"
import { getCurrentSession } from "@/lib/game"
import { type User, COLLECTIONS } from "@/lib/models"

export async function POST(request: NextRequest) {
  try {
    const { username } = await request.json()

    if (!username || username.trim().length < 2) {
      return NextResponse.json({ message: "Username must be at least 2 characters long" }, { status: 400 })
    }

    const db = await getDatabase()

    const user = await db.collection<User>(COLLECTIONS.USERS).findOne({
      username: username.trim(),
    })

    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 })
    }

    const currentSession = await getCurrentSession()
    if (currentSession && currentSession.status === "active") {
      const userInSession = currentSession.players.find((p) => p.userId === user._id!.toString())
      if (userInSession) {
        return NextResponse.json(
          { message: "You already have an active session. Please wait for it to complete." },
          { status: 400 },
        )
      }
    }

    const token = generateToken(user._id!.toString())

    return NextResponse.json({
      token,
      user: {
        id: user._id!.toString(),
        username: user.username,
        wins: user.wins,
      },
    })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
