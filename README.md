# 📝 CollabDoc — Local-First Collaborative Document Editor

A production-grade collaborative document editor built with **Next.js 15**, **TypeScript**, and **PostgreSQL**. Features local-first architecture, offline synchronization, deterministic conflict resolution, granular version control, and AI-powered writing assistance.

## 🌐 Live Demo

[https://your-app.vercel.app](https://your-app.vercel.app)

## ✨ Features

### Core Features

- **Local-First Architecture** — All edits save to IndexedDB instantly. Zero network requests block the UI.
- **Background Sync Engine** — Automatically pushes local changes to PostgreSQL when connection is restored.
- **Offline Detection** — Real-time status badge shows `● Offline · N pending` → `✓ Synced`.
- **Version History** — Save named snapshots of your document and restore any previous version safely.
- **Role-Based Access Control** — Owner, Editor, and Viewer roles with strict API enforcement.
- **Secure Sync API** — Payload size limits, Zod validation, and Row Level Security prevent malicious data.

### AI Features (powered by Groq)

- ✏️ **Fix Grammar** — Automatically corrects spelling and grammar errors
- 📝 **Summarize** — Condenses selected text into 2-3 sentences
- 📖 **Expand** — Adds more detail and depth to your writing
- ✂️ **Make Shorter** — Makes text more concise
- 💼 **Professional Tone** — Rewrites text in a professional style

### Authentication & Security

- Google OAuth via Auth.js (NextAuth v5)
- JWT-based session management
- Viewer role cannot push state updates to the server
- 1MB payload cap on all sync endpoints
- Zod schema validation on every API route

## 🛠 Tech Stack

| Layer         | Technology                     |
| ------------- | ------------------------------ |
| Framework     | Next.js 15 (App Router)        |
| Language      | TypeScript                     |
| Styling       | Tailwind CSS + shadcn/ui       |
| Database      | PostgreSQL (Supabase)          |
| ORM           | Prisma                         |
| Auth          | Auth.js v5 (NextAuth)          |
| Editor        | Tiptap                         |
| Local Storage | Dexie.js (IndexedDB)           |
| AI            | Vercel AI SDK + Groq (Llama 3) |
| Deployment    | Vercel                         |
| CI/CD         | GitHub Actions                 |

### Installation

**1. Clone the repository**

```bash
git clone https://github.com/etikumawat/document-editor.git
cd document-editor
```

**2. Install dependencies**

```bash
npm install
```

**3. Set up environment variables**

```bash
cp .env.example .env
```

Fill in your `.env`:

```env
AUTH_SECRET="your-auth-secret"
AUTH_URL="http://localhost:3000"
AUTH_GOOGLE_ID="your-google-client-id"
AUTH_GOOGLE_SECRET="your-google-client-secret"
DATABASE_URL="postgresql://..."
GROQ_API_KEY="your-groq-api-key"
```

**4. Set up database**

```bash
npx prisma db push
npx prisma generate
```

**5. Run development server**

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)
