"use client"

import { useEffect, useMemo, useState, useCallback, memo } from "react"
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import type { Agent, AgentStatus, AgentType } from "@/lib/data/agents"
import { fetchAgentsWithActivity } from "@/lib/services/agents"
import { fetchRecentRuns, type AgentRun } from "@/lib/services/agent-runs"
import { useAgentMonitorRealtime } from "@/lib/hooks/use-realtime"
import { cn } from "@/lib/utils"
import { Bot } from "lucide-react"
import {
  CaretUpDown,
  ArrowDown,
  ArrowUp,
  DotsThreeVertical,
  MagnifyingGlass,
  Plus,
} from "@phosphor-icons/react/dist/ssr"
import { AgentDetailPanel } from "./AgentDetailPanel"

// ─── Types ───

type SortKey = "name" | "role" | "type" | "squad" | "status" | "model"
type SortDir = "asc" | "desc"
type StatusFilter = "all" | AgentStatus

// ─── Status Config ───

const statusDotColor: Record<AgentStatus, string> = {
  online: "bg-emerald-500",
  busy: "bg-amber-500",
  idle: "bg-blue-400",
  offline: "bg-zinc-400 dark:bg-zinc-500",
}

const statusTextColor: Record<AgentStatus, string> = {
  online: "text-emerald-600 dark:text-emerald-400",
  busy: "text-amber-600 dark:text-amber-400",
  idle: "text-blue-600 dark:text-blue-400",
  offline: "text-zinc-400 dark:text-zinc-500",
}

const statusLabel: Record<AgentStatus, string> = {
  online: "Online",
  busy: "Busy",
  idle: "Idle",
  offline: "Offline",
}

// Type badge — Specialist=teal, Lead=blue, Supreme=purple
const TYPE_BADGE: Record<AgentType, string> = {
  Specialist: "bg-teal-50 text-teal-700 border-transparent dark:bg-teal-500/15 dark:text-teal-300",
  Lead: "bg-blue-50 text-blue-700 border-transparent dark:bg-blue-500/15 dark:text-blue-300",
  Supreme: "bg-purple-50 text-purple-700 border-transparent dark:bg-purple-500/15 dark:text-purple-300",
}

// ─── Sort Header ───

function SortableHead({
  col,
  label,
  sortKey,
  sortDir,
  onSort,
  className,
}: {
  col: SortKey
  label: string
  sortKey: SortKey
  sortDir: SortDir
  onSort: (col: SortKey) => void
  className?: string
}) {
  return (
    <TableHead
      className={cn(
        "cursor-pointer select-none whitespace-nowrap text-xs font-medium text-muted-foreground hover:text-foreground transition-colors",
        className,
      )}
      onClick={() => onSort(col)}
    >
      <span className="inline-flex items-center gap-1">
        {label}
        {sortKey === col ? (
          sortDir === "asc" ? (
            <ArrowUp className="h-3 w-3" />
          ) : (
            <ArrowDown className="h-3 w-3" />
          )
        ) : (
          <CaretUpDown className="h-3 w-3 opacity-40" />
        )}
      </span>
    </TableHead>
  )
}

// ─── Agent Row ───

