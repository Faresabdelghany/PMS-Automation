"use client"

import { useMemo, useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import type { Agent, AgentType } from "@/lib/data/agents"
import { fetchAgentLogs, type AgentLog } from "@/lib/services/agents"
import { cn } from "@/lib/utils"
import { formatDistanceToNow, format } from "date-fns"
import {
  X,
  Robot,
  Users,
  Lightning,
  CircleHalf,
  Cpu,
  TreeStructure,
  Plugs,
  CheckCircle,
  XCircle,
  Clock,
  Pencil,
} from "@phosphor-icons/react/dist/ssr"

// ─── Helpers ───

function formatTimeAgo(dateStr: string): string {
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true })
  } catch {
    return "—"
  }
}

function formatTime(dateStr: string): string {
  try {
    return format(new Date(dateStr), "MMM d, HH:mm")
  } catch {
    return "—"
  }
}

// ─── Status config ───

const statusDotColor: Record<string, string> = {
  online: "bg-emerald-500",
  busy: "bg-amber-500",
  idle: "bg-blue-400",
  offline: "bg-zinc-400",
}

const statusTextColor: Record<string, string> = {
  online: "text-emerald-600 dark:text-emerald-400",
  busy: "text-amber-600 dark:text-amber-400",
  idle: "text-blue-600 dark:text-blue-400",
  offline: "text-zinc-500 dark:text-zinc-400",
}

const TYPE_BADGE: Record<AgentType, string> = {
  Specialist: "bg-teal-50 text-teal-700 border-transparent dark:bg-teal-500/15 dark:text-teal-300",
  Lead: "bg-blue-50 text-blue-700 border-transparent dark:bg-blue-500/15 dark:text-blue-300",
  Supreme: "bg-purple-50 text-purple-700 border-transparent dark:bg-purple-500/15 dark:text-purple-300",
}

// ─── Info Card ───

function InfoCard({
  icon: Icon,
  label,
  value,
  className,
}: {
  icon: React.ComponentType<{ className?: string }>
  label: string
  value: string
  className?: string
}) {
  return (
    <div className={cn("rounded-xl border border-border/60 bg-muted/30 px-4 py-3", className)}>
      <div className="flex items-center gap-2 mb-1">
        <Icon className="h-3.5 w-3.5 text-muted-foreground" />
        <span className="text-[11px] text-muted-foreground uppercase tracking-wider font-medium">
          {label}
        </span>
      </div>
      <p className="text-sm font-medium text-foreground truncate">{value}</p>
    </div>
  )
}

// ─── Agent Detail Panel ───

interface AgentDetailPanelProps {
  agent: Agent | null
  onClose: () => void
}

