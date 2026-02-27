"use client"

import { cn } from "@/lib/utils"

type DetailsPanelLayoutProps = {
  leftContent: React.ReactNode
  rightContent: React.ReactNode
  footer: React.ReactNode
  className?: string
}

export function DetailsPanelLayout({
  leftContent,
  rightContent,
  footer,
  className,
}: DetailsPanelLayoutProps) {
  return (
    <div className={cn("flex h-full w-full flex-col", className)}>
      {/* Main content area with split view */}
      <div className="flex-1 overflow-hidden">
        <div className="grid h-full grid-cols-1 lg:grid-cols-[1fr_320px]">
          {/* Left side - scrollable main content */}
          <div className="overflow-y-auto border-r border-border">
            {leftContent}
          </div>

          {/* Right side - scrollable sidebar */}
          <div className="hidden overflow-y-auto bg-muted/30 lg:block">
            {rightContent}
          </div>
        </div>
      </div>

      {/* Footer - sticky at bottom */}
      {footer}
    </div>
  )
}
