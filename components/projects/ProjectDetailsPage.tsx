"use client"

import { useCallback, useEffect, useMemo, useState } from "react"
import dynamic from "next/dynamic"
import { LinkSimple, SquareHalf } from "@phosphor-icons/react/dist/ssr"
import { toast } from "sonner"
import { AnimatePresence, motion } from "motion/react"

import type { ProjectDetails, ProjectTask, WorkstreamTask } from "@/lib/data/project-details"
import { getProjectDetailsById } from "@/lib/data/project-details"
import { Breadcrumbs } from "@/components/projects/Breadcrumbs"
import { ProjectHeader } from "@/components/projects/ProjectHeader"
import { ScopeColumns } from "@/components/projects/ScopeColumns"
import { OutcomesList } from "@/components/projects/OutcomesList"
import { KeyFeaturesColumns } from "@/components/projects/KeyFeaturesColumns"
import { TimelineGantt } from "@/components/projects/TimelineGantt"
import { RightMetaPanel } from "@/components/projects/RightMetaPanel"

const WorkstreamTab = dynamic(
  () => import("@/components/projects/WorkstreamTab").then(m => m.WorkstreamTab),
  { ssr: false }
)
const ProjectTasksTab = dynamic(
  () => import("@/components/projects/ProjectTasksTab").then(m => m.ProjectTasksTab),
  { ssr: false }
)
const NotesTab = dynamic(
  () => import("@/components/projects/NotesTab").then(m => m.NotesTab),
  { ssr: false }
)
const AssetsFilesTab = dynamic(
  () => import("@/components/projects/AssetsFilesTab").then(m => m.AssetsFilesTab),
  { ssr: false }
)
const TaskDetailsPanel = dynamic(
  () => import("@/components/tasks/TaskDetailsPanel").then(m => m.TaskDetailsPanel),
  { ssr: false }
)
const ProjectWizard = dynamic(
  () => import("@/components/project-wizard/ProjectWizard").then(m => m.ProjectWizard),
  { ssr: false }
)
import { SidebarTrigger } from "@/components/ui/sidebar"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Skeleton } from "@/components/ui/skeleton"

type ProjectDetailsPageProps = {
  projectId: string
}

type LoadState =
  | { status: "loading" }
  | { status: "ready"; project: ProjectDetails }

