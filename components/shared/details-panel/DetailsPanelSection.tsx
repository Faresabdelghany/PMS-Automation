import React from 'react'
import { cn } from '@/lib/utils'

interface DetailsPanelSectionProps {
  /**
   * Optional section title
   */
  title?: string

  /**
   * Optional section description
   */
  description?: string

  /**
   * Content to render in the section
   */
  children: React.ReactNode

  /**
   * Additional CSS classes
   */
  className?: string
}

/**
 * DetailsPanelSection
 *
 * A content section component for organizing information within detail panels.
 * Provides consistent spacing and optional title/description headers.
 *
 * Features:
 * - Optional title and description
 * - Consistent padding and spacing
 * - Flexible content area
 *
 * @example
 * ```tsx
 * <DetailsPanelSection
 *   title="Contact Information"
 *   description="User's primary contact details"
 * >
 *   <div>Email: user@example.com</div>
 *   <div>Phone: (555) 123-4567</div>
 * </DetailsPanelSection>
 * ```
 */
export function DetailsPanelSection({
  title,
  description,
  children,
  className,
}: DetailsPanelSectionProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {(title || description) && (
        <div className="space-y-1">
          {title && (
            <h3 className="text-sm font-medium leading-none">{title}</h3>
          )}
          {description && (
            <p className="text-sm text-muted-foreground">{description}</p>
          )}
        </div>
      )}
      <div>{children}</div>
    </div>
  )
}
