import { cn } from "@/lib/utils"
import { Badge } from "@/components/ui/badge"

const LIFECYCLE_STYLES: Record<string, { bg: string; label: string }> = {
  queued: { bg: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400", label: "Queued" },
  ready: { bg: "bg-blue-100 text-blue-600 dark:bg-blue-900/40 dark:text-blue-400", label: "Ready" },
  in_progress: { bg: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400", label: "In Progress" },
  dev_done: { bg: "bg-orange-100 text-orange-600 dark:bg-orange-900/40 dark:text-orange-400", label: "Dev Done" },
  in_test: { bg: "bg-purple-100 text-purple-600 dark:bg-purple-900/40 dark:text-purple-400", label: "In Test" },
  changes_requested: { bg: "bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-400", label: "Changes Requested" },
  tested_passed: { bg: "bg-lime-100 text-lime-700 dark:bg-lime-900/40 dark:text-lime-400", label: "Tests Passed" },
  in_review: { bg: "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-400", label: "In Review" },
  done: { bg: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400", label: "Done" },
  failed: { bg: "bg-red-200 text-red-700 dark:bg-red-900/50 dark:text-red-400", label: "Failed" },
  cancelled: { bg: "bg-zinc-200 text-zinc-500 line-through dark:bg-zinc-800 dark:text-zinc-500", label: "Cancelled" },
}

// Fallback for old 3-state statuses
const FALLBACK_STYLES: Record<string, { bg: string; label: string }> = {
  todo: { bg: "bg-zinc-100 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400", label: "To Do" },
  "in-progress": { bg: "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-400", label: "In Progress" },
  done: { bg: "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-400", label: "Done" },
}

type LifecycleBadgeProps = {
  lifecycleStatus?: string
  status?: string
  className?: string
  size?: "sm" | "md"
}

export function LifecycleBadge({ lifecycleStatus, status, className, size = "sm" }: LifecycleBadgeProps) {
  const displayStatus = lifecycleStatus || status || "queued"
  const style = LIFECYCLE_STYLES[displayStatus] || FALLBACK_STYLES[displayStatus] || LIFECYCLE_STYLES.queued

  return (
    <Badge
      className={cn(
        "border-0 font-medium",
        size === "sm" ? "text-[10px] px-1.5 h-5" : "text-xs px-2 h-6",
        style.bg,
        className,
      )}
    >
      {style.label}
    </Badge>
  )
}

/** Lifecycle dot indicator for compact views */
export function LifecycleDot({ lifecycleStatus }: { lifecycleStatus?: string }) {
  const dotColors: Record<string, string> = {
    queued: "bg-zinc-400",
    ready: "bg-blue-500",
    in_progress: "bg-amber-500",
    dev_done: "bg-orange-500",
    in_test: "bg-purple-500",
    changes_requested: "bg-red-500",
    tested_passed: "bg-lime-500",
    in_review: "bg-indigo-500",
    done: "bg-emerald-500",
    failed: "bg-red-600",
    cancelled: "bg-zinc-400",
  }
  const color = dotColors[lifecycleStatus || "queued"] || "bg-zinc-400"
  return <span className={cn("h-2 w-2 rounded-full inline-block", color)} />
}

/** Lifecycle timeline bar showing progression through states */
export function LifecycleTimeline({ currentStatus }: { currentStatus?: string }) {
  const stages = [
    "queued", "ready", "in_progress", "dev_done", "in_test",
    "tested_passed", "in_review", "done",
  ]
  const currentIdx = stages.indexOf(currentStatus || "queued")
  const isFailed = currentStatus === "failed"
  const isCancelled = currentStatus === "cancelled"
  const isChangesRequested = currentStatus === "changes_requested"

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-1">
        {stages.map((stage, idx) => {
          const isPast = idx <= currentIdx && !isFailed && !isCancelled
          const isCurrent = stage === currentStatus
          const style = LIFECYCLE_STYLES[stage]
          return (
            <div key={stage} className="flex-1 flex flex-col items-center gap-1">
              <div
                className={cn(
                  "h-1.5 w-full rounded-full transition-colors",
                  isPast ? "bg-emerald-500" : isCurrent ? "bg-amber-500" : "bg-zinc-200 dark:bg-zinc-700",
                  isFailed && idx === currentIdx && "bg-red-500",
                )}
              />
              {isCurrent && (
                <span className="text-[9px] text-muted-foreground font-medium">{style.label}</span>
              )}
            </div>
          )
        })}
      </div>
      {(isFailed || isCancelled || isChangesRequested) && (
        <div className="flex items-center gap-1.5">
          <LifecycleDot lifecycleStatus={currentStatus} />
          <span className="text-xs font-medium text-muted-foreground">
            {LIFECYCLE_STYLES[currentStatus || "queued"]?.label}
          </span>
        </div>
      )}
    </div>
  )
}
