# Charlie Reviews

AI-powered code review tool that runs locally. Point it at any project directory, define your own review rules, and get structured feedback with exact code fixes and ready-to-use AI agent prompts.

## Why Charlie Reviews?

Code reviews are one of the biggest bottlenecks in software development. Human reviewers are inconsistent, overwhelmed, and expensive. Existing AI review tools are either locked to specific platforms (GitHub, GitLab), require cloud access to your code, or only work as PR-level checks.

Charlie Reviews is different:

- **Runs entirely on your machine** — your code never leaves your local environment. The only external call is to the LLM via OpenRouter.
- **Works on any directory** — not tied to git hosting platforms. Review a local project, a monorepo subfolder, or code you just downloaded.
- **Your rules, your standards** — define custom review rules in markdown. Enforce your team's conventions, security policies, or architectural patterns.
- **Git-aware** — detects uncommitted changes, lists branch commits, and lets you review only what changed. Branch names are tagged on reviews for traceability.
- **Actionable output** — every issue includes the problematic code, the suggested fix, and a copy-paste prompt you can hand to Claude Code, Cursor, Codex, or any AI coding agent to apply the fix automatically.

## What It Solves

| Problem | How Charlie Reviews Solves It |
|---|---|
| PR reviews take hours/days | Get structured feedback in minutes, asynchronously |
| Reviewers miss things or are inconsistent | AI applies the same rules every time |
| New team members don't know the codebase conventions | Encode conventions as rules, enforce them automatically |
| "LGTM" reviews that catch nothing | Custom rules ensure specific patterns are checked |
| Context switching between review tool and IDE | Copy the AI prompt directly into your coding agent |
| Cloud-based tools require code access | Everything runs locally, code stays on your machine |
| Tools only work on git PRs | Review any directory, any files, any time |

## Features

- **Project Management** — create projects pointing to any local directory with custom file and ignore patterns
- **Custom Review Rules** — write rules in markdown via the editor or bulk-upload from files
- **Three Review Modes:**
  - Scan the whole directory
  - Hand-pick specific files
  - Review only git-changed files (uncommitted + per-commit selection)
- **Git Integration** — auto-detects repos, shows current branch, lists commits with expandable file lists
- **Live Progress** — UI polls every 2 seconds showing files scanned in real-time
- **Severity Filtering** — filter results by critical, warning, suggestion, or info
- **Code Diff View** — shows problematic code (red) alongside the suggested fix (green)
- **AI Agent Prompts** — each issue includes a ready-to-copy prompt for AI coding agents
- **Review Cancellation** — cancel in-progress reviews and abort in-flight API calls immediately
- **Re-run Reviews** — retry any completed or failed review with the same file selection
- **Branch Tagging** — reviews store and display the git branch they were run on
- **Truncation Recovery** — gracefully handles truncated LLM responses by recovering all complete items

## Tech Stack

- **Framework:** Next.js 16 + React 19 + TypeScript
- **Database:** SQLite (better-sqlite3) — zero setup, file-based
- **AI:** OpenRouter API (configurable model)
- **UI:** Tailwind CSS 4, Base UI, shadcn components
- **Validation:** Zod

## Getting Started

### Prerequisites

- Node.js 18+
- An [OpenRouter](https://openrouter.ai/) API key

### Setup

```bash
# Clone the repo
git clone https://github.com/your-username/charlie-reviews.git
cd charlie-reviews

# Install dependencies
npm install

# Configure your API key
cp .env.example .env.local
# Edit .env.local and add your OpenRouter API key
```

Create a `.env.local` file:

```
OPENROUTER_API_KEY=sk-or-v1-your-key-here
```

### Run

```bash
npm run dev
```

Open [http://localhost:3001](http://localhost:3001) in your browser.

The SQLite database is created automatically at `data/charlie.db` on first run.

## How It Works

```
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Create       │     │  Define       │     │  Start        │
│  Project      │────>│  Rules        │────>│  Review       │
│  (directory)  │     │  (markdown)   │     │  (scope)      │
└──────────────┘     └──────────────┘     └──────┬───────┘
                                                  │
                                                  v
                                          ┌──────────────┐
                                          │  File Reader  │
                                          │  (glob/git)   │
                                          └──────┬───────┘
                                                  │
                                                  v
                                          ┌──────────────┐
                                          │  Chunker      │
                                          │  (~60k tokens)│
                                          └──────┬───────┘
                                                  │
                                                  v
                                          ┌──────────────┐
                                          │  OpenRouter   │
                                          │  LLM API      │
                                          └──────┬───────┘
                                                  │
                                                  v
                                          ┌──────────────┐
                                          │  Parser       │
                                          │  + Repair     │
                                          └──────┬───────┘
                                                  │
                                                  v
                                          ┌──────────────┐
                                          │  SQLite       │
                                          │  Storage      │
                                          └──────┬───────┘
                                                  │
                                                  v
                                          ┌──────────────┐
                                          │  Results UI   │
                                          │  + AI Prompts │
                                          └──────────────┘
```

1. **File Reading** — reads files from the project directory (glob patterns or explicit selection)
2. **Chunking** — splits files into chunks of ~60,000 tokens to fit LLM context windows
3. **Prompt Building** — constructs system prompt with your custom rules + user prompt with file contents
4. **LLM Review** — sends each chunk to OpenRouter for analysis
5. **Response Parsing** — validates JSON output with Zod, repairs truncated responses
6. **Storage** — persists review items to SQLite with full metadata
7. **Display** — shows results grouped by file with severity filtering, code diffs, and AI prompts

## Project Structure

```
src/
├── app/                    # Next.js pages and API routes
│   ├── api/                # REST API endpoints
│   └── projects/           # Project and review pages
├── components/             # React components
│   ├── ui/                 # Base UI components (button, dialog, card, etc.)
│   ├── review-trigger.tsx  # Review scope dialog with git integration
│   ├── review-result.tsx   # Results display with polling
│   └── review-item-card.tsx # Individual issue card with code + AI prompt
├── lib/
│   ├── db/                 # SQLite schema, connection, queries
│   ├── engine/             # Review pipeline (reader, chunker, prompt, parser)
│   ├── openrouter/         # OpenRouter API client
│   └── git.ts              # Git utilities (branch, commits, changed files)
└── types/                  # TypeScript interfaces
```

## Database

SQLite database at `data/charlie.db`. To inspect:

```bash
sqlite3 data/charlie.db
```

Tables: `projects`, `rules`, `reviews`, `review_items`. Migrations run automatically on startup.

## Configuration

| Constant | Default | Description |
|---|---|---|
| `OPENROUTER_MODEL` | `openrouter/owl-alpha` | LLM model to use |
| `MAX_FILE_SIZE` | 100 KB | Skip files larger than this |
| `CHUNK_TOKEN_LIMIT` | 60,000 | Token budget per LLM call |
| `REVIEW_POLL_INTERVAL` | 2,000 ms | UI polling frequency |
| `DEFAULT_FILE_PATTERNS` | `**/*.{ts,tsx,js,...}` | Default file globs |
| `DEFAULT_IGNORE_PATTERNS` | `node_modules/**,...` | Default ignore globs |

Edit `src/lib/constants.ts` to change these.

## License

MIT
