import { Suspense } from "react"
import { AppSidebar } from "@/components/app-sidebar"
import { ActivityPage } from "@/components/activity/ActivityPage"
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar"

export default function Activity() {
  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset>
        <Suspense fallback={null}>
          <ActivityPage />
        </Suspense>
      </SidebarInset>
    </SidebarProvider>
  )
}
