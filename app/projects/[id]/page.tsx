import { Suspense } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { ProjectDetailsPage } from "@/components/projects/ProjectDetailsPage"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

type PageProps = {
  params: Promise<{ id: string }>
}

export default async function Page({ params }: PageProps) {
  const { id } = await params
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <Suspense fallback={null}>
          <ProjectDetailsPage projectId={id} />
        </Suspense>
      </SidebarInset>
    </SidebarProvider>
  )
}