export function AgentDetailPanel({ agent, onClose }: AgentDetailPanelProps) {
  const [agentLogs, setAgentLogs] = useState<AgentLog[]>([])

  // Fetch ALL logs fresh every time agent changes
  useEffect(() => {
    if (!agent) { setAgentLogs([]); return }
    let cancelled = false
    fetchAgentLogs(500).then((all) => {
      if (!cancelled) {
        setAgentLogs(all.filter((l) => l.agentName === agent.name))
      }
    })
    return () => { cancelled = true }
  }, [agent])

  if (!agent) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div
        className="flex w-full max-w-[960px] max-h-[90vh] rounded-2xl bg-background shadow-2xl border border-border overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex flex-col flex-1 min-h-0">
          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-border/60 shrink-0">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 shrink-0">
                <Robot className="h-5 w-5 text-primary" weight="duotone" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground">{agent.name}</h2>
                <p className="text-sm text-muted-foreground">{agent.roleLabel}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" className="h-8 text-xs gap-1.5">
                <Pencil className="h-3.5 w-3.5" />
                Edit
              </Button>
              <Button variant="ghost" size="icon" className="h-8 w-8" onClick={onClose}>
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Scrollable body */}
          <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6 min-h-0">
            {/* Type + Status badges row */}
            <div className="flex items-center gap-3 flex-wrap">
              <Badge
                variant="outline"
                className={cn(
                  "rounded-full text-xs font-medium px-3 py-1 border",
                  TYPE_BADGE[agent.agentType],
                )}
              >
                {agent.agentType}
              </Badge>
              <Badge variant="secondary" className="rounded-full text-xs font-normal px-3 py-1">
                {agent.squad}
              </Badge>
              <div className="flex items-center gap-1.5">
                <span className={cn("h-2 w-2 rounded-full", statusDotColor[agent.status])} />
                <span className={cn("text-sm font-medium", statusTextColor[agent.status])}>
                  {agent.status.charAt(0).toUpperCase() + agent.status.slice(1)}
                </span>
              </div>
              <div className="ml-auto flex items-center gap-1.5">
                <Switch className="h-4 w-7 data-[state=checked]:bg-emerald-500" defaultChecked />
                <span className="text-xs text-muted-foreground">Active</span>
              </div>
            </div>

            {/* Description */}
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Description
              </h3>
              <p className="text-sm text-foreground/80 leading-relaxed">{agent.description}</p>
            </div>

            {/* Info grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <InfoCard icon={Cpu} label="AI Model" value={agent.model} />
              <InfoCard icon={Plugs} label="Provider" value={agent.provider} />
              <InfoCard icon={CircleHalf} label="Status" value={agent.status} />
              <InfoCard icon={Users} label="Squad" value={agent.squad} />
              <InfoCard icon={Lightning} label="Type" value={agent.agentType} />
              <InfoCard icon={TreeStructure} label="Reports To" value={agent.reportsTo} />
              <InfoCard
                icon={Clock}
                label="Last Active"
                value={agent.lastActive ? formatTimeAgo(agent.lastActive) : "—"}
              />
              <InfoCard
                icon={Robot}
                label="Tasks Done"
                value={String(agentLogs.filter((l) => l.status === "completed").length)}
              />
            </div>

            {/* Skills */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                  Skills
                </h3>
                <Button variant="ghost" size="sm" className="h-6 text-[11px] text-muted-foreground">
                  + Manage
                </Button>
              </div>
              <div className="flex flex-wrap gap-2">
                {agent.skills.map((skill) => (
                  <span
                    key={skill}
                    className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-medium bg-muted text-muted-foreground border border-border/60"
                  >
                    <Lightning className="h-3 w-3 text-muted-foreground/60" />
                    {skill}
                  </span>
                ))}
              </div>
            </div>

            {/* Recent Activity — ALL logs */}
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                Recent Activity
              </h3>
              {agentLogs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-8 text-center border border-dashed border-border/60 rounded-lg">
                  <Robot className="h-8 w-8 text-muted-foreground/30 mb-2" />
                  <p className="text-sm text-muted-foreground">No activity recorded yet</p>
                </div>
              ) : (
                <div className="relative">
                  {/* Timeline line */}
                  <div className="absolute left-[15px] top-3 bottom-3 w-px bg-border/60" />

                  <div className="space-y-2">
                    {agentLogs.map((log) => (
                      <div key={log.id} className="relative flex items-start gap-3">
                        {/* Timeline dot */}
                        <div className="relative z-10 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border bg-background">
                          {log.status === "completed" ? (
                            <CheckCircle
                              className="h-4 w-4 text-emerald-500"
                              weight="fill"
                            />
                          ) : log.status === "failed" ? (
                            <XCircle className="h-4 w-4 text-red-500" weight="fill" />
                          ) : (
                            <Clock className="h-4 w-4 text-amber-500" weight="fill" />
                          )}
                        </div>

                        {/* Content */}
                        <div className="flex-1 min-w-0 rounded-lg border border-border/40 px-3.5 py-2.5 hover:border-border hover:bg-muted/30 transition-colors">
                          <div className="flex items-start justify-between gap-3">
                            <p className="text-sm text-foreground leading-relaxed flex-1">
                              {log.taskDescription}
                            </p>
                            <Badge
                              variant="outline"
                              className={cn(
                                "shrink-0 rounded-full text-[10px] px-2 py-0.5 border",
                                log.status === "completed"
                                  ? "bg-emerald-50 text-emerald-700 border-transparent dark:bg-emerald-500/15 dark:text-emerald-300"
                                  : log.status === "failed"
                                    ? "bg-red-50 text-red-700 border-transparent dark:bg-red-500/15 dark:text-red-300"
                                    : "bg-amber-50 text-amber-700 border-transparent dark:bg-amber-500/15 dark:text-amber-300",
                              )}
                            >
                              {log.status}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 mt-1.5">
                            <span className="text-[11px] text-muted-foreground">
                              {formatTime(log.createdAt)}
                            </span>
                            <span className="text-[11px] text-muted-foreground/50">·</span>
                            <span className="text-[11px] text-muted-foreground/60">
                              {formatTimeAgo(log.createdAt)}
                            </span>
                            {log.modelUsed && (
                              <>
                                <span className="text-[11px] text-muted-foreground/50">·</span>
                                <span className="text-[10px] text-muted-foreground/50 font-mono">
                                  {log.modelUsed}
                                </span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
