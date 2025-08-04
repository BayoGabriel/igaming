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

export function isUser(obj: any): obj is User {
  return obj && typeof obj.username === "string" && typeof obj.wins === "number"
}

export function isGameSession(obj: any): obj is GameSession {
  return obj && obj.status && Array.isArray(obj.players)
}

export const COLLECTIONS = {
  USERS: "users",
  GAME_SESSIONS: "gameSessions",
} as const
