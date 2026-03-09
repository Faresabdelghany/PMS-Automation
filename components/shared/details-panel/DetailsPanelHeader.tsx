import React from 'react'
import { X, ChevronLeft, MoreVertical } from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { cn } from '@/lib/utils'

interface DetailsPanelHeaderProps {
  /**
   * The title to display in the header
   */
  title: string

  /**
   * Optional subtitle or description
   */
  subtitle?: string

  /**
   * Callback when close button is clicked
   */
  onClose?: () => void

  /**
   * Callback when back button is clicked
   */
  onBack?: () => void

  /**
   * Additional actions to display in a dropdown menu
   */
  actions?: Array<{
    label: string
    onClick: () => void
    variant?: 'default' | 'destructive'
    disabled?: boolean
  }>

  /**
   * Custom action buttons to render alongside the close button
   */
  customActions?: React.ReactNode

  /**
   * Additional CSS classes
   */
  className?: string
}

/**
 * DetailsPanelHeader
 *
 * A standardized header component for detail panels with title, optional actions,
 * and close/back navigation.
 *
 * Features:
 * - Title and optional subtitle
 * - Close button (X icon)
 * - Optional back button (chevron icon)
 * - Dropdown menu for additional actions
 * - Custom action slot for specialized buttons
 *
 * @example
 * ```tsx
 * <DetailsPanelHeader
 *   title="User Details"
 *   subtitle="John Doe"
 *   onClose={() => setIsOpen(false)}
 *   actions={[
 *     { label: 'Edit', onClick: handleEdit },
 *     { label: 'Delete', onClick: handleDelete, variant: 'destructive' }
 *   ]}
 * />
 * ```
 */
export function DetailsPanelHeader({
  title,
  subtitle,
  onClose,
  onBack,
  actions,
  customActions,
  className,
}: DetailsPanelHeaderProps) {
  return (
    <div
      className={cn(
        'flex items-start justify-between gap-4 border-b bg-background p-6',
        className
      )}
    >
      <div className="flex items-start gap-3 min-w-0 flex-1">
        {onBack && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="shrink-0 mt-0.5"
            aria-label="Go back"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
        )}

        <div className="min-w-0 flex-1">
          <h2 className="text-lg font-semibold leading-tight truncate">
            {title}
          </h2>
          {subtitle && (
            <p className="text-sm text-muted-foreground mt-1 truncate">
              {subtitle}
            </p>
          )}
        </div>
      </div>

      <div className="flex items-center gap-2 shrink-0">
        {customActions}

        {actions && actions.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="More actions">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {actions.map((action, index) => (
                <DropdownMenuItem
                  key={index}
                  onClick={action.onClick}
                  disabled={action.disabled}
                  className={cn(
                    action.variant === 'destructive' &&
                      'text-destructive focus:text-destructive'
                  )}
                >
                  {action.label}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}

        {onClose && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            aria-label="Close panel"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>
    </div>
  )
}
