"use client"

import { useEffect, useMemo, useState } from "react"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import type { Agent } from "@/lib/data/agents"
import type { AgentLog } from "@/lib/services/agents"
import { fetchAgentsWithActivity, fetchAgentLogs } from "@/lib/services/agents"
import { fetchInternalTasks } from "@/lib/services/tasks"
import type { ProjectTask } from "@/lib/data/project-details"

function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  const diffHrs = Math.floor(diffMin / 60)
  const diffDays = Math.floor(diffHrs / 24)

  if (diffMin < 1) return "just now"
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffHrs < 24) return `${diffHrs}h ago`
  return `${diffDays}d ago`
}

const statusColors: Record<string, string> = {
  online: "bg-emerald-500",
  busy: "bg-amber-500",
  idle: "bg-zinc-400",
  offline: "bg-zinc-600",
}

function AgentCard({ agent }: { agent: Agent }) {
  return (
    <Card className="border-border/60 hover:border-border transition-colors">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted text-lg">
              {agent.emoji}
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground">{agent.name}</span>
                <span className={`h-2 w-2 rounded-full ${statusColors[agent.status]}`} />
              </div>
              <span className="text-xs text-muted-foreground">{agent.description}</span>
            </div>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-3 text-xs text-muted-foreground">
          <Badge variant="secondary" className="font-mono text-[10px] px-1.5">
            {agent.model}
          </Badge>
          <span>{agent.taskCount} task{agent.taskCount !== 1 ? "s" : ""}</span>
          {agent.lastActive && (
            <span>Last active {formatTimeAgo(agent.lastActive)}</span>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function ActivityRow({ log }: { log: AgentLog }) {
  return (
    <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted/50 transition-colors">
      <Badge
        variant={log.status === "completed" ? "default" : "secondary"}
        className="text-[10px] px-1.5 min-w-[70px] justify-center"
      >
        {log.status}
      </Badge>
      <span className="text-sm font-medium text-foreground min-w-[140px]">{log.agentName}</span>
      <span className="text-sm text-muted-foreground flex-1 truncate">{log.taskDescription}</span>
      <span className="text-xs text-muted-foreground whitespace-nowrap">{formatTimeAgo(log.createdAt)}</span>
    </div>
  )
}

export function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [logs, setLogs] = useState<AgentLog[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [internalTasks, setInternalTasks] = useState<ProjectTask[]>([])

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)

    Promise.all([fetchAgentsWithActivity(), fetchAgentLogs(30), fetchInternalTasks()]).then(
      ([agentsData, logsData, internalTasksData]) => {
        if (!cancelled) {
          setAgents(agentsData)
          setLogs(logsData)
          setInternalTasks(internalTasksData)
          setIsLoading(false)
        }
      }
    )

    return () => {
      cancelled = true
    }
  }, [])

  const stats = useMemo(() => {
    const total = agents.length
    const completedTasks = logs.filter((l) => l.status === "completed").length
    const failedTasks = logs.filter((l) => l.status === "failed").length
    const internalTaskCount = internalTasks.length
    return { total, completedTasks, failedTasks, internalTaskCount }
  }, [agents, logs, internalTasks])

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col min-h-0 bg-background mx-2 my-2 border border-border rounded-lg min-w-0">
        <div className="flex items-center justify-between px-4 py-4 border-b border-border/70">
          <div className="flex items-center gap-3">
            <SidebarTrigger className="h-8 w-8 rounded-lg hover:bg-accent text-muted-foreground" />
            <p className="text-base font-medium text-foreground">Agents</p>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-muted-foreground">Loading agents...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col min-h-0 bg-background mx-2 my-2 border border-border rounded-lg min-w-0">
      <header className="flex flex-col border-b border-border/40">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/70">
          <div className="flex items-center gap-3">
            <SidebarTrigger className="h-8 w-8 rounded-lg hover:bg-accent text-muted-foreground" />
            <p className="text-base font-medium text-foreground">Agents</p>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>{stats.total} agents</span>
            <span>{stats.completedTasks} completed</span>
            <span>{stats.internalTaskCount} internal tasks</span>
            {stats.failedTasks > 0 && (
              <span className="text-destructive">{stats.failedTasks} failed</span>
            )}
          </div>
        </div>
      </header>

      <div className="flex-1 min-h-0 overflow-y-auto px-4 py-4 space-y-6">
        {/* Agent cards grid */}
        <div>
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
            Team
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {agents.map((agent) => (
              <AgentCard key={agent.id} agent={agent} />
            ))}
          </div>
        </div>

        {/* Internal / system tasks visibility */}
        {internalTasks.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
              Internal Tasks (Agent + System)
            </p>
            <div className="space-y-0.5">
              {internalTasks.slice(0, 12).map((task) => (
                <div key={task.id} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-muted/50 transition-colors">
                  <Badge variant={task.taskType === "system_task" ? "secondary" : "default"} className="text-[10px] px-1.5 min-w-[80px] justify-center">
                    {task.taskType === "system_task" ? "system" : "agent"}
                  </Badge>
                  <span className="text-sm text-foreground flex-1 truncate">{task.name}</span>
                  <span className="text-[10px] text-muted-foreground uppercase">{task.status}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent activity */}
        {logs.length > 0 && (
          <div>
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
              Recent Activity
            </p>
            <div className="space-y-0.5">
              {logs.map((log) => (
                <ActivityRow key={log.id} log={log} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
