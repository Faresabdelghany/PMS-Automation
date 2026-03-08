import { AppSidebar } from "@/components/app-sidebar"
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
        <div className="m-2 rounded-lg border border-border bg-background p-6">
          <h1 className="text-lg font-semibold">Project Backlog</h1>
          <p className="mt-2 text-sm text-muted-foreground">Backlog route is active for project {id}.</p>
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
