# Task Details Panel Design

**Date:** 2026-02-27
**Status:** Approved
**Type:** Feature Addition

## Overview

Add a comprehensive task details panel that opens when users click on a task name. The panel displays complete task information with inline editing capabilities, following the same design pattern as other detail panels in the system (notes, clients).

## Design Decisions

### Layout Pattern

**Center Modal (Dialog)** - Large centered modal similar to the notes detail panel
- Provides ample space for detailed content
- Maintains consistency with existing detail panels
- Better focus than side sheet for comprehensive editing

**Split View Layout**
- Left side: Main task content (editable fields, description, comments, files, related tasks)
- Right side: Activity timeline (chronological history of all changes)
- Responsive: Stacks vertically on mobile viewports

### Content Scope

**Complete Task Information (Everything):**
- Core task info: name, status, assignee, dates, priority, tags
- Description with rich text editing
- Comments and discussion thread
- File attachments
- Related tasks and subtasks
- Activity timeline showing all changes

### Editing Model

**Inline Editing with Batch Save**
- All fields editable in place (click to edit)
- Changes accumulate in local state
- Single "Save" button at bottom commits all changes
- "Cancel" button discards all changes
- Unsaved changes warning on close

## Architecture

### Component Hierarchy

```
TaskDetailsPanel (feature component)
├── Dialog (from @/components/ui/dialog)
│   └── DetailsPanelLayout (new shared layout primitive)
│       ├── DetailsPanelHeader
│       │   ├── Back button
│       │   ├── Task name (editable)
│       │   ├── Status badge (editable dropdown)
│       │   ├── Actions menu (...)
│       │   └── Close button (X)
│       │
│       ├── DetailsPanelContent (scrollable left side)
│       │   ├── TaskInfoGrid (assignee, dates, priority, project)
│       │   ├── TaskDescription (rich text editor)
│       │   ├── TaskComments (comment thread)
│       │   ├── TaskFiles (file attachments)
│       │   └── TaskRelated (related tasks, subtasks)
│       │
│       ├── DetailsPanelSidebar (scrollable right side)
│       │   └── ActivityTimeline (chronological history)
│       │
│       └── DetailsPanelFooter
│           ├── Cancel button
│           └── Save button (primary)
```

### File Structure

**Shared Layout Primitives** (`components/shared/details-panel/`)
- `DetailsPanelLayout.tsx` - Root split-view layout container
- `DetailsPanelHeader.tsx` - Consistent header with title, status, actions
- `DetailsPanelSection.tsx` - Reusable collapsible section component
- `DetailsPanelSidebar.tsx` - Right panel wrapper with fixed width
- `DetailsPanelFooter.tsx` - Footer with action buttons

**Task-Specific Components** (`components/tasks/`)
- `TaskDetailsPanel.tsx` - Main task panel orchestrator
- `task-details/TaskInfoGrid.tsx` - Editable task metadata grid
- `task-details/TaskDescription.tsx` - Rich text editor for description
- `task-details/TaskComments.tsx` - Comment thread with input
- `task-details/TaskFiles.tsx` - File attachment list and upload
- `task-details/TaskRelated.tsx` - Related tasks and subtasks
- `task-details/ActivityTimeline.tsx` - Activity history feed

## Component Details

### Shared Layout Primitives

#### DetailsPanelLayout
Root layout component providing split-view structure.

**Props:**
```typescript
type DetailsPanelLayoutProps = {
  leftContent: React.ReactNode
  rightContent: React.ReactNode
  footer: React.ReactNode
  className?: string
}
```

**Behavior:**
- CSS Grid with `grid-cols-[1fr_320px]` for desktop
- Right sidebar fixed width (320px)
- Both sides independently scrollable
- Responsive: Stacks vertically on mobile (`< 768px`)

#### DetailsPanelHeader
Consistent header across all detail panels.

