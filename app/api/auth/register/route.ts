import { type NextRequest, NextResponse } from "next/server"
import { getDatabase } from "@/lib/mongodb"
import { generateToken } from "@/lib/auth"
import { type User, COLLECTIONS } from "@/lib/models"

export async function POST(request: NextRequest) {
  try {
    const { username } = await request.json()

    if (!username || username.trim().length < 2) {
      return NextResponse.json({ message: "Username must be at least 2 characters long" }, { status: 400 })
    }

    const db = await getDatabase()

    const existingUser = await db.collection<User>(COLLECTIONS.USERS).findOne({
      username: username.trim(),
    })

    if (existingUser) {
      return NextResponse.json({ message: "Username already exists" }, { status: 400 })
    }

    const user: Omit<User, "_id"> = {
      username: username.trim(),
      wins: 0,
      createdAt: new Date(),
    }

    const result = await db.collection<User>(COLLECTIONS.USERS).insertOne(user)
    const token = generateToken(result.insertedId.toString())

    return NextResponse.json({
      token,
      user: {
        id: result.insertedId.toString(),
        username: user.username,
        wins: user.wins,
      },
    })
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
