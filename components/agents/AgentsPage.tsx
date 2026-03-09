"use client"

import { useEffect, useMemo, useState, useCallback } from "react"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent } from "@/components/ui/card"
import type { Agent } from "@/lib/data/agents"
import { agents as staticAgents } from "@/lib/data/agents"
import type { AgentLog } from "@/lib/services/agents"
import { fetchAgentLogs } from "@/lib/services/agents"
import { fetchRecentRuns, type AgentRun } from "@/lib/services/agent-runs"
import { fetchRecentEvents, type TaskEvent } from "@/lib/services/task-events"
import { useAgentMonitorRealtime } from "@/lib/hooks/use-realtime"
import { LifecycleBadge, LifecycleDot } from "@/components/ui/lifecycle-badge"
import { cn } from "@/lib/utils"
import { format } from "date-fns"

// ─── Helpers ───

function formatTimeAgo(dateStr: string): string {
  const date = new Date(dateStr)
  const now = new Date()
  const diffMs = now.getTime() - date.getTime()
  const diffSec = Math.floor(diffMs / 1000)
  const diffMin = Math.floor(diffSec / 60)
  const diffHrs = Math.floor(diffMin / 60)
  const diffDays = Math.floor(diffHrs / 24)
  if (diffSec < 10) return "just now"
  if (diffSec < 60) return `${diffSec}s ago`
  if (diffMin < 60) return `${diffMin}m ago`
  if (diffHrs < 24) return `${diffHrs}h ago`
  return `${diffDays}d ago`
}

function formatDuration(startedAt: string, completedAt?: string | null): string {
  const start = new Date(startedAt).getTime()
  const end = completedAt ? new Date(completedAt).getTime() : Date.now()
  const diffSec = Math.floor((end - start) / 1000)
  if (diffSec < 60) return `${diffSec}s`
  const min = Math.floor(diffSec / 60)
  const sec = diffSec % 60
  if (min < 60) return `${min}m ${sec}s`
  return `${Math.floor(min / 60)}h ${min % 60}m`
}

type AgentStatus = "running" | "idle" | "error" | "blocked"

function deriveAgentStatus(agentName: string, runs: AgentRun[]): AgentStatus {
  const agentRuns = runs.filter((r) => r.agentName === agentName)
  const active = agentRuns.find((r) => r.status === "running" || r.status === "pending")
  if (active) return "running"
  const recent = agentRuns[0]
  if (recent?.status === "failed") return "error"
  return "idle"
}

const STATUS_COLORS: Record<AgentStatus, string> = {
  running: "bg-emerald-500 animate-pulse",
  idle: "bg-zinc-400",
  error: "bg-red-500",
  blocked: "bg-amber-500",
}

const STATUS_LABELS: Record<AgentStatus, string> = {
  running: "Running",
  idle: "Idle",
  error: "Error",
  blocked: "Blocked",
}

// ─── Agent Monitor Table Row ───

function AgentMonitorRow({
  agent,
  status,
  activeRun,
  lastEvent,
}: {
  agent: Agent
  status: AgentStatus
  activeRun?: AgentRun
  lastEvent?: TaskEvent
}) {
  return (
    <tr className="border-b border-border/40 hover:bg-muted/30 transition-colors">
      {/* Agent */}
      <td className="px-3 py-3">
        <div className="flex items-center gap-2.5">
          <span className="text-base">{agent.emoji}</span>
          <span className="text-sm font-medium text-foreground">{agent.name}</span>
        </div>
      </td>
      {/* Status */}
      <td className="px-3 py-3">
        <div className="flex items-center gap-2">
          <span className={cn("h-2 w-2 rounded-full", STATUS_COLORS[status])} />
          <span className="text-xs text-muted-foreground">{STATUS_LABELS[status]}</span>
        </div>
      </td>
      {/* Current Task */}
      <td className="px-3 py-3">
        {activeRun ? (
          <span className="text-xs text-foreground truncate max-w-[200px] block">
            {activeRun.inputSummary || "Working..."}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground/50">—</span>
        )}
      </td>
      {/* Run ID */}
      <td className="px-3 py-3">
        {activeRun ? (
          <code className="text-[10px] text-muted-foreground font-mono bg-muted px-1.5 py-0.5 rounded">
            {activeRun.id.slice(0, 8)}
          </code>
        ) : (
          <span className="text-xs text-muted-foreground/50">—</span>
        )}
      </td>
      {/* Runtime */}
      <td className="px-3 py-3">
        {activeRun ? (
          <span className="text-xs text-muted-foreground font-mono">
            {formatDuration(activeRun.startedAt, activeRun.completedAt)}
          </span>
        ) : (
          <span className="text-xs text-muted-foreground/50">—</span>
        )}
      </td>
      {/* Model */}
      <td className="px-3 py-3">
        <Badge variant="secondary" className="text-[10px] font-mono px-1.5">
          {agent.model}
        </Badge>
      </td>
      {/* Last Activity */}
      <td className="px-3 py-3">
        {lastEvent ? (
          <span className="text-xs text-muted-foreground">{formatTimeAgo(lastEvent.createdAt)}</span>
        ) : (
          <span className="text-xs text-muted-foreground/50">—</span>
        )}
      </td>
    </tr>
  )
}

