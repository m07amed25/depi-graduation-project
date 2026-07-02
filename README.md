# Code Catch

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-16-black?style=for-the-badge&logo=next.js" alt="Next.js">
  <img src="https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript" alt="TypeScript">
  <img src="https://img.shields.io/badge/Prisma-6.19-2D3748?style=for-the-badge&logo=prisma" alt="Prisma">
  <img src="https://img.shields.io/badge/tRPC-11-10.0-black?style=for-the-badge" alt="tRPC">
</p>

[![Code Catch](https://code-catch-psi.vercel.app/api/badge/m07amed25/DevReview-AI)](https://code-catch-psi.vercel.app)

> AI-powered code reviews that catch bugs, security issues, and maintainability problems before they reach production.

## ✨ Features

- **🤖 AI-Powered Code Review** - Automated code analysis using multiple AI providers (OpenAI, Google Gemini, Groq, Hugging Face)
- **🔗 GitHub Integration** - Seamlessly connect your GitHub repositories and review pull requests
- **👥 Team Collaboration** - Work together with team members on code reviews with real-time features
- **📊 Analytics Dashboard** - Track review metrics, code quality trends, and team performance
- **📐 Automatic Diagrams** - Generate ERD, Class, and Use-Case diagrams from your codebase (supports Prisma, TypeORM, Sequelize, Drizzle, Mongoose, Knex, SQL DDL)
- **⚡ Real-time Updates** - Live notifications and collaborative review features via Pusher
- **🎨 Modern UI** - Beautiful, responsive interface with dark mode support
- **🔒 Rate Limiting** - Built-in protection against abuse using Upstash Redis
- **📧 Email Notifications** - Stay updated with review status via Resend

## 🛠 Tech Stack

| Category            | Technology                                |
| ------------------- | ----------------------------------------- |
| **Framework**       | Next.js 16 (App Router)                   |
| **Language**        | TypeScript                                |
| **Database**        | PostgreSQL with Prisma ORM                |
| **API**             | tRPC v11                                  |
| **Authentication**  | Better Auth                               |
| **AI Providers**    | OpenAI, Google Gemini, Groq, Hugging Face |
| **Real-time**       | Pusher                                    |
| **Background Jobs** | Inngest                                   |
| **Rate Limiting**   | Upstash Redis                             |
| **Styling**         | Tailwind CSS + shadcn/ui                  |
| **Animations**      | GSAP                                      |
| **Email**           | Resend                                    |

## 🚀 Getting Started

### Prerequisites

- Node.js 18+
- PostgreSQL database
- pnpm (recommended) or npm/yarn

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/yourusername/depi-code-review.git
cd depi-code-review
```

2. **Install dependencies**

```bash
pnpm install
# or
npm install
```

3. **Configure environment variables**

Create a `.env` file in the root directory:

```env
# Database
DATABASE_URL="postgresql://user:password@localhost:5432/depireview?schema=public"

# Authentication (Better Auth)
BETTER_AUTH_SECRET="your-secret-key"
BETTER_AUTH_URL="http://localhost:3000"

# GitHub OAuth
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"

# AI Providers (at least one required)
OPENAI_API_KEY="sk-..."
GOOGLE_GENERATIVE_AI_API_KEY="..."
GROQ_API_KEY="..."
HUGGING_FACE_API_KEY="..."

# Real-time (Pusher)
PUSHER_APP_ID="your-pusher-app-id"
PUSHER_KEY="your-pusher-key"
PUSHER_SECRET="your-pusher-secret"
PUSHER_CLUSTER="us2"

# Rate Limiting (Upstash Redis)
UPSTASH_REDIS_REST_URL="https://your-redis.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your-token"

# File Upload (Vercel Blob)
BLOB_READ_WRITE_TOKEN="your-vercel-blob-token"

# Email (Resend)
RESEND_API_KEY="re_..."
```

4. **Initialize the database**

```bash
npx prisma db push
```

5. **Run the development server**

```bash
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

## 📁 Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── (auth)/            # Authentication pages (sign-in, sign-up)
│   ├── (dashboard)/      # Protected dashboard pages
│   ├── api/              # API routes
│   │   ├── auth/         # Authentication endpoints
│   │   ├── trpc/         # tRPC API
│   │   ├── webhooks/     # GitHub webhooks
│   │   ├── upload/       # File upload handling
│   │   ├── pusher/       # Pusher authentication
│   │   └── inngest/      # Inngest functions
│   └── page.tsx          # Landing page
├── components/            # React components
│   ├── ui/               # shadcn/ui components
│   ├── animations/       # GSAP animations
│   └── *.tsx             # Feature components
├── lib/                   # Utility functions
│   ├── trpc/             # tRPC client setup
│   └── pusher/           # Pusher client
└── server/               # Server-side code
    ├── api/
    │   ├── routers/      # tRPC routers
    │   └── rate-limiter/ # Rate limiting
    ├── auth/             # Authentication config
    ├── db/               # Prisma client
    ├── services/         # Business logic (AI, GitHub)
    ├── email/            # Email templates
    ├── inngest/          # Inngest functions
    └── pusher/           # Pusher server
```

## 🔌 API Routes

### tRPC Endpoints

| Router          | Description             |
| --------------- | ----------------------- |
| `repository`    | Repository management   |
| `review`        | Code review operations  |
| `pullRequest`   | Pull request handling   |
| `team`          | Team management         |
| `analytics`     | Review analytics        |
| `profile`       | User profile            |
| `settings`      | User settings           |
| `notification`  | Notifications           |
| `collaboration` | Real-time collaboration |

### Webhooks

- **GitHub Webhooks** (`/api/webhooks/github`) - Receive events from GitHub

## 📝 Available Scripts

```bash
pnpm dev          # Start development server
pnpm build        # Build for production
pnpm start        # Start production server
pnpm lint         # Run ESLint
```

## 🔧 Environment Variables Reference

| Variable                       | Required | Description                     |
| ------------------------------ | -------- | ------------------------------- |
| `DATABASE_URL`                 | Yes      | PostgreSQL connection string    |
| `BETTER_AUTH_SECRET`           | Yes      | Secret for session encryption   |
| `BETTER_AUTH_URL`              | Yes      | Production URL                  |
| `GITHUB_CLIENT_ID`             | Yes      | GitHub OAuth app client ID      |
| `GITHUB_CLIENT_SECRET`         | Yes      | GitHub OAuth app client secret  |
| `OPENAI_API_KEY`               | No\*     | OpenAI API key                  |
| `GOOGLE_GENERATIVE_AI_API_KEY` | No\*     | Google Gemini API key           |
| `GROQ_API_KEY`                 | No\*     | Groq API key                    |
| `HUGGING_FACE_API_KEY`         | No\*     | Hugging Face API key            |
| `PUSHER_*`                     | Yes      | Pusher configuration            |
| `UPSTASH_REDIS_*`              | Yes      | Upstash Redis for rate limiting |
| `BLOB_READ_WRITE_TOKEN`        | No       | Vercel Blob for file uploads    |
| `RESEND_API_KEY`               | No       | Resend for emails               |

\*At least one AI provider API key is required.

## 🏗 Deployment

### Vercel (Recommended)

1. Push your code to GitHub
2. Import the project in Vercel
3. Configure environment variables
4. Deploy

### Docker

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable pnpm && pnpm install --frozen-lockfile
COPY . .
RUN pnpm build
EXPOSE 3000
CMD ["pnpm", "start"]
```

## 📄 License

MIT License - see [LICENSE](LICENSE) for details.

---

<p align="center">Built with ❤️ by Mohamed Reda</p>