const AgentTableRow = memo(function AgentTableRow({
  agent,
  activeRun,
  onSelect,
}: {
  agent: Agent
  activeRun?: AgentRun
  onSelect: (agent: Agent) => void
}) {
  return (
    <TableRow
      className="cursor-pointer hover:bg-muted/40 transition-colors"
      onClick={() => onSelect(agent)}
    >
      {/* Name */}
      <TableCell className="py-3.5">
        <div className="flex items-center gap-3">
          <div className="relative shrink-0">
            <Avatar className="h-8 w-8 rounded-lg">
              <AvatarFallback className="rounded-lg bg-muted text-muted-foreground">
                <Bot className="h-4 w-4" />
              </AvatarFallback>
            </Avatar>
            <span
              className={cn(
                "absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 rounded-full border-2 border-background",
                statusDotColor[agent.status],
              )}
            />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-foreground truncate">{agent.name}</p>
            <p className="text-[11px] text-muted-foreground truncate mt-0.5">
              {agent.reportsTo !== "None" ? `→ ${agent.reportsTo}` : "—"}
            </p>
          </div>
        </div>
      </TableCell>

      {/* Role */}
      <TableCell className="py-3.5">
        <span className="text-sm text-muted-foreground">{agent.roleLabel}</span>
      </TableCell>

      {/* Type */}
      <TableCell className="py-3.5">
        <Badge
          variant="outline"
          className={cn(
            "rounded-full text-[11px] font-medium px-2.5 py-0.5 border",
            TYPE_BADGE[agent.agentType],
          )}
        >
          {agent.agentType}
        </Badge>
      </TableCell>

      {/* Squad */}
      <TableCell className="py-3.5">
        <span className="text-sm text-muted-foreground">{agent.squad}</span>
      </TableCell>

      {/* Status */}
      <TableCell className="py-3.5">
        <div className="flex items-center gap-1.5">
          <span className={cn("h-2 w-2 rounded-full shrink-0", statusDotColor[agent.status])} />
          <span className={cn("text-sm", statusTextColor[agent.status])}>
            {statusLabel[agent.status]}
          </span>
        </div>
      </TableCell>

      {/* Model */}
      <TableCell className="py-3.5">
        <span className="text-xs text-muted-foreground font-mono">{agent.model}</span>
      </TableCell>

      {/* Session */}
      <TableCell className="py-3.5">
        <span className="text-sm text-muted-foreground/40">—</span>
      </TableCell>

      {/* Actions */}
      <TableCell className="py-3.5 text-right" onClick={(e) => e.stopPropagation()}>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-muted-foreground/50 hover:text-muted-foreground"
            >
              <DotsThreeVertical className="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-36">
            <DropdownMenuItem onClick={() => onSelect(agent)}>Quick view</DropdownMenuItem>
            <DropdownMenuItem>Edit agent</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  )
})

// ─── Main Component ───