// ─── Live Event Stream ───

function LiveEventRow({ event }: { event: TaskEvent }) {
  const eventColors: Record<string, string> = {
    task_started: "text-amber-500",
    task_completed: "text-emerald-500",
    task_failed: "text-red-500",
    agent_spawned: "text-blue-500",
    agent_message: "text-foreground",
    test_started: "text-purple-500",
    test_passed: "text-lime-600",
    test_failed: "text-red-500",
    review_started: "text-indigo-500",
    review_completed: "text-emerald-500",
    review_approved: "text-emerald-600",
  }
  const color = eventColors[event.eventType] || "text-muted-foreground"

  return (
    <div className="flex items-start gap-3 px-3 py-2 hover:bg-muted/30 rounded-md transition-colors">
      <span className="text-[10px] font-mono text-muted-foreground shrink-0 pt-0.5 w-16">
        {format(new Date(event.createdAt), "HH:mm:ss")}
      </span>
      <span className={cn("text-xs font-semibold shrink-0 w-32", color)}>
        {event.actorName}
      </span>
      <span className="text-xs text-muted-foreground flex-1">{event.summary}</span>
      <code className="text-[9px] text-muted-foreground/50 font-mono shrink-0">{event.eventType}</code>
    </div>
  )
}

// ─── Main Component ───

