"use client"

import { useEffect, useState, useCallback, useMemo } from "react"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { fetchAgentLogs, type AgentLog } from "@/lib/services/agents"
import { fetchRecentEvents, type TaskEvent } from "@/lib/services/task-events"
import { useAgentMonitorRealtime } from "@/lib/hooks/use-realtime"
import { agents as staticAgents } from "@/lib/data/agents"
import { cn } from "@/lib/utils"
import { format } from "date-fns"
import {
  Lightning,
  MagnifyingGlass,
  Robot,
  CheckCircle,
  XCircle,
  Play,
  Bug,
  Eye,
  Sparkle,
  Clock,
  WarningCircle,
  Pulse,
} from "@phosphor-icons/react/dist/ssr"

// ─── Types ───

type FeedItem =
  | { kind: "event"; data: TaskEvent; createdAt: string }
  | { kind: "log"; data: AgentLog; createdAt: string }

type FeedFilter = "all" | "events" | "logs"

// ─── Event Visual ───

function getEventVisual(type: string) {
  const t = type.toLowerCase()
  if (t.includes("fail") || t.includes("error"))
    return { icon: XCircle, dotClass: "border-red-500/40 text-red-500", color: "text-red-500" }
  if (t.includes("complete") || t.includes("done") || t.includes("passed") || t.includes("approved"))
    return { icon: CheckCircle, dotClass: "border-emerald-500/40 text-emerald-500", color: "text-emerald-500" }
  if (t.includes("start") || t.includes("spawn"))
    return { icon: Play, dotClass: "border-blue-500/40 text-blue-500", color: "text-blue-500" }
  if (t.includes("test"))
    return { icon: Bug, dotClass: "border-purple-500/40 text-purple-500", color: "text-purple-500" }
  if (t.includes("review"))
    return { icon: Eye, dotClass: "border-indigo-500/40 text-indigo-500", color: "text-indigo-500" }
  return { icon: Clock, dotClass: "border-primary/40 text-primary", color: "text-muted-foreground" }
}

function getLogVisual(status: string) {
  if (status === "completed")
    return { icon: CheckCircle, dotClass: "border-emerald-500/40 text-emerald-500" }
  if (status === "failed")
    return { icon: XCircle, dotClass: "border-red-500/40 text-red-500" }
  return { icon: Clock, dotClass: "border-amber-500/40 text-amber-500" }
}

// ─── Date Grouping ───

function isSameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()
}

function getDateLabel(date: Date): string {
  const now = new Date()
  const yesterday = new Date(now)
  yesterday.setDate(yesterday.getDate() - 1)

  if (isSameDay(date, now)) return "Today"
  if (isSameDay(date, yesterday)) return "Yesterday"
  return date.toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
  })
}

function getDateKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`
}

function groupByDate(items: FeedItem[]): { dateKey: string; label: string; items: FeedItem[] }[] {
  const groups = new Map<string, { label: string; items: FeedItem[] }>()
  for (const item of items) {
    const date = new Date(item.createdAt)
    const key = getDateKey(date)
    if (!groups.has(key)) {
      groups.set(key, { label: getDateLabel(date), items: [] })
    }
    groups.get(key)!.items.push(item)
  }
  return [...groups.entries()].map(([dateKey, v]) => ({ dateKey, ...v }))
}

function formatRelative(dateStr: string): string {
  const d = new Date(dateStr)
  const diffMs = Date.now() - d.getTime()
  const min = Math.floor(diffMs / 60000)
  if (min < 1) return "just now"
  if (min < 60) return `${min}m ago`
  const hrs = Math.floor(min / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

// ─── Constants ───

const agentNames = staticAgents.map((a) => a.name)

const EVENT_TYPES = [
  "task_started",
  "task_completed",
  "task_failed",
  "agent_spawned",
  "agent_message",
  "test_started",
  "test_passed",
  "test_failed",
  "review_started",
  "review_completed",
  "review_approved",
]

// ─── Main Component ───

export function ActivityPage() {
  const [events, setEvents] = useState<TaskEvent[]>([])
  const [logs, setLogs] = useState<AgentLog[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const [feedFilter, setFeedFilter] = useState<FeedFilter>("all")
  const [agentFilter, setAgentFilter] = useState("all")
  const [eventTypeFilter, setEventTypeFilter] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    Promise.all([fetchRecentEvents(300), fetchAgentLogs(200)]).then(([eventsData, logsData]) => {
      if (!cancelled) {
        setEvents(eventsData)
        setLogs(logsData)
        setIsLoading(false)
      }
    })
    return () => { cancelled = true }
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
    setEvents((prev) => [mapped, ...prev].slice(0, 500))
  }, [])

  useAgentMonitorRealtime({ onTaskEvent: handleRealtimeEvent })

  const feed = useMemo((): FeedItem[] => {
    const eventItems: FeedItem[] = events.map((e) => ({
      kind: "event" as const,
      data: e,
      createdAt: e.createdAt,
    }))
    const logItems: FeedItem[] = logs.map((l) => ({
      kind: "log" as const,
      data: l,
      createdAt: l.createdAt,
    }))

    let merged: FeedItem[] = []
    if (feedFilter === "all") merged = [...eventItems, ...logItems]
    else if (feedFilter === "events") merged = eventItems
    else merged = logItems

    if (agentFilter !== "all") {
      merged = merged.filter((item) => {
        if (item.kind === "event") return item.data.actorName === agentFilter
        return item.data.agentName === agentFilter
      })
    }

    if (eventTypeFilter !== "all") {
      merged = merged.filter((item) => {
        if (item.kind === "event") return item.data.eventType === eventTypeFilter
        return item.data.status === eventTypeFilter
      })
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      merged = merged.filter((item) => {
        if (item.kind === "event") {
          return (
            item.data.summary.toLowerCase().includes(q) ||
            item.data.actorName.toLowerCase().includes(q)
          )
        }
        return (
          item.data.taskDescription.toLowerCase().includes(q) ||
          item.data.agentName.toLowerCase().includes(q)
        )
      })
    }

    merged.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    return merged.slice(0, 500)
  }, [events, logs, feedFilter, agentFilter, eventTypeFilter, searchQuery])

  const grouped = useMemo(() => groupByDate(feed), [feed])

  const FEED_PILLS: { id: FeedFilter; label: string }[] = [
    { id: "all", label: "All" },
    { id: "events", label: "Task Events" },
    { id: "logs", label: "Agent Logs" },
  ]

  return (
    <div className="flex flex-1 flex-col min-h-0 bg-background mx-2 my-2 border border-border rounded-lg min-w-0">
      {/* Header */}
      <header className="flex items-center justify-between px-5 py-3.5 border-b border-border/60">
        <div className="flex items-center gap-3">
          <SidebarTrigger className="h-8 w-8 rounded-lg hover:bg-accent text-muted-foreground" />
          <Lightning className="h-5 w-5 text-amber-500" weight="fill" />
          <h1 className="text-lg font-bold text-foreground">Activity</h1>
          <span className="flex items-center gap-1.5 text-[10px] text-emerald-500 font-semibold ml-1">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-pulse" />
            LIVE
          </span>
        </div>
        <span className="text-xs text-muted-foreground">{feed.length} events</span>
      </header>

      {/* Filter bar */}
      <div className="flex items-center justify-between gap-3 px-5 py-3 border-b border-border/40 flex-wrap">
        {/* Feed type pills */}
        <div className="flex items-center gap-1.5">
          {FEED_PILLS.map((pill) => (
            <button
              key={pill.id}
              onClick={() => setFeedFilter(pill.id)}
              className={cn(
                "h-7 px-3 rounded-full text-xs font-medium transition-colors",
                feedFilter === pill.id
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
              )}
            >
              {pill.label}
            </button>
          ))}
        </div>

        {/* Right controls */}
        <div className="flex items-center gap-2.5">
          <Select value={agentFilter} onValueChange={setAgentFilter}>
            <SelectTrigger className="h-8 w-36 text-xs rounded-lg border-border">
              <SelectValue placeholder="All Agents" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Agents</SelectItem>
              {agentNames.map((name) => (
                <SelectItem key={name} value={name}>
                  {name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {feedFilter !== "logs" && (
            <Select value={eventTypeFilter} onValueChange={setEventTypeFilter}>
              <SelectTrigger className="h-8 w-40 text-xs rounded-lg border-border">
                <SelectValue placeholder="All Events" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Events</SelectItem>
                {EVENT_TYPES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t.replace(/_/g, " ")}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}

          <div className="relative">
            <MagnifyingGlass className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Search..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-8 pl-8 pr-3 text-xs w-40 rounded-lg border-border"
            />
          </div>
        </div>
      </div>

      {/* Timeline content */}
      <div className="flex-1 min-h-0 overflow-y-auto px-5 py-4">
        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <p className="text-sm text-muted-foreground">Loading activity...</p>
          </div>
        ) : feed.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 gap-3">
            <Pulse className="h-12 w-12 text-muted-foreground/20" />
            <p className="text-sm text-muted-foreground">No activity yet</p>
            <p className="text-xs text-muted-foreground/60">
              Agent events will appear here in real time.
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {grouped.map((group) => (
              <section key={group.dateKey}>
                <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-4">
                  {group.label}
                </p>

                <div className="space-y-2">
                  {group.items.map((item) => {
                    if (item.kind === "event") {
                      const visual = getEventVisual(item.data.eventType)
                      const Icon = visual.icon
                      return (
                        <article
                          key={`event-${item.data.id}`}
                          className="rounded-lg border border-border/40 px-4 py-3 transition-colors hover:border-border hover:bg-muted/30"
                        >
                          <div className="flex items-start gap-3">
                            <div
                              className={cn(
                                "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border bg-background mt-0.5",
                                visual.dotClass,
                              )}
                            >
                              <Icon className="h-3.5 w-3.5" weight="fill" />
                            </div>
                            <div className="flex items-start justify-between gap-3 flex-1 min-w-0">
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap mb-1">
                                  <span className="text-sm font-semibold text-foreground">
                                    {item.data.actorName}
                                  </span>
                                  <Badge
                                    variant="secondary"
                                    className="text-[10px] px-1.5 py-0 rounded-md font-mono"
                                  >
                                    {item.data.eventType.replace(/_/g, " ")}
                                  </Badge>
                                </div>
                                <p className="text-sm text-muted-foreground leading-relaxed">
                                  {item.data.summary}
                                </p>
                              </div>
                              <div className="text-right shrink-0">
                                <p className="text-xs text-muted-foreground font-mono">
                                  {format(new Date(item.data.createdAt), "HH:mm")}
                                </p>
                                <p className="text-[11px] text-muted-foreground/50">
                                  {formatRelative(item.data.createdAt)}
                                </p>
                              </div>
                            </div>
                          </div>
                        </article>
                      )
                    }

                    // Log item
                    const visual = getLogVisual(item.data.status)
                    const Icon = visual.icon
                    return (
                      <article
                        key={`log-${item.data.id}`}
                        className="rounded-lg border border-border/40 px-4 py-3 transition-colors hover:border-border hover:bg-muted/30"
                      >
                        <div className="flex items-start gap-3">
                          <div
                            className={cn(
                              "flex h-8 w-8 shrink-0 items-center justify-center rounded-full border bg-background mt-0.5",
                              visual.dotClass,
                            )}
                          >
                            <Icon className="h-3.5 w-3.5" weight="fill" />
                          </div>
                          <div className="flex items-start justify-between gap-3 flex-1 min-w-0">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2 flex-wrap mb-1">
                                <span className="text-sm font-semibold text-foreground">
                                  {item.data.agentName}
                                </span>
                                <Badge
                                  variant="outline"
                                  className={cn(
                                    "text-[10px] px-1.5 py-0 rounded-full border",
                                    item.data.status === "completed"
                                      ? "bg-emerald-50 text-emerald-700 border-transparent dark:bg-emerald-500/15 dark:text-emerald-300"
                                      : item.data.status === "failed"
                                        ? "bg-red-50 text-red-700 border-transparent dark:bg-red-500/15 dark:text-red-300"
                                        : "bg-amber-50 text-amber-700 border-transparent dark:bg-amber-500/15 dark:text-amber-300",
                                  )}
                                >
                                  {item.data.status}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground leading-relaxed">
                                {item.data.taskDescription}
                              </p>
                            </div>
                            <div className="text-right shrink-0">
                              <p className="text-xs text-muted-foreground font-mono">
                                {format(new Date(item.data.createdAt), "HH:mm")}
                              </p>
                              <p className="text-[11px] text-muted-foreground/50">
                                {formatRelative(item.data.createdAt)}
                              </p>
                            </div>
                          </div>
                        </div>
                      </article>
                    )
                  })}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