**Props:**
```typescript
type DetailsPanelHeaderProps = {
  title: string
  subtitle?: string
  status?: React.ReactNode  // status badge/dropdown
  onBack?: () => void
  onClose: () => void
  actions?: React.ReactNode  // menu button, share, etc.
  editable?: boolean  // makes title editable
  onTitleChange?: (newTitle: string) => void
}
```

**Features:**
- Editable title (click to edit, Enter to confirm, Escape to cancel)
- Status dropdown integration
- Action menu button (...)
- Close button (X) in top right
- Optional back arrow

#### DetailsPanelSection
Reusable section component with optional collapse.

**Props:**
```typescript
type DetailsPanelSectionProps = {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
  collapsible?: boolean
  icon?: React.ReactNode
  actions?: React.ReactNode  // section-level actions
}
```

**Features:**
- Chevron icon for collapsible sections
- Consistent spacing and borders
- Optional section icon
- Optional action buttons (add, edit, etc.)

#### DetailsPanelFooter
Footer with action buttons, sticky to bottom.

**Props:**
```typescript
type DetailsPanelFooterProps = {
  onCancel: () => void
  onSave: () => void
  saveDisabled?: boolean
  saveLabel?: string
  isSaving?: boolean
}
```

**Features:**
- Sticky positioning with backdrop blur
- Cancel button (secondary)
- Save button (primary, with loading state)
- Disabled state when no changes

### Task-Specific Components

#### TaskDetailsPanel
Main orchestrator component for task details.

**Props:**
```typescript
type TaskDetailsPanelProps = {
  taskId: string | null  // null = closed
  onClose: () => void
  onSave: (updatedTask: ProjectTask) => void | Promise<void>
}
```

**State:**
```typescript
const [editedTask, setEditedTask] = useState<ProjectTask | null>(null)
const [originalTask, setOriginalTask] = useState<ProjectTask | null>(null)
const [isDirty, setIsDirty] = useState(false)
const [isSaving, setIsSaving] = useState(false)
const [showUnsavedWarning, setShowUnsavedWarning] = useState(false)
```

**Behavior:**
- Fetches task data when `taskId` changes
- Clones task into `editedTask` for editing
- Tracks dirty state by comparing `editedTask` vs `originalTask`
- Shows unsaved changes warning on close if `isDirty`
- Commits all changes on save

#### TaskInfoGrid
Editable metadata fields in a grid layout.

**Fields:**
- **Assignee:** Avatar + name selector (popover with user list)
- **Due Date:** Calendar picker
- **Priority:** Badge with dropdown (no-priority, low, medium, high, urgent)
- **Start Date:** Calendar picker
- **Project:** Read-only link to project
- **Workstream:** Read-only badge
- **Tags:** Editable tag list (optional)

**Layout:** 2-column grid on desktop, single column on mobile

#### TaskDescription
Rich text editor for task description.

**Features:**
- Uses existing Tiptap setup from project
- Toolbar with formatting options
- Always in edit mode (no toggle)
- Updates `editedTask.description` on change

#### TaskComments
Comment thread with new comment input.

**Structure:**
- List of existing comments (read-only)
  - Avatar, author name, timestamp
  - Comment text
- New comment input at bottom
  - Textarea with "Add comment" button
  - Adds to `editedTask.comments` array

**Limitations (for simplicity):**
- Cannot edit or delete existing comments
- New comments only added to local state (saved with task)

#### TaskFiles
File attachment list and upload.

**Features:**
- List of attached files
  - File icon based on type
  - File name and size
  - Download and remove actions
- "Upload file" button
- Optional drag & drop support
- Files stored in `editedTask.files` array

#### TaskRelated
Related tasks and subtasks section.

**Features:**
- List of linked tasks (clickable)
- "Add related task" button (opens task selector)
- Unlink action (X button)
- Stores IDs in `editedTask.relatedTaskIds`

#### ActivityTimeline
Chronological history in right sidebar.

**Activity Event Types:**
- Status changed
- Assigned to user
- Date changed (due/start)
- Priority changed
- Comment added
- File attached
- Description updated
- Related task linked
- Task created

