# Task Details Panel Testing Checklist

## Basic Functionality
- [ ] Panel opens when clicking task name
- [ ] Panel closes with X button
- [ ] Panel closes with Cancel button
- [ ] Panel closes with Escape key

## Editing
- [ ] Task name can be edited
- [ ] Status badge shows current status
- [ ] Assignee displays correctly
- [ ] Due date can be selected
- [ ] Priority shows correct badge
- [ ] Description editor works
- [ ] Comments can be added
- [ ] Files display correctly
- [ ] Related tasks display correctly

## State Management
- [ ] Changes mark panel as dirty
- [ ] Save button enables when dirty
- [ ] Save button disabled when not dirty
- [ ] Unsaved changes warning appears
- [ ] Cancel discards changes
- [ ] Save commits all changes

## Keyboard Shortcuts
- [ ] Cmd/Ctrl+Enter saves
- [ ] Escape closes panel

## Activity Timeline
- [ ] Timeline displays events
- [ ] Events show correct timestamps
- [ ] Events show user avatars

## Responsive
- [ ] Panel works on desktop
- [ ] Panel adapts on tablet
- [ ] Layout stacks on mobile

## Performance
- [ ] Panel opens quickly (<300ms)
- [ ] No layout shift on open
- [ ] Smooth animations
