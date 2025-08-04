import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { verifyToken } from "@/lib/auth"
import { type GameSession, type SessionWithWinners, COLLECTIONS } from "@/lib/models"

interface DateFilter {
  startTime?: { $gte: Date }
}

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

    const { searchParams } = new URL(request.url)
    const filter = searchParams.get("filter") || "all"

    const db = await getDatabase()

    let dateFilter: DateFilter = {}
    const now = new Date()

    switch (filter) {
      case "day":
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        dateFilter = { startTime: { $gte: startOfDay } }
        break
      case "week":
        const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        dateFilter = { startTime: { $gte: startOfWeek } }
        break
      case "month":
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        dateFilter = { startTime: { $gte: startOfMonth } }
        break
      default:
        dateFilter = {}
    }

    const pipeline = [
      {
        $match: {
          status: "completed",
          ...dateFilter,
        },
      },
      {
        $addFields: {
          winners: {
            $map: {
              input: {
                $filter: {
                  input: "$players",
                  cond: { $eq: ["$$this.selectedNumber", "$winningNumber"] },
                },
              },
              as: "winner",
              in: "$$winner.username",
            },
          },
        },
      },
      {
        $sort: { startTime: -1 },
      },
      {
        $limit: 50,
      },
    ]

    const sessions = await db
      .collection<GameSession>(COLLECTIONS.GAME_SESSIONS)
      .aggregate<SessionWithWinners>(pipeline)
      .toArray()
    return NextResponse.json(sessions)
  } catch (error) {
    console.error("Sessions error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
