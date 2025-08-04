"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import type { User, GameSession, Player, ApiError } from "@/lib/types"

export default function HomePage() {
  const [user, setUser] = useState<User | null>(null)
  const [gameSession, setGameSession] = useState<GameSession | null>(null)
  const [timeLeft, setTimeLeft] = useState(0)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  const checkAuth = useCallback(async () => {
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        router.push("/auth")
        return
      }

      const response = await fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        const userData: User = await response.json()
        setUser(userData)
      } else {
        localStorage.removeItem("token")
        router.push("/auth")
      }
    } catch (error) {
      console.error("Auth check failed:", error)
      router.push("/auth")
    } finally {
      setLoading(false)
    }
  }, [router])

  const fetchGameSession = useCallback(async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("/api/game/current", {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        const session: GameSession | null = await response.json()
        setGameSession(session)

        if (session && session.status === "active") {
          const endTime = new Date(session.endTime).getTime()
          const now = new Date().getTime()
          const remaining = Math.max(0, Math.floor((endTime - now) / 1000))
          setTimeLeft(remaining)
        } else {
          setTimeLeft(0)
        }
      }
    } catch (error) {
      console.error("Failed to fetch game session:", error)
    }
  }, [])

  useEffect(() => {
    checkAuth()
    fetchGameSession()
    const interval = setInterval(fetchGameSession, 1000)
    return () => clearInterval(interval)
  }, [checkAuth, fetchGameSession])

  const joinSession = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("/api/game/join", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      if (response.ok) {
        router.push("/game")
      } else {
        const error: ApiError = await response.json()
        alert(error.message || "Failed to join session")
      }
    } catch (error) {
      console.error("Failed to join session:", error)
      alert("Failed to join session")
    }
  }

  const logout = () => {
    localStorage.removeItem("token")
    router.push("/auth")
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Game Lobby</h1>
          <div className="flex items-center gap-4">
            <span className="text-gray-600">Welcome, {user?.username}</span>
            <button onClick={() => router.push("/leaderboard")} className="px-4 py-2 text-blue-600 hover:text-blue-800">
              Leaderboard
            </button>
            <button onClick={logout} className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600">
              Logout
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-8 text-center">
          <h2 className="text-3xl font-bold text-gray-800 mb-6">Number Guessing Game</h2>

          {gameSession && gameSession.status === "active" ? (
            <div className="space-y-6">
              <div className="text-6xl font-bold text-blue-600">{timeLeft}</div>
              <div className="text-gray-600">seconds remaining</div>

              <div className="bg-gray-50 rounded-lg p-4">
                <div className="text-sm text-gray-600 mb-2">Current Session</div>
                <div className="text-lg font-semibold">
                  Players: {gameSession.players?.length || 0}/{process.env.NEXT_PUBLIC_MAX_PLAYERS || 10}
                </div>
                {gameSession.players?.some((p: Player) => p.isStarter) && (
                  <div className="text-sm text-green-600 mt-1">
                    Started by: {gameSession.players.find((p: Player) => p.isStarter)?.username}
                  </div>
                )}
              </div>

              {gameSession.players?.some((p: Player) => p.userId === user?.id) ? (
                <div className="space-y-4">
                  <div className="text-green-600 font-semibold">You&apos;re in this session!</div>
                  <button
                    onClick={() => router.push("/game")}
                    className="px-8 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-semibold"
                  >
                    Go to Game
                  </button>
                </div>
              ) : (
                <button
                  onClick={joinSession}
                  disabled={gameSession.players?.length >= (Number(process.env.NEXT_PUBLIC_MAX_PLAYERS) || 10)}
                  className="px-8 py-3 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:bg-gray-400 disabled:cursor-not-allowed font-semibold"
                >
                  {gameSession.players?.length >= (Number(process.env.NEXT_PUBLIC_MAX_PLAYERS) || 10)
                    ? "Session Full"
                    : "Join Session"}
                </button>
              )}
            </div>
          ) : (
            <div className="space-y-6">
              <div className="text-gray-600">No active session</div>
              <div className="text-sm text-gray-500">A new session will start automatically when someone joins</div>
              <button
                onClick={joinSession}
                className="px-8 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-semibold"
              >
                Start New Session
              </button>
            </div>
          )}

          <div className="mt-8 text-sm text-gray-500">
            <p>Pick a number from 1-9 and try to match the winning number!</p>
            <p>Sessions last 20 seconds once started.</p>
          </div>
        </div>
      </div>
    </div>
  )
}
