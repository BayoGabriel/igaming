import type { ObjectId } from "mongodb"

export interface User {
  _id?: ObjectId
  username: string
  wins: number
  createdAt: Date
}

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

export interface LeaderboardEntry {
  _id: string
  username: string
  wins: number
}

export interface SessionWithWinners extends GameSession {
  winners: string[]
}

// Type guards
export function isUser(obj: unknown): obj is User {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "username" in obj &&
    "wins" in obj &&
    typeof (obj as User).username === "string" &&
    typeof (obj as User).wins === "number"
  )
}

export function isGameSession(obj: unknown): obj is GameSession {
  return (
    typeof obj === "object" &&
    obj !== null &&
    "status" in obj &&
    "players" in obj &&
    Array.isArray((obj as GameSession).players)
  )
}

// Database collection names
export const COLLECTIONS = {
  USERS: "users",
  GAME_SESSIONS: "gameSessions",
} as const
