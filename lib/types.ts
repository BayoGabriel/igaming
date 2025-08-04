export interface User {
    id: string
    username: string
    wins: number
  }
  
  export interface Player {
    userId: string
    username: string
    selectedNumber?: number
    isStarter: boolean
  }
  
  export interface GameSession {
    _id: string
    startTime: string
    endTime: string
    status: "active" | "completed"
    players: Player[]
    winningNumber?: number
    maxPlayers: number
  }
  
  export interface GameResult extends GameSession {
    status: "completed"
    winningNumber: number
  }
  
  export interface ApiError {
    message: string
  }
  
  export interface LeaderboardEntry {
    _id: string
    username: string
    wins: number
  }
  
  export interface SessionWithWinners extends GameSession {
    winners: string[]
  }
  