export function ProjectDetailsPage({ projectId }: ProjectDetailsPageProps) {
  const [state, setState] = useState<LoadState>({ status: "loading" })
  const [showMeta, setShowMeta] = useState(true)
  const [isWizardOpen, setIsWizardOpen] = useState(false)
  const [detailTask, setDetailTask] = useState<ProjectTask | null>(null)

  useEffect(() => {
    let cancelled = false
    setState({ status: "loading" })

    const delay = 600 + Math.floor(Math.random() * 301)
    const t = setTimeout(() => {
      if (cancelled) return
      const project = getProjectDetailsById(projectId)
      setState({ status: "ready", project })
    }, delay)

    return () => {
      cancelled = true
      clearTimeout(t)
    }
  }, [projectId])

  const copyLink = useCallback(async () => {
    if (!navigator.clipboard) {
      toast.error("Clipboard not available")
      return
    }

    try {
      await navigator.clipboard.writeText(window.location.href)
      toast.success("Link copied")
    } catch {
      toast.error("Failed to copy link")
    }
  }, [])

  const projectName = state.status === "ready" ? state.project.name : null
  const breadcrumbs = useMemo(
    () => [
      { label: "Projects", href: "/" },
      { label: projectName ?? "Project Details" },
    ],
    [projectName]
  )

  const handleWorkstreamTaskClick = useCallback(
    (task: WorkstreamTask, groupId: string) => {
      if (state.status !== "ready") return
      const group = state.project.workstreams?.find((g) => g.id === groupId)
      const projectTask: ProjectTask = {
        ...task,
        projectId: state.project.id,
        projectName: state.project.name,
        workstreamId: groupId,
        workstreamName: group?.name ?? "",
      }
      setDetailTask(projectTask)
    },
    [state],
  )

  const openWizard = useCallback(() => {
    setIsWizardOpen(true)
  }, [])

  const closeWizard = useCallback(() => {
    setIsWizardOpen(false)
  }, [])

  if (state.status === "loading") {
    return <ProjectDetailsSkeleton />
  }

  const project = state.project

  return (
    <div className="flex flex-1 flex-col min-w-0 m-2 border border-border rounded-lg">
      <div className="flex items-center justify-between gap-4 px-4 py-4">
        <div className="flex items-center gap-3">
          <SidebarTrigger className="h-8 w-8 rounded-lg hover:bg-accent text-muted-foreground" />
          <div className="hidden sm:block">
            <Breadcrumbs items={breadcrumbs} />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="ghost" size="icon-sm" aria-label="Copy link" onClick={copyLink}>
            <LinkSimple className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon-sm"
            aria-pressed={!showMeta}
            aria-label={showMeta ? "Collapse meta panel" : "Expand meta panel"}
            className={showMeta ? "bg-muted" : ""}
            onClick={() => setShowMeta((v) => !v)}
          >
            <SquareHalf className="h-4 w-4" weight="duotone" />
          </Button>
        </div>
      </div>

      <div className="flex flex-1 flex-col bg-background px-2 my-0 rounded-b-lg min-w-0 border-t">
        <div className="px-4">
          <div className="mx-auto w-full max-w-7xl">

            <div
              className={
                "mt-0 grid grid-cols-1 gap-15 " +
                (showMeta
                  ? "lg:grid-cols-[minmax(0,2fr)_minmax(0,320px)]"
                  : "lg:grid-cols-[minmax(0,1fr)_minmax(0,0px)]")
              }
            >
              <div className="space-y-6 pt-4">
                <ProjectHeader project={project} onEditProject={openWizard} />

                <Tabs defaultValue="overview">
                  <TabsList className="w-full gap-6">
                    <TabsTrigger value="overview">Overview</TabsTrigger>
                    <TabsTrigger value="workstream">Workstream</TabsTrigger>
                    <TabsTrigger value="tasks">Tasks</TabsTrigger>
                    <TabsTrigger value="notes">Notes</TabsTrigger>
                    <TabsTrigger value="assets">Assets &amp; Files</TabsTrigger>
                  </TabsList>

                  <TabsContent value="overview">
                    <div className="space-y-10">
                      <p className="text-sm leading-6 text-muted-foreground">{project.description}</p>
                      <ScopeColumns scope={project.scope} />
                      <OutcomesList outcomes={project.outcomes} />
                      <KeyFeaturesColumns features={project.keyFeatures} />
                      <TimelineGantt tasks={project.timelineTasks} />
                    </div>
                  </TabsContent>

                  <TabsContent value="workstream">
                    <WorkstreamTab workstreams={project.workstreams} onTaskClick={handleWorkstreamTaskClick} />
                  </TabsContent>

                  <TabsContent value="tasks">
                    <ProjectTasksTab project={project} onTaskClick={setDetailTask} />
                  </TabsContent>

                  <TabsContent value="notes">
                    <NotesTab notes={project.notes || []} />
                  </TabsContent>

                  <TabsContent value="assets">
                    <AssetsFilesTab files={project.files} />
                  </TabsContent>
                </Tabs>
              </div>

              <AnimatePresence initial={false}>
                {showMeta ? (
                  <motion.div
                    key="meta-panel"
                    initial={{ x: 80, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    exit={{ x: 80, opacity: 0 }}
                    transition={{ type: "spring", stiffness: 260, damping: 26 }}
                    className="lg:border-l lg:border-border lg:pl-6"
                  >
                    <RightMetaPanel project={project} />
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>
          </div>
        </div>

        <Separator className="mt-auto" />

        {isWizardOpen ? (
          <ProjectWizard onClose={closeWizard} onCreate={closeWizard} />
        ) : null}
      </div>

      {detailTask !== null ? (
        <TaskDetailsPanel
          task={detailTask}
          open={true}
          onClose={() => setDetailTask(null)}
        />
      ) : null}
    </div>
  )
}

function ProjectDetailsSkeleton() {
  return (
    <div className="flex flex-1 flex-col bg-background mx-2 my-2 border border-border rounded-lg min-w-0">
      <div className="p-6">
        <div className="flex items-center gap-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-4" />
          <Skeleton className="h-4 w-48" />
        </div>

        <div className="mt-4">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="mt-3 h-8 w-[360px]" />
          <Skeleton className="mt-3 h-5 w-[520px]" />
          <Skeleton className="mt-5 h-px w-full" />
          <Skeleton className="mt-5 h-16 w-full" />
        </div>

        <div className="mt-8 grid grid-cols-1 gap-8 lg:grid-cols-[1fr_320px]">
          <div className="space-y-8">
            <Skeleton className="h-32 w-full" />
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-28 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>

          <div className="space-y-4">
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-52 w-full" />
            <Skeleton className="h-64 w-full" />
          </div>
        </div>
      </div>
    </div>
  )
}
