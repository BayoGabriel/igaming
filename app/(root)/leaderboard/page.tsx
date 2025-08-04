"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import type { LeaderboardEntry, SessionWithWinners } from "@/lib/types"

type FilterType = "all" | "day" | "week" | "month"

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [sessions, setSessions] = useState<SessionWithWinners[]>([])
  const [filter, setFilter] = useState<FilterType>("all")
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<"players" | "sessions">("players")
  const router = useRouter()

  const checkAuth = useCallback(async () => {
    const token = localStorage.getItem("token")
    if (!token) {
      router.push("/auth")
      return
    }

    try {
      const response = await fetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (!response.ok) {
        localStorage.removeItem("token")
        router.push("/auth")
      }
    } catch (error) {
      console.error("Auth check failed:", error)
      router.push("/auth")
    }
  }, [router])

  const fetchLeaderboard = useCallback(async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`/api/leaderboard?filter=${filter}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        const data: LeaderboardEntry[] = await response.json()
        setLeaderboard(data)
      }
    } catch (error) {
      console.error("Failed to fetch leaderboard:", error)
    } finally {
      setLoading(false)
    }
  }, [filter])

  const fetchSessions = useCallback(async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`/api/sessions?filter=${filter}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        const data: SessionWithWinners[] = await response.json()
        setSessions(data)
      }
    } catch (error) {
      console.error("Failed to fetch sessions:", error)
    }
  }, [filter])

  useEffect(() => {
    checkAuth()
    fetchLeaderboard()
    fetchSessions()
  }, [checkAuth, fetchLeaderboard, fetchSessions])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
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
          <h1 className="text-2xl font-bold text-gray-800">Leaderboard</h1>
          <button
            onClick={() => router.push("/")}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Back to Home
          </button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-4 py-8">
        {/* Tab Navigation */}
        <div className="flex mb-6 bg-white rounded-lg p-1 shadow-sm">
          <button
            onClick={() => setActiveTab("players")}
            className={`flex-1 py-3 px-4 rounded-md font-medium transition-colors ${
              activeTab === "players" ? "bg-blue-500 text-white shadow-sm" : "text-gray-600 hover:text-gray-800"
            }`}
          >
            Top Players
          </button>
          <button
            onClick={() => setActiveTab("sessions")}
            className={`flex-1 py-3 px-4 rounded-md font-medium transition-colors ${
              activeTab === "sessions" ? "bg-blue-500 text-white shadow-sm" : "text-gray-600 hover:text-gray-800"
            }`}
          >
            Game Sessions
          </button>
        </div>

        {/* Filter Buttons */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {[
            { key: "all", label: "All Time" },
            { key: "day", label: "Today" },
            { key: "week", label: "This Week" },
            { key: "month", label: "This Month" },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setFilter(key as FilterType)}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                filter === key ? "bg-blue-500 text-white" : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              {label}
            </button>
          ))}
        </div>

        {activeTab === "players" ? (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b">
              <h2 className="text-xl font-semibold text-gray-800">Top 10 Players</h2>
            </div>

            {leaderboard.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No players found for the selected period.</div>
            ) : (
              <div className="divide-y divide-gray-200">
                {leaderboard.map((player: LeaderboardEntry, index) => (
                  <div key={player._id} className="px-6 py-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-white ${
                          index === 0
                            ? "bg-yellow-500"
                            : index === 1
                              ? "bg-gray-400"
                              : index === 2
                                ? "bg-orange-600"
                                : "bg-blue-500"
                        }`}
                      >
                        {index + 1}
                      </div>
                      <div>
                        <div className="font-semibold text-gray-800">{player.username}</div>
                        <div className="text-sm text-gray-500">
                          {player.wins} win{player.wins !== 1 ? "s" : ""}
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-blue-600">{player.wins}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 bg-gray-50 border-b">
              <h2 className="text-xl font-semibold text-gray-800">Game Sessions</h2>
            </div>

            {sessions.length === 0 ? (
              <div className="p-8 text-center text-gray-500">No sessions found for the selected period.</div>
            ) : (
              <div className="divide-y divide-gray-200">
                {sessions.map((session: SessionWithWinners) => (
                  <div key={session._id} className="px-6 py-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="text-sm text-gray-500">{formatDate(session.startTime)}</div>
                      <div className="text-sm font-medium text-gray-700">
                        Winning Number: <span className="text-blue-600 font-bold">{session.winningNumber}</span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center">
                      <div className="text-sm text-gray-600">
                        {session.players.length} player{session.players.length !== 1 ? "s" : ""}
                      </div>
                      <div className="text-sm text-green-600">
                        {session.winners.length} winner{session.winners.length !== 1 ? "s" : ""}
                      </div>
                    </div>

                    {session.winners.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {session.winners.map((winner: string, index: number) => (
                          <span key={index} className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                            {winner}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
