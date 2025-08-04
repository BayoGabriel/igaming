# Game Lobby System

A real-time multiplayer number guessing game built with Next.js, MongoDB, and JWT authentication.

## Game Overview

Players join game sessions, pick numbers from 1-9, and compete to match a randomly generated winning number. Sessions last 20 seconds and support up to 10 players (configurable).

## Architecture Approach

### Backend Design
- **Next.js API Routes**: RESTful endpoints for game logic and authentication
- **MongoDB**: Document-based storage for users, sessions, and game history
- **JWT Authentication**: Stateless token-based user authentication
- **TypeScript Models**: Strongly typed interfaces for data consistency

### Frontend Architecture
- **React with Hooks**: Modern functional components with state management
- **Real-time Updates**: 1-second polling for live game state synchronization
- **Client-side Routing**: Next.js App Router for seamless navigation
- **Responsive Design**: Tailwind CSS for mobile-first UI

### Key Technical Decisions

#### 1. **Session Management Strategy**typescript
// Automatic session lifecycle management
- Active sessions: 20-second countdown
- Expired sessions: Auto-completion with winner calculation
- Queue system: First-come-first-served when players leave

#### 2. **Data Flow Pattern**
User Action → API Route → Database → Real-time Polling → UI Update

#### 3. **Authentication Flow**
- Simple username-only registration (no passwords for demo)
- JWT tokens with 7-day expiration
- Middleware protection on all game endpoints
- Active session prevention (can't login while in game)

#### 4. **Database Schema Design**typescript
// Users Collection
interface User {
  username: string
  wins: number
  createdAt: Date
}

// Game Sessions Collection  
interface GameSession {
  startTime: Date
  endTime: Date
  status: "active" | "completed"
  players: Player[]
  winningNumber?: number
  maxPlayers: number
}

## Real-time Synchronization

### Polling Strategy
- **1-second intervals** for active game sessions
- **Automatic cleanup** of expired sessions
- **Optimistic UI updates** for better user experience

### State Management
- **Local state** for immediate UI feedback
- **Server state** as source of truth
- **Conflict resolution** through server validation

## Game Logic Implementation

### Session Lifecycle
1. **Creation**: First player creates session automatically
2. **Joining**: Up to 10 players can join active sessions
3. **Playing**: 20-second window for number selection
4. **Completion**: Automatic winner calculation and database updates

### Winner Determinationtypescript
const winningNumber = Math.floor(Math.random() * 9) + 1
const winners = players.filter(p => p.selectedNumber === winningNumber)

### Queue System
- Players can leave before game starts
- Automatic backfill from waiting players
- Session starter indication for transparency

## Analytics & Leaderboard

### Time-based Filtering
- **All-time**: Direct user wins count
- **Filtered periods**: Aggregated from game sessions
- **MongoDB Aggregation**: Efficient winner calculation

### Performance Considerations
- **Indexed queries** on frequently accessed fields
- **Limited result sets** (top 10 players, 50 recent sessions)
- **Efficient aggregation pipelines** for complex queries

## 🛡️ Security & Validation

### Input Validation
- Number range validation (1-9)
- Session state verification
- User authorization checks

### Error Handling
- Graceful degradation for network issues
- User-friendly error messages
- Comprehensive server-side validation

## 🚀 Scalability Considerations

### Current Limitations
- **Polling-based updates** (could use WebSockets for production)
- **Single server instance** (no horizontal scaling)
- **In-memory session state** (could use Redis for distributed systems)

## 📁 Project Structure

├── app/
│   ├── api/           # Backend API routes
│   ├── auth/          # Authentication pages
│   ├── game/          # Game session page
│   ├── leaderboard/   # Statistics page
│   └── page.tsx       # Home/lobby page
├── lib/
│   ├── auth.ts        # JWT utilities
│   ├── game.ts        # Game logic functions
│   ├── models.ts      # TypeScript interfaces
│   └── mongodb.ts     # Database connection
└── README.md

## 🔧 Environment Setup
# Required environment variables
MONGODB_URI=mongodb+srv://bayogabriel24:bayogabriel24@cluster0.khvxavt.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0
JWT_SECRET=mblhightech_secret_code2368r03ocuo_19et0owufg8u9gffhjjbigi
MAX_PLAYERS_PER_SESSION=10
NEXT_PUBLIC_MAX_PLAYERS=10
SESSION_DURATION=20000
