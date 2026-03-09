"use client"

import { useEffect, useMemo, useState } from "react"
import { formatDistanceToNow } from "date-fns"
import { useRouter } from "next/navigation"
import { Bell, ChatCircleDots, CheckCircle, EnvelopeSimple } from "@phosphor-icons/react/dist/ssr"

import { SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { cn } from "@/lib/utils"
import { InboxFilterPopover } from "./InboxFilterPopover"
import {
  fetchNotifications,
  getNotificationRoute,
  markAllNotificationsRead,
  markNotificationRead,
  type InboxCategory,
  type InboxNotification,
} from "@/lib/services/notifications"

type InboxFilters = {
  types: InboxCategory[]
  clients: string[]
}

function getTypeIcon(type: InboxCategory) {
  if (type === "comment") return ChatCircleDots
  if (type === "task") return CheckCircle
  if (type === "client") return EnvelopeSimple
  if (type === "project") return Bell
  return Bell
}

function getTypeLabel(type: InboxCategory): string {
  if (type === "comment") return "Comment"
  if (type === "task") return "Task"
  if (type === "client") return "Client"
  if (type === "project") return "Project"
  return "Update"
}

export function InboxPage() {
  const router = useRouter()
  const [tab, setTab] = useState<"all" | "unread" | "mentions">("all")
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [filters, setFilters] = useState<InboxFilters>({ types: [], clients: [] })
  const [inboxItems, setInboxItems] = useState<InboxNotification[]>([])
  const [loading, setLoading] = useState(true)

  const loadNotifications = async () => {
    setLoading(true)
    const rows = await fetchNotifications({
      unreadOnly: tab === "unread",
      categories: filters.types,
      clients: filters.clients,
      limit: 300,
    })
    setInboxItems(rows)
    setLoading(false)
  }

  useEffect(() => {
    loadNotifications()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, filters])

  const availableClients = useMemo(
    () =>
      Array.from(
        new Set(
          inboxItems
            .map((item) => {
              const metadataClient = item.metadata.client as string | undefined
              const metadataClientName = item.metadata.client_name as string | undefined
              return metadataClient ?? metadataClientName
            })
            .filter((value): value is string => !!value),
        ),
      ),
    [inboxItems],
  )

  const items = useMemo(() => inboxItems, [inboxItems])

  useEffect(() => {
    if (!items.length) {
      setSelectedId(null)
      return
    }

    if (!selectedId || !items.some((item) => item.id === selectedId)) {
      setSelectedId(items[0].id)
    }
  }, [items, selectedId])

  const selected = useMemo(() => {
    if (!selectedId) return null
    return inboxItems.find((item) => item.id === selectedId) ?? null
  }, [selectedId, inboxItems])

  const markItemAsRead = async (id: string) => {
    const ok = await markNotificationRead(id)
    if (!ok) return
    setInboxItems((prev) => prev.map((item) => (item.id === id ? { ...item, unread: false } : item)))
  }

  const markAllAsRead = async () => {
    const ok = await markAllNotificationsRead()
    if (!ok) return
    setInboxItems((prev) => prev.map((item) => (item.unread ? { ...item, unread: false } : item)))
  }

  const openRelatedWork = (item: InboxNotification) => {
    const route = getNotificationRoute(item)
    if (route) {
      router.push(route)
      return
    }
    router.push("/tasks")
  }

  return (
    <div className="flex flex-1 flex-col min-h-0 bg-background mx-2 my-2 border border-border rounded-lg min-w-0">
      <header className="flex flex-col border-b border-border/40">
        <div className="flex items-center justify-between px-4 py-3 border-b border-border/70">
          <div className="flex items-center gap-3">
            <SidebarTrigger className="h-8 w-8 rounded-lg hover:bg-accent text-muted-foreground" />
            <p className="text-base font-medium text-foreground">Inbox</p>
          </div>
          <div className="flex items-center gap-2">
            <Button size="sm" variant="ghost" onClick={markAllAsRead}>
              Mark all as read
            </Button>
          </div>
        </div>

        <div className="flex flex-col gap-2 px-4 pb-3 pt-3 md:flex-row md:items-center md:justify-between">
          <div className="flex w-full md:w-auto md:justify-start">
            <InboxFilterPopover filters={filters} availableClients={availableClients} onChange={setFilters} />
          </div>

          <Tabs value={tab} onValueChange={(value) => setTab(value as typeof tab)} className="w-full md:w-auto">
            <TabsList className="inline-flex w-full justify-between rounded-full border border-border/50 bg-muted px-1 py-0.5 text-xs md:w-auto md:justify-start h-8">
              <TabsTrigger
                value="all"
                className="h-7 rounded-full px-3 text-xs data-[state=active]:bg-background data-[state=active]:text-foreground"
              >
                All
              </TabsTrigger>
              <TabsTrigger
                value="unread"
                className="h-7 rounded-full px-3 text-xs data-[state=active]:bg-background data-[state=active]:text-foreground"
              >
                Unread
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </header>

      <div className="flex-1 min-h-0 flex flex-col md:flex-row">
        <div className="border-b border-border/40 md:border-b-0 md:border-r md:w-[320px] lg:w-[360px] flex flex-col min-h-0">
          <div className="flex-1 min-h-0 overflow-y-auto px-2 py-2 space-y-1">
            {loading ? (
              <div className="px-3 py-3 text-xs text-muted-foreground">Loading notifications...</div>
            ) : items.length === 0 ? (
              <div className="px-3 py-3 text-xs text-muted-foreground">No notifications yet.</div>
            ) : (
              items.map((item) => {
                const Icon = getTypeIcon(item.category)
                const isSelected = item.id === selectedId
                const metadataClient = (item.metadata.client as string | undefined) ?? (item.metadata.client_name as string | undefined)
                const metadataProject = item.metadata.project_name as string | undefined

                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => {
                      setSelectedId(item.id)
                      if (item.unread) {
                        markItemAsRead(item.id)
                      }
                    }}
                    className={cn(
                      "flex w-full items-start gap-3 rounded-lg px-3 py-2 text-left transition-colors",
                      isSelected ? "bg-muted" : "hover:bg-muted/70",
                    )}
                  >
                    <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted text-muted-foreground">
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="flex flex-1 flex-col gap-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-xs font-medium text-foreground truncate">{item.title}</p>
                        <span className="shrink-0 text-[10px] text-muted-foreground">
                          {formatDistanceToNow(item.createdAt, { addSuffix: true })}
                        </span>
                      </div>
                      <p className="text-[11px] text-muted-foreground line-clamp-2">{item.summary}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline" className="h-5 rounded-full px-2 text-[10px] font-medium">
                          {getTypeLabel(item.category)}
                        </Badge>
                        {metadataClient && <span className="text-[10px] text-muted-foreground truncate">{metadataClient}</span>}
                        {metadataProject && <span className="text-[10px] text-muted-foreground truncate">{metadataProject}</span>}
                        {item.unread && <span className="ml-auto h-2 w-2 rounded-full bg-emerald-500" />}
                      </div>
                    </div>
                  </button>
                )
              })
            )}
          </div>
        </div>

        <div className="flex-1 min-h-0 flex flex-col">
          {selected ? (
            <div className="flex-1 min-h-0 flex flex-col px-4 py-4 gap-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex items-start gap-3">
                  <Avatar className="h-9 w-9">
                    <AvatarFallback className="text-xs font-semibold">
                      {((selected.metadata.client as string | undefined) ?? (selected.metadata.project_name as string | undefined) ?? "N")[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col gap-1 min-w-0">
                    <p className="text-sm font-medium text-foreground">{selected.title}</p>
                    <div className="flex flex-wrap items-center gap-2 text-[11px] text-muted-foreground">
                      {(selected.metadata.client as string | undefined) && <span>{selected.metadata.client as string}</span>}
                      {(selected.metadata.project_name as string | undefined) && (
                        <span className="flex items-center gap-1">
                          <span className="h-1 w-1 rounded-full bg-muted-foreground" />
                          <span>{selected.metadata.project_name as string}</span>
                        </span>
                      )}
                      <span className="flex items-center gap-1">
                        <span className="h-1 w-1 rounded-full bg-muted-foreground" />
                        <span>{formatDistanceToNow(selected.createdAt, { addSuffix: true })}</span>
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={selected.unread ? "default" : "outline"} className="h-6 rounded-full px-2 text-[10px]">
                    {selected.unread ? "Unread" : "Read"}
                  </Badge>
                </div>
              </div>

              <div className="flex-1 min-h-0 rounded-xl border border-border bg-card/80 px-4 py-3">
                <div className="text-sm leading-relaxed text-foreground space-y-2">
                  <p className="text-[13px]">{selected.summary || "No additional details."}</p>

                  {Array.isArray(selected.metadata.next_steps) && (selected.metadata.next_steps as string[]).length > 0 && (
                    <div>
                      <p className="text-xs font-semibold mb-1">Suggested next steps</p>
                      {(selected.metadata.next_steps as string[]).map((step, idx) => (
                        <p key={idx} className="pl-4 text-[13px]">
                          <span className="mr-1">•</span>
                          {step}
                        </p>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2">
                <div className="flex items-center gap-2">
                  <Button size="sm" variant="outline" onClick={() => openRelatedWork(selected)}>
                    Open related work
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => {
                      if (selected.unread) {
                        markItemAsRead(selected.id)
                      }
                    }}
                  >
                    Mark as read
                  </Button>
                </div>
              </div>
            </div>
          ) : (
            <div className="flex-1 min-h-0 flex items-center justify-center text-xs text-muted-foreground">
              Select an item from the list to see details.
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
