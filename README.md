# AI App Compiler

AI App Compiler is a TypeScript-based prototype that converts a natural language software request into a generated full-stack application skeleton. It uses a staged LLM pipeline to extract intent, design the system, generate a validated app schema, repair inconsistencies, and write code files to disk.

The project includes:

- A Node.js and Express compiler backend.
- A Vite React dashboard for running compilations and viewing progress.
- Zod schemas for validating generated application configs.
- An LLM repair loop for invalid JSON or schema mismatches.
- A builder that writes generated SQL, Express routes, and React page stubs.

## Quick Start

Install backend dependencies:

```bash
npm install
```

Install frontend dependencies:

```bash
cd frontend
npm install
```

Create `.env` in the project root:

```env
NVIDIA_API_KEY="your_nvidia_api_key_here"
```

Build the frontend into `public/`:

```bash
cd frontend
npm run build
```

Start the compiler server from the project root:

```bash
npx ts-node src/index.ts
```

Open the dashboard at:

```text
http://localhost:3000
```

Trigger compilation directly through the API:

```bash
curl "http://localhost:3000/api/compile?prompt=Build%20a%20CRM"
```

The endpoint streams progress through Server-Sent Events and reports the generated app path when complete.

## Documentation

Detailed project documentation is available here:

- [Project Documentation](docs/PROJECT_DOCUMENTATION.md)
- [Interview Questions](docs/INTERVIEW_QUESTIONS.md)
- [File Reference](file_reference.md)

## Core Pipeline

The backend runs five stages:

1. Intent extraction from the user prompt.
2. System design from the extracted intent.
3. App schema generation for UI, API, database, and auth.
4. Validation and repair using Zod plus LLM-assisted consistency checks.
5. Code generation into a generated application folder.

## Tech Stack

- TypeScript
- Node.js
- Express
- React
- Vite
- Tailwind CSS
- Zod
- OpenAI SDK with NVIDIA NIM-compatible endpoint

## Important Notes

- The implemented compile route is `GET /api/compile?prompt=...`.
- Generated apps are written by `src/pipeline/builder.ts`.
- The project is a prototype and generates application skeletons, not production-ready full applications.
