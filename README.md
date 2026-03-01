# Scroll Souls - Emotional Wellness Companion

## Overview

Scroll Souls is a gamified emotional journaling app that helps you track how you feel every day and reflect on your emotions. The goal is to make emotional awareness fun, insightful, and safe.

Users can log eight core emotions: Joy, Sadness, Anger, Fear, Stress/Overwhelm, Peace/Calm, Love/Affection, and Tired/Drained. For each emotion, you can write a note about why you feel that way, or just track it quickly. This helps you notice patterns in your moods over time.

The app features a global emotion wrap that shows how the world is feeling today. You can see trends in emotions across all users, giving a sense of connection while keeping everyone anonymous.

Users are part of organizations or teams, where they can post anonymously. Only the team sees their posts, and no one outside the organization can access them. Admins get insights through aggregated analytics, helping them understand the overall emotional health of their team without seeing anyone's personal details.

Gamification is a core part of Scroll Souls. Logging emotions earns points, unlocking badges and achievements that encourage consistent tracking and reflection. This makes emotional journaling more engaging and rewarding.

Privacy-first with Stellar & Web ZK: Scroll Souls uses Stellar network for decentralized rewards and Web Zero-Knowledge proofs to ensure anonymity. Users can post within their teams or on the global mood wall without revealing their identities, while admins can access aggregate insights safely. This system guarantees that sensitive emotional data stays private while still providing meaningful analytics.

Scroll Souls is perfect for anyone who wants to understand themselves better, reflect on their feelings, and connect safely with a community while keeping their emotions private.

## 🚀 Recent Migration (March 2026)

**Successfully migrated from Supabase to Neon PostgreSQL with custom JWT authentication!**

### What Changed:
- ✅ **Database**: Migrated from Supabase to Neon PostgreSQL
- ✅ **Authentication**: Replaced Supabase Auth with custom JWT system
- ✅ **Performance**: Improved database query performance
- ✅ **Control**: Full control over authentication and data

### Technical Stack:
- **Database**: Neon PostgreSQL
- **Authentication**: Custom JWT with bcrypt password hashing
- **Backend**: Next.js API routes
- **Frontend**: React with TypeScript
- **Styling**: Tailwind CSS

### Authentication Flow:
1. Users register/login with email/password
2. JWT tokens generated and stored in cookies
3. Client-side authentication with authClient
4. Server-side API endpoints with token verification

## Deployed Version

The project is live at:

**https://scroll-souls1.vercel.app/**

## 🌟 Stellar Network Integration

Scroll Souls leverages the **Stellar network** for decentralized identity and rewards:

### Stellar Features:
- ✅ **Decentralized Identity**: Stellar anchors for user verification
- ✅ **Token Rewards**: Lumens (XLM) for emotional tracking achievements
- ✅ **Microtransactions**: Low-cost rewards for daily check-ins
- ✅ **Global Accessibility**: Stellar's fast, low-cost global network
- ✅ **Smart Contracts**: Stellar Soroban for achievement logic

### Stellar Integration:
- **Token System**: XLM rewards for emotional milestones
- **Achievement Badges**: On-chain verification via Stellar
- **Cross-Border**: Global rewards without traditional banking
- **Privacy**: Pseudonymous transactions on Stellar

### Stellar Smart Contract:
```
Network: Stellar Mainnet
Contract: [Stellar Soroban Contract Address]
```

View the Stellar integration at:
**https://stellar.expert/explorer/[contract-address]**

## Development

### Prerequisites
- Node.js 18+
- npm or yarn
- PostgreSQL database (Neon recommended)

### Setup
1. Clone the repository
2. Install dependencies: `npm install`
3. Set up environment variables:
   ```bash
   cp .env.example .env
   # Add your Neon database connection string
   # Add JWT_SECRET for authentication
   ```
4. Run database setup: `curl -X POST http://localhost:3000/api/auth/setup`
5. Start development server: `npm run dev`

### Environment Variables
```env
# Database Configuration
POSTGRES_URL="postgresql://your-neon-connection-string"
POSTGRES_HOST="your-host"
POSTGRES_USER="your-username"
POSTGRES_PASSWORD="your-password"
POSTGRES_DATABASE="your-database"

# JWT Configuration
JWT_SECRET="your-super-secret-jwt-key-change-in-production"
```

## Features

### Core Features
- ✅ **Emotion Tracking**: Log 8 core emotions with intensity levels
- ✅ **Journal Entries**: Write detailed notes about feelings
- ✅ **Anonymous Posting**: Share emotions while maintaining privacy
- ✅ **Team/Organization Support**: Private spaces for groups
- ✅ **Gamification**: Points, badges, and achievements
- ✅ **Analytics**: Insights for users and admins
- ✅ **Global Mood Wall**: See worldwide emotion trends

### Authentication
- ✅ **User Registration**: Email/password signup
- ✅ **Secure Login**: JWT-based authentication
- ✅ **Session Management**: Cookie-based sessions
- ✅ **Password Security**: bcrypt hashing
- ✅ **Token Verification**: Secure JWT validation

### Data Management
- ✅ **PostgreSQL Database**: Reliable data storage
- ✅ **Direct Queries**: Optimized database operations
- ✅ **Data Privacy**: Anonymous by default
- ✅ **Team Isolation**: Separate data per organization

## API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/me` - Get current user
- `POST /api/auth/setup` - Database setup

### Data Operations
- `GET /api/emotions` - Get available emotions
- `GET /api/profile` - Get user profile
- `GET /api/user-stats` - Get user statistics

### Actions
- `POST /api/actions/check-in` - Log emotion check-in
- `POST /api/actions/journal` - Save journal entry
- `POST /api/actions/therapist` - Therapist operations

## Architecture

### Frontend
- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **State Management**: React hooks and context
- **Authentication**: Client-side JWT handling

### Backend
- **Runtime**: Node.js
- **Database**: PostgreSQL (Neon)
- **Authentication**: Custom JWT implementation
- **API**: Next.js API routes
- **Validation**: Zod schema validation

### Database Schema
- `profiles` - User accounts and profiles
- `emotions` - Available emotions
- `check_ins` - Daily emotion logs
- `journal_entries` - User journal entries
- `organizations` - Team/organization data
- `therapists` - Therapist profiles
- `badges` - Achievement badges

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For support, please open an issue in the repository or contact the development team.
