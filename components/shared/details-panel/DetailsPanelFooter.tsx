import React from 'react'
import { cn } from '@/lib/utils'

interface DetailsPanelFooterProps {
  /**
   * Content to render in the footer (typically action buttons)
   */
  children: React.ReactNode

  /**
   * Additional CSS classes
   */
  className?: string
}

/**
 * DetailsPanelFooter
 *
 * A footer component for detail panels, typically containing action buttons
 * or other controls.
 *
 * Features:
 * - Sticky positioning at the bottom
 * - Border top separator
 * - Consistent padding
 * - Flexible content area
 *
 * @example
 * ```tsx
 * <DetailsPanelFooter>
 *   <Button variant="outline" onClick={onCancel}>Cancel</Button>
 *   <Button onClick={onSave}>Save Changes</Button>
 * </DetailsPanelFooter>
 * ```
 */
export function DetailsPanelFooter({
  children,
  className,
}: DetailsPanelFooterProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-end gap-2 border-t bg-background p-6',
        className
      )}
    >
      {children}
    </div>
  )
}
