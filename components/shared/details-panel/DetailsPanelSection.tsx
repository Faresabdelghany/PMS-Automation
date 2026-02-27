"use client"

import { useState } from "react"
import { CaretDown } from "@phosphor-icons/react/dist/ssr"
import { cn } from "@/lib/utils"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

type DetailsPanelSectionProps = {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
  collapsible?: boolean
  icon?: React.ReactNode
  actions?: React.ReactNode
  className?: string
}

export function DetailsPanelSection({
  title,
  children,
  defaultOpen = true,
  collapsible = false,
  icon,
  actions,
  className,
}: DetailsPanelSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  if (!collapsible) {
    return (
      <div className={cn("border-b border-border px-6 py-5", className)}>
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {icon}
            <h3 className="text-sm font-semibold text-foreground">{title}</h3>
          </div>
          {actions}
        </div>
        {children}
      </div>
    )
  }

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className={cn("border-b border-border", className)}
    >
      <div className="px-6 py-5">
        <div className="mb-4 flex items-center justify-between">
          <CollapsibleTrigger className="flex flex-1 items-center gap-2 text-left">
            {icon}
            <h3 className="text-sm font-semibold text-foreground">{title}</h3>
            <CaretDown
              className={cn(
                "h-4 w-4 text-muted-foreground transition-transform",
                isOpen && "rotate-180"
              )}
            />
          </CollapsibleTrigger>
          {actions}
        </div>
        <CollapsibleContent>{children}</CollapsibleContent>
      </div>
    </Collapsible>
  )
}
