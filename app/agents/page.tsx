import { Suspense } from "react"

import { AppSidebar } from "@/components/app-sidebar"
import { AgentsPage } from "@/components/agents/AgentsPage"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

export default function Agents() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <Suspense fallback={null}>
          <AgentsPage />
        </Suspense>
      </SidebarInset>
    </SidebarProvider>
  )
}
