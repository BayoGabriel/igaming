import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { verifyToken } from "@/lib/auth"
import { type User, type GameSession, type LeaderboardEntry, COLLECTIONS } from "@/lib/models"

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

    let dateFilter = {}
    const now = new Date()

    switch (filter) {
      case "day":
        const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
        dateFilter = { createdAt: { $gte: startOfDay } }
        break
      case "week":
        const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
        dateFilter = { createdAt: { $gte: startOfWeek } }
        break
      case "month":
        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
        dateFilter = { createdAt: { $gte: startOfMonth } }
        break
      default:
        dateFilter = {}
    }

    if (filter === "all") {
      const leaderboard = await db
        .collection<User>(COLLECTIONS.USERS)
        .find({ wins: { $gt: 0 } })
        .sort({ wins: -1 })
        .limit(10)
        .toArray()

      return NextResponse.json(leaderboard)
    } else {
      const pipeline = [
        {
          $match: {
            status: "completed",
            endTime: dateFilter.createdAt || { $exists: true },
          },
        },
        {
          $unwind: "$players",
        },
        {
          $match: {
            $expr: {
              $eq: ["$players.selectedNumber", "$winningNumber"],
            },
          },
        },
        {
          $group: {
            _id: "$players.userId",
            username: { $first: "$players.username" },
            wins: { $sum: 1 },
          },
        },
        {
          $sort: { wins: -1 },
        },
        {
          $limit: 10,
        },
      ]

      const leaderboard = await db
        .collection<GameSession>(COLLECTIONS.GAME_SESSIONS)
        .aggregate<LeaderboardEntry>(pipeline)
        .toArray()
      return NextResponse.json(leaderboard)
    }
  } catch (error) {
    console.error("Leaderboard error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
