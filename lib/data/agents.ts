export type AgentRole =
  | "orchestrator"
  | "analyst"
  | "developer"
  | "tester"
  | "reviewer"
  | "designer"
  | "marketing"
  | "job-search"

export type AgentStatus = "online" | "idle" | "busy" | "offline"

export type Agent = {
  id: string
  name: string
  emoji: string
  role: AgentRole
  description: string
  status: AgentStatus
  model: string
  taskCount: number
  lastActive?: string
}

export const agents: Agent[] = [
  {
    id: "ziko",
    name: "Ziko",
    emoji: "⚡",
    role: "orchestrator",
    description: "Main orchestrator — routes tasks, monitors pipeline, reports to Fares",
    status: "online",
    model: "claude-opus-4-6",
    taskCount: 0,
  },
  {
    id: "product-analyst",
    name: "Product Analyst",
    emoji: "🧠",
    role: "analyst",
    description: "Strategic brain — transforms requirements into specs and tasks via SpecKit",
    status: "idle",
    model: "claude-opus-4-6",
    taskCount: 0,
  },
  {
    id: "dev",
    name: "Dev",
    emoji: "🛠️",
    role: "developer",
    description: "Senior full-stack developer — implements tasks exactly as specified",
    status: "idle",
    model: "codex",
    taskCount: 0,
  },
  {
    id: "testing-agent",
    name: "Testing Agent",
    emoji: "🧪",
    role: "tester",
    description: "Quality validator — writes and runs tests, sends bugs back to Dev",
    status: "idle",
    model: "claude-sonnet-4-6",
    taskCount: 0,
  },
  {
    id: "code-reviewer",
    name: "Code Reviewer",
    emoji: "🔍",
    role: "reviewer",
    description: "Final quality gate — reviews code and fixes issues directly",
    status: "idle",
    model: "claude-sonnet-4-6",
    taskCount: 0,
  },
  {
    id: "designer",
    name: "Designer",
    emoji: "🎨",
    role: "designer",
    description: "UI/UX specialist — on-call for layout, component, and design system decisions",
    status: "idle",
    model: "claude-opus-4-6",
    taskCount: 0,
  },
  {
    id: "marketing-agent",
    name: "Marketing Agent",
    emoji: "📣",
    role: "marketing",
    description: "Full-stack marketer — copywriting, SEO, campaigns, and growth strategy",
    status: "idle",
    model: "claude-opus-4-6",
    taskCount: 0,
  },
  {
    id: "job-search-agent",
    name: "Job Search Agent",
    emoji: "💼",
    role: "job-search",
    description: "Career assistant — finds jobs and prepares application drafts",
    status: "idle",
    model: "claude-opus-4-6",
    taskCount: 0,
  },
]
