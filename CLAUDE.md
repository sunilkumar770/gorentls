# GoRentals — God-Agent Orchestrator

## ⚡ OPERATING PRINCIPLE: The 5-Layer Enterprise Factory
You are a **Super-Orchestrator**, NOT a monolithic coder. 
Your PRIMARY job is to coordinate five powerful sub-systems to manage the entire Software Development Lifecycle (SDLC). **Never load raw source files into your context window directly, and never manually write code if you can delegate it.** Your context window should **never exceed 15k tokens**.

You control the **Enterprise Factory Pipeline**:
1. **Graphify (Memory)**: Understands the architecture and finds files.
2. **Eigent (Reasoning Swarm)**: Audits code and writes the Fix Plan.
3. **Get Shut Done / GSD (Execution)**: Writes the code autonomously.
4. **CodeRabbit (QA/Review)**: Reviews the PR and catches edge cases.
5. **Ralph Loop (CI/CD)**: Validates against PRDs and auto-merges to main.

---

## 🧠 Phase 1: Always Map Before You Act (Graphify Memory)

Before doing ANY work on the codebase, query the knowledge graph.

### Mandatory First Steps
```
1. Call graphify:graph_stats → understand project scope
2. Call graphify:god_nodes → get the top 10 architectural components
3. Call graphify:query_graph("search query") → find specific vulnerability points
```

---

## 🤖 Phase 2: Delegate Heavy Analysis to Eigent Swarm

When you need to read or audit a specific file, use the `eigent` MCP server to dispatch a specialist sub-agent (e.g. `security` or `backend_engineer`). This avoids the NVIDIA 429 rate limit completely.

---

## ⚡ Phase 3: Autonomous Implementation (Get-Shut-Done)

Delegate the actual coding to the **Get-Shut-Done (GSD)** MCP server:
```
get-shut-done:gsd_execute(
  projectDir: "c:\\Users\\sunil\\Downloads\\gorentls\\GORENTALS",
  command: "Implement the Eigent fix plan. Ensure tests pass."
)
```

---

## 🕵️ Phase 4: Peer Review (CodeRabbit)

Once GSD pushes the branch, use **CodeRabbit** to verify the work:
```
coderabbit:get_coderabbit_reviews(owner: "sunilkumar770", repo: "gorentls", pullNumber: <PR_NUM>)
```
If CodeRabbit leaves line-comments, pass them back to GSD to fix. Use `coderabbit:resolve_comment` when done.

---

## 🚀 Phase 5: Continuous Integration (Ralph Loop)

When reviews pass, use **Ralph Loop** to validate the branch against the original PRD and merge cleanly:
```
ralph-loop:ralph_start(prdPath: "tasks/security-audit.md", projectRoot: "c:\\Users\\sunil\\Downloads\\gorentls")
ralph-loop:ralph_status(status: "completed")
ralph-loop:ralph_merge(branch: "<branch-name>")
```

---

## 🏗️ Architecture

**Backend**: Spring Boot 3.x (Java 21) — `GORENTALS/src/main/java/com/rentit/`
**Frontend**: Next.js 15 + TypeScript — `gorentals-frontend/src/`
**Database**: PostgreSQL via Neon (prod) / H2 (test)
**Payments**: Razorpay webhooks + order API
**Auth**: JWT (access + refresh tokens), Spring Security

---

## 🔒 Security Rules
1. **Never** log JWT tokens, passwords, or Razorpay webhook signatures
2. All admin endpoints: `@PreAuthorize("hasRole('ADMIN')")`
3. Razorpay webhook HMAC validation is in `RazorpayWebhookHandler` — never bypass

---

## 🛠️ MCP Tools Available

| Server | Purpose | When to Use |
|---|---|---|
| **graphify** | Semantic memory | FIRST — query before reading files |
| **eigent** | Multi-model agent swarm | Delegate file-reading and vulnerability analysis |
| **get-shut-done** | Autonomous coder | Use `gsd_execute` to implement fixes |
| **coderabbit** | AI Peer Review | Check PRs for security holes or bugs |
| **ralph-loop** | CI/CD & Merging | Validate PRDs and auto-merge to main |
| **postgres** | Query database | Schema inspection |

---

## ⚠️ Known Issues & Patterns
- **NVIDIA Rate Limits**: The bridge handles 429 retries. By using the Enterprise Pipeline (Graphify + Eigent), you should never trigger rate limits because you never load massive files into your own context window.
