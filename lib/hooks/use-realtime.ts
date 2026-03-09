"use client"

import { useEffect, useRef, useCallback } from "react"
import { supabase } from "@/lib/supabase"
import type { RealtimeChannel } from "@supabase/supabase-js"

type RealtimeEvent = "INSERT" | "UPDATE" | "DELETE" | "*"

type SubscriptionConfig = {
  table: string
  event?: RealtimeEvent
  filter?: string
  onPayload: (payload: { new: Record<string, unknown>; old: Record<string, unknown>; eventType: string }) => void
}

/**
 * Subscribe to one or more Supabase Realtime channels.
 * Returns cleanup automatically on unmount.
 */
export function useRealtimeSubscription(subscriptions: SubscriptionConfig[], deps: unknown[] = []) {
  const channelRef = useRef<RealtimeChannel | null>(null)

  useEffect(() => {
    const channelName = `pms-rt-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
    let channel = supabase.channel(channelName)

    for (const sub of subscriptions) {
      const event = sub.event ?? "*"
      const config: Record<string, string> = {
        event,
        schema: "public",
        table: sub.table,
      }
      if (sub.filter) config.filter = sub.filter

      channel = channel.on(
        "postgres_changes" as "system",
        config as unknown as { event: string },
        (payload: unknown) => {
          const p = payload as { new: Record<string, unknown>; old: Record<string, unknown>; eventType: string }
          sub.onPayload(p)
        },
      )
    }

    channel.subscribe()
    channelRef.current = channel

    return () => {
      supabase.removeChannel(channel)
      channelRef.current = null
    }
  }, deps) // eslint-disable-line react-hooks/exhaustive-deps
}

/**
 * Subscribe to realtime changes for a specific task's events and runs.
 */
export function useTaskRealtime(
  taskId: string | null,
  callbacks: {
    onTaskEvent?: (event: Record<string, unknown>) => void
    onAgentRun?: (run: Record<string, unknown>) => void
    onTodoUpdate?: (todo: Record<string, unknown>) => void
  },
) {
  const { onTaskEvent, onAgentRun, onTodoUpdate } = callbacks

  useRealtimeSubscription(
    taskId
      ? [
          ...(onTaskEvent
            ? [
                {
                  table: "task_events",
                  event: "INSERT" as RealtimeEvent,
                  filter: `todo_id=eq.${taskId}`,
                  onPayload: (p: { new: Record<string, unknown> }) => onTaskEvent(p.new),
                },
              ]
            : []),
          ...(onAgentRun
            ? [
                {
                  table: "agent_runs",
                  filter: `todo_id=eq.${taskId}`,
                  onPayload: (p: { new: Record<string, unknown> }) => onAgentRun(p.new),
                },
              ]
            : []),
          ...(onTodoUpdate
            ? [
                {
                  table: "todos",
                  event: "UPDATE" as RealtimeEvent,
                  filter: `id=eq.${taskId}`,
                  onPayload: (p: { new: Record<string, unknown> }) => onTodoUpdate(p.new),
                },
              ]
            : []),
        ]
      : [],
    [taskId],
  )
}

/**
 * Subscribe to global agent activity (runs + events across all tasks).
 */
export function useAgentMonitorRealtime(callbacks: {
  onAgentRun?: (run: Record<string, unknown>) => void
  onTaskEvent?: (event: Record<string, unknown>) => void
  onTodoUpdate?: (todo: Record<string, unknown>) => void
}) {
  const { onAgentRun, onTaskEvent, onTodoUpdate } = callbacks

  useRealtimeSubscription([
    ...(onAgentRun
      ? [
          {
            table: "agent_runs",
            onPayload: (p: { new: Record<string, unknown> }) => onAgentRun(p.new),
          },
        ]
      : []),
    ...(onTaskEvent
      ? [
          {
            table: "task_events",
            onPayload: (p: { new: Record<string, unknown> }) => onTaskEvent(p.new),
          },
        ]
      : []),
    ...(onTodoUpdate
      ? [
          {
            table: "todos",
            onPayload: (p: { new: Record<string, unknown> }) => onTodoUpdate(p.new),
          },
        ]
      : []),
  ])
}
