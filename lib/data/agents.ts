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

export type AgentType = "Supreme" | "Lead" | "Specialist"

export type Agent = {
  id: string
  name: string
  emoji: string
  role: AgentRole
  roleLabel: string
  description: string
  status: AgentStatus
  model: string
  taskCount: number
  lastActive?: string
  squad: string
  agentType: AgentType
  reportsTo: string
  provider: string
  skills: string[]
}

export const agents: Agent[] = [
  {
    id: "ziko",
    name: "Ziko",
    emoji: "⚡",
    role: "orchestrator",
    roleLabel: "Main Assistant",
    description: "Main orchestrator — routes tasks, monitors pipeline, reports to Fares",
    status: "online",
    model: "gpt-5.3-codex",
    taskCount: 0,
    squad: "All",
    agentType: "Supreme",
    reportsTo: "None",
    provider: "openai-codex",
    skills: [
      "Browser Control",
      "Code Execution",
      "Database Query",
      "Email",
      "File Management",
      "find-skills",
      "github",
      "GitHub Integration",
      "gog",
      "humanizer",
      "self-improving-agent",
      "Slack Integration",
      "Web Search",
    ],
  },
  {
    id: "product-analyst",
    name: "Product Analyst",
    emoji: "🧠",
    role: "analyst",
    roleLabel: "Product Analyst",
    description: "Strategic brain — transforms requirements into specs and tasks via SpecKit",
    status: "online",
    model: "claude-opus-4-6",
    taskCount: 0,
    squad: "All",
    agentType: "Lead",
    reportsTo: "Ziko",
    provider: "anthropic",
    skills: ["Code Execution", "File Management", "SpecKit", "Database Query"],
  },
  {
    id: "dev",
    name: "Dev",
    emoji: "🛠️",
    role: "developer",
    roleLabel: "Full-stack Developer",
    description: "Senior full-stack developer — implements tasks exactly as specified",
    status: "online",
    model: "claude-opus-4-6",
    taskCount: 0,
    squad: "Engineering",
    agentType: "Specialist",
    reportsTo: "Ziko",
    provider: "anthropic",
    skills: [
      "Code Execution",
      "File Management",
      "GitHub Integration",
      "Database Query",
      "Frontend Development",
      "Backend Development",
      "API Development",
      "DevOps",
    ],
  },
  {
    id: "testing-agent",
    name: "Testing Agent",
    emoji: "🧪",
    role: "tester",
    roleLabel: "QA & Testing Specialist",
    description: "Quality validator — writes and runs tests, sends bugs back to Dev",
    status: "online",
    model: "claude-sonnet-4-6",
    taskCount: 0,
    squad: "Engineering",
    agentType: "Specialist",
    reportsTo: "Ziko",
    provider: "anthropic",
    skills: ["Code Execution", "Playwright", "File Management", "GitHub Integration"],
  },
  {
    id: "code-reviewer",
    name: "Code Reviewer",
    emoji: "🔍",
    role: "reviewer",
    roleLabel: "Code Review & QA",
    description: "Final quality gate — reviews code and fixes issues directly",
    status: "online",
    model: "claude-opus-4-6",
    taskCount: 0,
    squad: "Engineering",
    agentType: "Specialist",
    reportsTo: "Ziko",
    provider: "anthropic",
    skills: ["Code Execution", "File Management", "GitHub Integration", "Code Review"],
  },
  {
    id: "designer",
    name: "Designer",
    emoji: "🎨",
    role: "designer",
    roleLabel: "UI/UX Designer",
    description: "UI/UX specialist — on-call for layout, component, and design system decisions",
    status: "online",
    model: "claude-sonnet-4-6",
    taskCount: 0,
    squad: "All",
    agentType: "Specialist",
    reportsTo: "Product Analyst",
    provider: "anthropic",
    skills: ["Code Execution", "File Management", "UI/UX Design"],
  },
  {
    id: "marketing-agent",
    name: "Marketing Agent",
    emoji: "📣",
    role: "marketing",
    roleLabel: "Marketing Specialist",
    description: "Full-stack marketer — copywriting, SEO, campaigns, and growth strategy",
    status: "online",
    model: "claude-sonnet-4-6",
    taskCount: 0,
    squad: "Marketing",
    agentType: "Specialist",
    reportsTo: "Product Analyst",
    provider: "anthropic",
    skills: ["Code Execution", "Email", "Web Search", "SEO", "Content Strategy"],
  },
  {
    id: "job-search-agent",
    name: "Job Search Agent",
    emoji: "💼",
    role: "job-search",
    roleLabel: "Career Assistant",
    description: "Career assistant — finds jobs and prepares application drafts",
    status: "online",
    model: "claude-opus-4-6",
    taskCount: 0,
    squad: "All",
    agentType: "Specialist",
    reportsTo: "Ziko",
    provider: "anthropic",
    skills: ["Browser Control", "Web Search", "Email", "File Management"],
  },
]
