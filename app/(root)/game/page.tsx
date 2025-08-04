"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"

export default function GamePage() {
  const [user, setUser] = useState<any>(null)
  const [gameSession, setGameSession] = useState<any>(null)
  const [selectedNumber, setSelectedNumber] = useState<number | null>(null)
  const [timeLeft, setTimeLeft] = useState(0)
  const [gameResult, setGameResult] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    checkAuth()
    fetchGameSession()
    const interval = setInterval(fetchGameSession, 1000)
    return () => clearInterval(interval)
  }, [])

  const checkAuth = async () => {
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
        const userData = await response.json()
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
  }

  const fetchGameSession = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("/api/game/current", {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        const session = await response.json()
        setGameSession(session)

        if (session) {
          if (session.status === "active") {
            const endTime = new Date(session.endTime).getTime()
            const now = new Date().getTime()
            const remaining = Math.max(0, Math.floor((endTime - now) / 1000))
            setTimeLeft(remaining)
          } else if (session.status === "completed") {
            setGameResult(session)
            setTimeLeft(0)
          }

          // Check if user is in this session
          const userInSession = session.players?.find((p: any) => p.userId === user?.id)
          if (userInSession) {
            setSelectedNumber(userInSession.selectedNumber)
          } else if (session.status === "active") {
            // User not in session, redirect to home
            router.push("/")
          }
        } else {
          router.push("/")
        }
      }
    } catch (error) {
      console.error("Failed to fetch game session:", error)
    }
  }

  const selectNumber = async (number: number) => {
    if (selectedNumber !== null || timeLeft <= 0) return

    try {
      const token = localStorage.getItem("token")
      const response = await fetch("/api/game/select-number", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ number }),
      })

      if (response.ok) {
        setSelectedNumber(number)
      } else {
        const error = await response.json()
        alert(error.message || "Failed to select number")
      }
    } catch (error) {
      console.error("Failed to select number:", error)
      alert("Failed to select number")
    }
  }

  const leaveSession = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("/api/game/leave", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        router.push("/")
      } else {
        const error = await response.json()
        alert(error.message || "Failed to leave session")
      }
    } catch (error) {
      console.error("Failed to leave session:", error)
      alert("Failed to leave session")
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 flex items-center justify-center">
        <div className="text-xl">Loading...</div>
      </div>
    )
  }

  if (gameResult && gameResult.status === "completed") {
    const userPlayer = gameResult.players?.find((p: any) => p.userId === user?.id)
    const isWinner = userPlayer && userPlayer.selectedNumber === gameResult.winningNumber
    const winners = gameResult.players?.filter((p: any) => p.selectedNumber === gameResult.winningNumber) || []

    return (
      <div className="min-h-screen bg-gray-100">
        <nav className="bg-white shadow-sm border-b">
          <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-800">Game Results</h1>
            <button
              onClick={() => router.push("/")}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
            >
              Back to Home
            </button>
          </div>
        </nav>

        <div className="max-w-2xl mx-auto px-4 py-8">
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <div className={`text-6xl font-bold mb-4 ${isWinner ? "text-green-500" : "text-red-500"}`}>
              {isWinner ? "🎉" : "😔"}
            </div>

            <h2 className={`text-3xl font-bold mb-4 ${isWinner ? "text-green-600" : "text-red-600"}`}>
              {isWinner ? "You Won!" : "You Lost!"}
            </h2>

            <div className="space-y-4 mb-8">
              <div className="text-lg">
                <span className="text-gray-600">Winning Number: </span>
                <span className="font-bold text-2xl text-blue-600">{gameResult.winningNumber}</span>
              </div>
              <div className="text-lg">
                <span className="text-gray-600">Your Number: </span>
                <span className="font-bold text-2xl">{userPlayer?.selectedNumber || "None"}</span>
              </div>
            </div>

            {winners.length > 0 && (
              <div className="bg-green-50 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-green-800 mb-2">Winners ({winners.length})</h3>
                <div className="space-y-1">
                  {winners.map((winner: any, index: number) => (
                    <div key={index} className="text-green-700">
                      {winner.username}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button
              onClick={() => router.push("/")}
              className="px-8 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 font-semibold"
            >
              Play Again
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-4xl mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Game Session</h1>
          <div className="flex items-center gap-4">
            <div className="text-2xl font-bold text-blue-600">{timeLeft}s</div>
            <button
              onClick={leaveSession}
              disabled={timeLeft <= 0}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Leave Session
            </button>
          </div>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-4 py-8">
        <div className="bg-white rounded-lg shadow-md p-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold text-gray-800 mb-4">Pick Your Number</h2>
            <div className="text-gray-600">Choose a number from 1 to 9. Good luck!</div>
          </div>

          {selectedNumber !== null ? (
            <div className="text-center space-y-6">
              <div className="text-lg text-gray-600">You selected:</div>
              <div className="text-6xl font-bold text-blue-600">{selectedNumber}</div>
              <div className="text-gray-600">Waiting for the session to end...</div>
            </div>
          ) : (
            <div className="grid grid-cols-3 gap-4 max-w-md mx-auto">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((number) => (
                <button
                  key={number}
                  onClick={() => selectNumber(number)}
                  disabled={timeLeft <= 0}
                  className="aspect-square text-2xl font-bold bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors"
                >
                  {number}
                </button>
              ))}
            </div>
          )}

          <div className="mt-8 bg-gray-50 rounded-lg p-4">
            <div className="text-sm text-gray-600 mb-2">Session Info</div>
            <div className="flex justify-between items-center">
              <span>
                Players: {gameSession?.players?.length || 0}/{process.env.NEXT_PUBLIC_MAX_PLAYERS || 10}
              </span>
              <span>Time Left: {timeLeft}s</span>
            </div>
            {gameSession?.players?.some((p: any) => p.isStarter) && (
              <div className="text-sm text-green-600 mt-2">
                Session started by: {gameSession.players.find((p: any) => p.isStarter)?.username}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