export function AgentsPage() {
  const [runs, setRuns] = useState<AgentRun[]>([])
  const [events, setEvents] = useState<TaskEvent[]>([])
  const [logs, setLogs] = useState<AgentLog[]>([])
  const [isLoading, setIsLoading] = useState(true)

  // Initial fetch
  useEffect(() => {
    let cancelled = false
    setIsLoading(true)

    Promise.all([fetchRecentRuns(100), fetchRecentEvents(100), fetchAgentLogs(50)]).then(
      ([runsData, eventsData, logsData]) => {
        if (!cancelled) {
          setRuns(runsData)
          setEvents(eventsData)
          setLogs(logsData)
          setIsLoading(false)
        }
      },
    )

    return () => { cancelled = true }
  }, [])

  // Realtime subscriptions
  const handleRealtimeRun = useCallback((run: Record<string, unknown>) => {
    setRuns((prev) => {
      const existing = prev.findIndex((r) => r.id === run.id)
      const mapped: AgentRun = {
        id: run.id as string,
        todoId: (run.todo_id as string) || null,
        parentRunId: (run.parent_run_id as string) || null,
        agentName: run.agent_name as string,
        status: run.status as AgentRun["status"],
        inputSummary: (run.input_summary as string) || null,
        outputSummary: (run.output_summary as string) || null,
        errorMessage: (run.error_message as string) || null,
        startedAt: run.started_at as string,
        completedAt: (run.completed_at as string) || null,
        createdAt: run.created_at as string,
        updatedAt: run.updated_at as string,
      }
      if (existing >= 0) {
        const next = [...prev]
        next[existing] = mapped
        return next
      }
      return [mapped, ...prev]
    })
  }, [])

  const handleRealtimeEvent = useCallback((event: Record<string, unknown>) => {
    const mapped: TaskEvent = {
      id: event.id as string,
      todoId: event.todo_id as string,
      runId: (event.run_id as string) || null,
      eventType: event.event_type as string,
      actorType: event.actor_type as string,
      actorName: event.actor_name as string,
      summary: event.summary as string,
      metadata: (event.metadata as Record<string, unknown>) || {},
      createdAt: event.created_at as string,
    }
    setEvents((prev) => [mapped, ...prev].slice(0, 200))
  }, [])

  useAgentMonitorRealtime({
    onAgentRun: handleRealtimeRun,
    onTaskEvent: handleRealtimeEvent,
  })

  // Derive agent statuses from runs
  const agentData = useMemo(() => {
    return staticAgents.map((agent) => {
      const status = deriveAgentStatus(agent.name, runs)
      const activeRun = runs.find(
        (r) => r.agentName === agent.name && (r.status === "running" || r.status === "pending"),
      )
      const lastEvent = events.find((e) => e.actorName === agent.name)
      return { agent, status, activeRun, lastEvent }
    })
  }, [runs, events])

  const stats = useMemo(() => {
    const running = agentData.filter((a) => a.status === "running").length
    const idle = agentData.filter((a) => a.status === "idle").length
    const errors = agentData.filter((a) => a.status === "error").length
    const activeRuns = runs.filter((r) => r.status === "running" || r.status === "pending").length
    return { running, idle, errors, activeRuns, totalEvents: events.length }
  }, [agentData, runs, events])

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col min-h-0 bg-background mx-2 my-2 border border-border rounded-lg min-w-0">
        <div className="flex items-center justify-between px-4 py-4 border-b border-border/70">
          <div className="flex items-center gap-3">
            <SidebarTrigger className="h-8 w-8 rounded-lg hover:bg-accent text-muted-foreground" />
            <p className="text-base font-medium text-foreground">Agent Monitor</p>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-muted-foreground">Loading agent data...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-1 flex-col min-h-0 bg-background mx-2 my-2 border border-border rounded-lg min-w-0">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-border/70">
        <div className="flex items-center gap-3">
          <SidebarTrigger className="h-8 w-8 rounded-lg hover:bg-accent text-muted-foreground" />
          <p className="text-base font-medium text-foreground">Agent Monitor</p>
          <span className="flex items-center gap-1.5 text-[10px] text-emerald-500 font-medium">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            LIVE
          </span>
        </div>
        <div className="flex items-center gap-4 text-xs text-muted-foreground">
          {stats.running > 0 && <span className="text-emerald-500 font-medium">{stats.running} running</span>}
          <span>{stats.idle} idle</span>
          {stats.errors > 0 && <span className="text-red-500">{stats.errors} errors</span>}
          <span>{stats.activeRuns} active runs</span>
        </div>
      </header>

      <div className="flex-1 min-h-0 overflow-y-auto">
        {/* Agent Status Table */}
        <div className="px-4 py-4">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
            Agents
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="border-b border-border/60">
                  <th className="px-3 py-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Agent</th>
                  <th className="px-3 py-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                  <th className="px-3 py-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Current Task</th>
                  <th className="px-3 py-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Run ID</th>
                  <th className="px-3 py-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Runtime</th>
                  <th className="px-3 py-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Model</th>
                  <th className="px-3 py-2 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Last Activity</th>
                </tr>
              </thead>
              <tbody>
                {agentData.map(({ agent, status, activeRun, lastEvent }) => (
                  <AgentMonitorRow
                    key={agent.id}
                    agent={agent}
                    status={status}
                    activeRun={activeRun}
                    lastEvent={lastEvent}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Live Activity Stream */}
        <div className="px-4 py-4 border-t border-border/40">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
              Live Activity Stream
            </p>
            <span className="text-[10px] text-muted-foreground">{events.length} events</span>
          </div>
          <div className="space-y-0.5 max-h-[400px] overflow-y-auto">
            {events.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">
                No events yet. Agent activity will appear here in real time.
              </p>
            ) : (
              events.slice(0, 100).map((event) => (
                <LiveEventRow key={event.id} event={event} />
              ))
            )}
          </div>
        </div>

        {/* Recent Agent Logs */}
        {logs.length > 0 && (
          <div className="px-4 py-4 border-t border-border/40">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
              Recent Agent Logs
            </p>
            <div className="space-y-0.5">
              {logs.slice(0, 20).map((log) => (
                <div key={log.id} className="flex items-center gap-3 px-3 py-2 hover:bg-muted/30 rounded-md transition-colors">
                  <Badge
                    variant={log.status === "completed" ? "default" : "destructive"}
                    className="text-[10px] px-1.5 min-w-[70px] justify-center"
                  >
                    {log.status}
                  </Badge>
                  <span className="text-xs font-medium text-foreground min-w-[120px]">{log.agentName}</span>
                  <span className="text-xs text-muted-foreground flex-1 truncate">{log.taskDescription}</span>
                  {log.runId && (
                    <code className="text-[9px] text-muted-foreground/50 font-mono">{log.runId.slice(0, 8)}</code>
                  )}
                  <span className="text-[10px] text-muted-foreground whitespace-nowrap">{formatTimeAgo(log.createdAt)}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