**Event Structure:**
```typescript
type ActivityEvent = {
  id: string
  type: 'status_changed' | 'assigned' | 'comment_added' | ...
  user: User
  timestamp: Date
  oldValue?: string
  newValue?: string
  comment?: string
  fileName?: string
}
```

**Design:**
- Avatar + action text + timestamp
- Vertical line connecting events
- Newest at top
- Relative timestamps ("2 hours ago")
- Shows last 50 events

## Data Flow

### State Management

**Local Component State** (within TaskDetailsPanel)
- `editedTask` - Draft copy being edited
- `originalTask` - Original for comparison
- `isDirty` - Has unsaved changes
- `isSaving` - Loading state during save

No global state needed - keeps implementation simple.

### Flow Diagram

```
User clicks task → Panel opens with taskId
↓
Fetch task data from lib/data/project-details.ts
↓
Clone task into editedTask state
Store original in originalTask
↓
User edits fields → Update editedTask
Set isDirty = true
↓
User clicks Save → Call onSave(editedTask)
Show loading state
↓
Parent updates data source & closes panel
```

### Data Model Extension

Extend `ProjectTask` type with new fields:

```typescript
type ProjectTask = WorkstreamTask & {
  projectId: string
  projectName: string
  workstreamId: string
  workstreamName: string
  // New fields for details panel:
  comments?: Comment[]
  files?: TaskFile[]
  relatedTaskIds?: string[]
  activityLog?: ActivityEvent[]
}

type Comment = {
  id: string
  author: User
  text: string
  timestamp: Date
}

type TaskFile = {
  id: string
  name: string
  type: 'pdf' | 'doc' | 'image' | 'file'
  sizeMB: number
  url: string
  uploadedBy: User
  uploadedDate: Date
}
```

## User Interactions

### Inline Editing Patterns

**Task Name (Header)**
- Click to edit → Input field
- Enter to confirm, Escape to cancel
- Updates `editedTask.name`

**Status Badge**
- Click → Dropdown with status options
- Options: todo, in-progress, done
- Visual feedback with color coding

**Assignee**
- Click avatar/name → User selector popover
- Search/filter team members
- Select to assign

**Dates (Due Date, Start Date)**
- Click → Calendar popover
- "Clear date" option
- Date validation (start before due)

**Priority**
- Click badge → Dropdown
- Options: no-priority, low, medium, high, urgent
- Color-coded badges

**Description**
- Always editable (Tiptap editor)
- No toggle needed

**Comments**
- Existing: read-only
- New: textarea + "Add comment" button

**Files**
- Upload button → file picker
- Remove with X button

**Related Tasks**
- Add button → task search
- Unlink with X button

### Keyboard Shortcuts

- `Cmd/Ctrl + Enter` → Save changes
- `Escape` → Cancel/Close (with warning if dirty)
- `Tab` → Navigate between fields

### Visual Feedback

- Hover states on editable fields
- Blue outline on focused fields
- Save button disabled when `!isDirty`
- Loading spinner on save
- Success/error toast notifications

### Unsaved Changes Warning

When user attempts to close with unsaved changes:
- Show confirmation dialog
- "You have unsaved changes. Discard changes?"
- Options: "Discard" or "Keep Editing"

## Integration Points

### Opening the Panel

**From Task Lists** (MyTasksPage, ProjectTasksSection)
```typescript
// Update TaskRowBase to accept onTaskClick
<TaskRowBase
  task={task}
  onTaskClick={(taskId) => setSelectedTaskId(taskId)}
/>
```

**From Kanban Boards** (TaskWeekBoardView)
```typescript
// Make task cards clickable
<TaskCard
  task={task}
  onClick={() => setSelectedTaskId(task.id)}
/>
```

**From Project Timeline**
```typescript
// Make timeline bars clickable
<TimelineBar
  task={task}
  onClick={() => setSelectedTaskId(task.id)}
/>
```

### Parent Component Pattern

