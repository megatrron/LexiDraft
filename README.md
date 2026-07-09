# ✍️ LexiDraft

LexiDraft is a modern, high-performance rich-text note application built for frictionless writing. It features an integrated AI assistant, robust rich-text editing, secure public sharing, and a beautiful, distraction-free UI.

## ✨ Core Features

* **Rich Text Editing:** Powered by Tiptap and Tailwind Typography for a seamless, Notion-like writing experience.
* **AI Writing Assistant:** Integrated Gemini AI to instantly polish grammar, expand bullet points into prose, generate TL;DR summaries, and append technical contexts.
* **Secure Web Sharing:** One-click publishing generates a unique, read-only public link to share notes instantly.
* **Frictionless PDF Export:** Native browser print integration engineered to strip away UI elements and download crisp, perfectly formatted PDFs.
* **Global Dark Mode:** Full system-theme syncing and manual toggling via `next-themes`.
* **Auto-Saving:** Silent, debounced background saving ensures you never lose a keystroke.

## 🛠️ Tech Stack

This project is structured as a **Turborepo** monorepo to separate frontend logic from database schemas cleanly.

* **Framework:** Next.js (App Router)
* **Styling:** Tailwind CSS + `@tailwindcss/typography`
* **Editor:** Tiptap
* **Database:** Neon (Serverless Postgres) + Prisma ORM
* **Authentication:** NextAuth.js
* **AI Provider:** Google Gemini API

## 🚀 Getting Started

### 1. Clone the repository
\`\`\`bash
git clone https://github.com/yourusername/lexidraft.git
cd lexidraft
\`\`\`

### 2. Install Dependencies
LexiDraft uses `pnpm` as its package manager.
\`\`\`bash
pnpm install
\`\`\`

### 3. Environment Variables
Create a `.env` file in the root of the project and populate it with your specific keys:

\`\`\`env
# Database (Neon DB)
DATABASE_URL="postgresql://user:password@hostname/dbname?sslmode=require"

# Authentication (NextAuth)
NEXTAUTH_SECRET="your_super_secret_key"
NEXTAUTH_URL="http://localhost:3000"

# AI Integration
GEMINI_API_KEY="your_google_gemini_api_key"
\`\`\`

### 4. Database Setup
Push the Prisma schema to your Neon database to create the `User` and `Note` tables:
\`\`\`bash
pnpm --filter @repo/db dlx prisma db push
pnpm --filter @repo/db dlx prisma generate
\`\`\`

### 5. Run the Development Server
Boot up the Next.js frontend and the Turbopack engine:
\`\`\`bash
pnpm run dev
\`\`\`
Visit `http://localhost:3000` in your browser to start writing.

## 📂 Project Structure

\`\`\`text
lexidraft/
├── apps/
│   └── web/                # Next.js Application (Pages, API routes, UI)
│       ├── app/api/        # Next.js API Route Handlers (AI, Share, Notes)
│       ├── app/editor/     # Core Tiptap Editor Client
│       └── app/share/      # Public Read-Only View
├── packages/
│   └── db/                 # Database Package
│       ├── prisma/         # Schema and Migrations
│       └── config.ts       # Shared Prisma Client
└── turbo.json              # Turborepo configuration
\`\`\`

