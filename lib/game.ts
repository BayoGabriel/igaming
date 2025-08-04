import { getDatabase } from "./mongodb"
import { ObjectId, type WithId } from "mongodb"

export interface Player {
  userId: string
  username: string
  selectedNumber?: number
  isStarter: boolean
}

export interface GameSession {
  _id?: ObjectId
  startTime: Date
  endTime: Date
  status: "active" | "completed"
  players: Player[]
  winningNumber?: number
  maxPlayers: number
}

export interface User {
  _id?: ObjectId
  username: string
  wins: number
  createdAt: Date
}

export async function createGameSession(starterId: string, starterUsername: string): Promise<WithId<GameSession>> {
  const db = await getDatabase()
  const maxPlayers = Number.parseInt(process.env.MAX_PLAYERS_PER_SESSION || "10")
  const sessionDuration = Number.parseInt(process.env.SESSION_DURATION || "20000")

  const session: Omit<GameSession, "_id"> = {
    startTime: new Date(),
    endTime: new Date(Date.now() + sessionDuration),
    status: "active",
    players: [
      {
        userId: starterId,
        username: starterUsername,
        isStarter: true,
      },
    ],
    maxPlayers,
  }

  const result = await db.collection<GameSession>("gameSessions").insertOne(session)
  return { ...session, _id: result.insertedId }
}

export async function getCurrentSession(): Promise<WithId<GameSession> | null> {
  const db = await getDatabase()

  let session = await db.collection<GameSession>("gameSessions").findOne({
    status: "active",
    endTime: { $gt: new Date() },
  })

  if (session) {
    return session
  }

  session = await db.collection<GameSession>("gameSessions").findOne({
    status: "completed",
    endTime: { $gt: new Date(Date.now() - 5000) },
  })

  return session
}

export async function joinSession(sessionId: ObjectId, userId: string, username: string): Promise<boolean> {
  const db = await getDatabase()

  const session = await db.collection<GameSession>("gameSessions").findOne({
    _id: sessionId,
    status: "active",
    endTime: { $gt: new Date() },
  })

  if (!session) {
    return false
  }

  if (session.players.length >= session.maxPlayers) {
    return false
  }

  if (session.players.some((p) => p.userId === userId)) {
    return true
  }

  const newPlayer: Player = {
    userId,
    username,
    isStarter: false,
  }

  await db.collection<GameSession>("gameSessions").updateOne(
    { _id: sessionId },
    {
      $push: {
        players: newPlayer,
      },
    },
  )

  return true
}

export async function leaveSession(sessionId: ObjectId, userId: string): Promise<boolean> {
  const db = await getDatabase()

  const result = await db.collection<GameSession>("gameSessions").updateOne(
    {
      _id: sessionId,
      status: "active",
      endTime: { $gt: new Date() },
    },
    {
      $pull: {
        players: { userId } as Record<string, unknown>,
      },
    },
  )

  return result.modifiedCount > 0
}

export async function selectNumber(sessionId: ObjectId, userId: string, number: number): Promise<boolean> {
  const db = await getDatabase()

  const result = await db.collection<GameSession>("gameSessions").updateOne(
    {
      _id: sessionId,
      status: "active",
      endTime: { $gt: new Date() },
      "players.userId": userId,
    },
    {
      $set: {
        "players.$.selectedNumber": number,
      },
    },
  )

  return result.modifiedCount > 0
}

export async function completeExpiredSessions(): Promise<void> {
  const db = await getDatabase()

  const expiredSessions = await db
    .collection<GameSession>("gameSessions")
    .find({
      status: "active",
      endTime: { $lte: new Date() },
    })
    .toArray()

  for (const session of expiredSessions) {
    const winningNumber = Math.floor(Math.random() * 9) + 1
    const winners = session.players.filter((p) => p.selectedNumber === winningNumber)

    await db.collection<GameSession>("gameSessions").updateOne(
      { _id: session._id },
      {
        $set: {
          status: "completed",
          winningNumber,
        },
      },
    )

    for (const winner of winners) {
      await db.collection<User>("users").updateOne({ _id: new ObjectId(winner.userId) }, { $inc: { wins: 1 } })
    }
  }
}