```typescript
function MyTasksPage() {
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)

  const handleSaveTask = async (updatedTask: ProjectTask) => {
    // Update data source (mock data for now)
    await updateTaskInDataSource(updatedTask)
    setSelectedTaskId(null)
    // Show success toast
  }

  return (
    <>
      <TaskList onTaskClick={setSelectedTaskId} />

      <TaskDetailsPanel
        taskId={selectedTaskId}
        onClose={() => setSelectedTaskId(null)}
        onSave={handleSaveTask}
      />
    </>
  )
}
```

### URL Integration (Future Enhancement)

Consider adding task ID to URL:
- `?task=123` when panel opens
- Allows direct linking
- Preserves state on refresh
- Use Next.js router.push with shallow routing

## Reusability Strategy

### For Other Detail Panels

Once TaskDetailsPanel is implemented, other panels can reuse the layout primitives:

**ClientDetailsPanel** (refactor existing)
```typescript
<DetailsPanelLayout
  leftContent={<ClientInfo />}
  rightContent={<ClientActivity />}
  footer={<DetailsPanelFooter ... />}
/>
```

**ProjectDetailsPanel** (new)
```typescript
<DetailsPanelLayout
  leftContent={<ProjectSections />}
  rightContent={<ProjectTimeline />}
  footer={<DetailsPanelFooter ... />}
/>
```

All panels follow the same pattern:
- Use shared layout primitives
- Implement entity-specific content sections
- Handle their own data and save logic
- Consistent UX across all detail views

## Implementation Phases

### Phase 1: Shared Layout Primitives
1. Create `components/shared/details-panel/` directory
2. Implement `DetailsPanelLayout`
3. Implement `DetailsPanelHeader`
4. Implement `DetailsPanelSection`
5. Implement `DetailsPanelSidebar`
6. Implement `DetailsPanelFooter`

### Phase 2: Task Panel Core
1. Create `TaskDetailsPanel` main component
2. Implement state management (editedTask, isDirty, etc.)
3. Add open/close logic with Dialog
4. Implement unsaved changes warning

### Phase 3: Task Content Sections
1. Implement `TaskInfoGrid` (metadata fields)
2. Implement `TaskDescription` (rich text)
3. Add inline editing for all fields
4. Connect to editedTask state

### Phase 4: Extended Features
1. Implement `TaskComments` section
2. Implement `TaskFiles` section
3. Implement `TaskRelated` section
4. Implement `ActivityTimeline` (right sidebar)

### Phase 5: Integration & Polish
1. Update `TaskRowBase` to support onClick
2. Integrate into MyTasksPage
3. Integrate into task boards
4. Add keyboard shortcuts
5. Add loading states and error handling
6. Test responsive behavior

## Testing Checklist

- [ ] Panel opens from task lists
- [ ] Panel opens from kanban boards
- [ ] Panel opens from timeline view
- [ ] All fields are editable
- [ ] Status dropdown works
- [ ] Assignee selector works
- [ ] Date pickers work
- [ ] Priority dropdown works
- [ ] Description editor works
- [ ] Comments can be added
- [ ] Files can be uploaded/removed
- [ ] Related tasks can be linked/unlinked
- [ ] Save commits all changes
- [ ] Cancel discards all changes
- [ ] Unsaved changes warning appears
- [ ] Keyboard shortcuts work (Cmd+Enter, Escape)
- [ ] Activity timeline displays history
- [ ] Responsive layout on mobile
- [ ] Loading states display correctly
- [ ] Error handling works

## Success Criteria

1. **Consistency:** Panel matches design of notes detail modal
2. **Completeness:** All task information visible and editable
3. **Usability:** Inline editing is intuitive and responsive
4. **Reusability:** Layout primitives work for other panels
5. **Performance:** Panel opens quickly (<300ms)
6. **Reliability:** No data loss on save/cancel

## Future Enhancements

- URL integration for deep linking
- Real-time collaboration (multiple users editing)
- @mentions in comments
- Rich file previews
- Keyboard navigation between fields
- Undo/redo for changes
- Auto-save drafts
- Export task details
- Print view
- Mobile-optimized editing
