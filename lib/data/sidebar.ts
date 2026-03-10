export type NavItemId = "inbox" | "my-tasks" | "projects" | "activity" | "performance" | "agents"

export type SidebarFooterItemId = "settings" | "templates" | "help"

export type NavItem = {
    id: NavItemId
    label: string
    badge?: number
    isActive?: boolean
}

export type ActiveProjectSummary = {
    id: string
    name: string
    color: string
    progress: number
}

export type SidebarFooterItem = {
    id: SidebarFooterItemId
    label: string
}

export const navItems: NavItem[] = [
    { id: "inbox", label: "Inbox" },
    { id: "my-tasks", label: "Tasks" },
    { id: "projects", label: "Projects", isActive: true },
    { id: "activity", label: "Activity" },
    { id: "performance", label: "Performance" },
    { id: "agents", label: "Agents" },
]

export const activeProjects: ActiveProjectSummary[] = []

export const footerItems: SidebarFooterItem[] = [
    { id: "settings", label: "Settings" },
    { id: "templates", label: "Templates" },
    { id: "help", label: "Help" },
]