export function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([])
  const [runs, setRuns] = useState<AgentRun[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all")
  const [squadFilter, setSquadFilter] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedAgent, setSelectedAgent] = useState<Agent | null>(null)
  const [sortKey, setSortKey] = useState<SortKey>("name")
  const [sortDir, setSortDir] = useState<SortDir>("asc")

  useEffect(() => {
    let cancelled = false
    setIsLoading(true)
    Promise.all([fetchAgentsWithActivity(), fetchRecentRuns(100)]).then(([agentData, runsData]) => {
      if (!cancelled) {
        setAgents(agentData)
        setRuns(runsData)
        setIsLoading(false)
      }
    })
    return () => { cancelled = true }
  }, [])

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

  useAgentMonitorRealtime({ onAgentRun: handleRealtimeRun })

  const squads = useMemo(() => Array.from(new Set(agents.map((a) => a.squad))), [agents])

  const filtered = useMemo(() => {
    let items = agents.filter((agent) => {
      if (searchQuery) {
        const q = searchQuery.toLowerCase()
        if (
          !agent.name.toLowerCase().includes(q) &&
          !agent.roleLabel.toLowerCase().includes(q) &&
          !agent.squad.toLowerCase().includes(q)
        )
          return false
      }
      if (squadFilter !== "all" && agent.squad !== squadFilter) return false
      if (statusFilter !== "all" && agent.status !== statusFilter) return false
      return true
    })

    items = [...items].sort((a, b) => {
      let cmp = 0
      if (sortKey === "name") cmp = a.name.localeCompare(b.name)
      else if (sortKey === "role") cmp = a.roleLabel.localeCompare(b.roleLabel)
      else if (sortKey === "type") cmp = a.agentType.localeCompare(b.agentType)
      else if (sortKey === "squad") cmp = a.squad.localeCompare(b.squad)
      else if (sortKey === "status") cmp = a.status.localeCompare(b.status)
      else if (sortKey === "model") cmp = a.model.localeCompare(b.model)
      return sortDir === "asc" ? cmp : -cmp
    })

    return items
  }, [agents, statusFilter, squadFilter, searchQuery, sortKey, sortDir])

  function handleSort(col: SortKey) {
    if (sortKey === col) setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    else {
      setSortKey(col)
      setSortDir("asc")
    }
  }

  const STATUS_PILLS: { id: StatusFilter; label: string }[] = [
    { id: "all", label: "All" },
    { id: "online", label: "Online" },
    { id: "busy", label: "Busy" },
    { id: "idle", label: "Idle" },
    { id: "offline", label: "Offline" },
  ]

  if (isLoading) {
    return (
      <div className="flex flex-1 flex-col min-h-0 bg-background mx-2 my-2 border border-border rounded-lg min-w-0">
        <div className="flex items-center gap-3 px-5 py-4 border-b border-border/70">
          <SidebarTrigger className="h-8 w-8 rounded-lg hover:bg-accent text-muted-foreground" />
          <p className="text-lg font-bold">Agents</p>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-sm text-muted-foreground">Loading agents...</p>
        </div>
      </div>
    )
  }

  return (
    <>
      <div className="flex flex-1 flex-col min-h-0 bg-background mx-2 my-2 border border-border rounded-lg min-w-0">
        {/* Header */}
        <header className="flex items-center justify-between px-5 py-3.5 border-b border-border/60">
          <div className="flex items-center gap-3">
            <SidebarTrigger className="h-8 w-8 rounded-lg hover:bg-accent text-muted-foreground" />
            <h1 className="text-lg font-bold text-foreground">Agents</h1>
          </div>
          <Button variant="ghost" size="sm" className="text-sm font-medium gap-1 h-8">
            <Plus className="h-4 w-4" />
            New Agent
          </Button>
        </header>

        {/* Filter bar */}
        <div className="flex items-center justify-between gap-3 px-5 py-3 border-b border-border/40 flex-wrap">
          {/* Status pills */}
          <div className="flex items-center gap-1.5">
            {STATUS_PILLS.map((pill) => (
              <button
                key={pill.id}
                onClick={() => setStatusFilter(pill.id)}
                className={cn(
                  "h-7 px-3 rounded-full text-xs font-medium transition-colors",
                  statusFilter === pill.id
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
            <Select value={squadFilter} onValueChange={setSquadFilter}>
              <SelectTrigger className="h-8 w-32 text-xs rounded-lg border-border">
                <SelectValue placeholder="All Squads" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Squads</SelectItem>
                {squads.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="relative">
              <MagnifyingGlass className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search agents..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-8 pl-8 pr-3 text-xs w-40 rounded-lg border-border"
              />
            </div>

            <span className="text-xs text-muted-foreground whitespace-nowrap">
              {filtered.length} agent{filtered.length !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 min-h-0 overflow-auto px-5 pt-4 pb-2">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 border border-dashed border-border/60 rounded-lg bg-muted/20">
              <p className="text-sm font-medium text-foreground">No agents found</p>
              <p className="text-xs text-muted-foreground mt-1">
                Try adjusting your search or filters.
              </p>
            </div>
          ) : (
            <div className="rounded-lg border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="hover:bg-transparent bg-muted/50">
                    <SortableHead col="name" label="Name" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} className="w-[26%]" />
                    <SortableHead col="role" label="Role" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} className="w-[18%]" />
                    <SortableHead col="type" label="Type" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} className="w-[10%]" />
                    <SortableHead col="squad" label="Squad" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} className="w-[12%]" />
                    <SortableHead col="status" label="Status" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} className="w-[10%]" />
                    <SortableHead col="model" label="Model" sortKey={sortKey} sortDir={sortDir} onSort={handleSort} className="w-[14%]" />
                    <TableHead className="text-xs font-medium text-muted-foreground w-[6%]">
                      Session
                    </TableHead>
                    <TableHead className="w-10" />
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((agent) => {
                    const activeRun = runs.find(
                      (r) =>
                        r.agentName === agent.name &&
                        (r.status === "running" || r.status === "pending"),
                    )
                    return (
                      <AgentTableRow
                        key={agent.id}
                        agent={agent}
                        activeRun={activeRun}
                        onSelect={setSelectedAgent}
                      />
                    )
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>

      {/* Agent Detail Panel */}
      <AgentDetailPanel
        agent={selectedAgent}
        onClose={() => setSelectedAgent(null)}
      />
    </>
  )
}
