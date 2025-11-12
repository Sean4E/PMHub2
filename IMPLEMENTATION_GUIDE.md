# PM Hub v2 - Backend Integration Implementation Guide

## Overview
This guide explains how to connect the ProjectManager component to the real backend API and implement subtask functionality.

## Current Situation

### Backend (✅ COMPLETE)
- SQLite database with full persistence
- RESTful API endpoints for projects, tasks, teams
- Automatic progress calculation including subtasks
- Task model now includes `subtasks` JSON field
- Progress calculation formula:
  ```
  Task Completion = subtasks exist ? (completed_subtasks / total_subtasks * 100) : (status === 'done' ? 100 : 0)
  Project Progress = average(all task completions)
  ```

### Frontend (❌ NEEDS WORK)
- ProjectManager.jsx uses hardcoded dummy data
- No API calls to backend
- Changes don't persist
- Progress doesn't update

## Implementation Steps

### Step 1: Update ProjectManager to Fetch Real Data

**File:** `frontend/src/components/ProjectManager.jsx`

**Current (lines 61-98):**
```javascript
const [projects, setProjects] = useState([
  {
    id: '1',
    name: 'Website Redesign',
    // ... hardcoded data
  }
]);
```

**Change to:**
```javascript
import { projectsAPI, tasksAPI } from '../services/api';

const [projects, setProjects] = useState([]);
const [tasks, setTasks] = useState([]);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);

// Load projects on mount
useEffect(() => {
  loadProjects();
}, []);

const loadProjects = async () => {
  try {
    setLoading(true);
    const response = await projectsAPI.getAll();
    if (response.data.success) {
      setProjects(response.data.data);
    }
  } catch (err) {
    console.error('Error loading projects:', err);
    setError(err.message);
  } finally {
    setLoading(false);
  }
};

// Load tasks for all projects
useEffect(() => {
  if (projects.length > 0) {
    loadAllTasks();
  }
}, [projects]);

const loadAllTasks = async () => {
  try {
    const allTasks = [];
    for (const project of projects) {
      const response = await tasksAPI.getByProject(project.id);
      if (response.data.success) {
        allTasks.push(...response.data.data);
      }
    }
    setTasks(allTasks);
  } catch (err) {
    console.error('Error loading tasks:', err);
  }
};
```

### Step 2: Update Task Status Changes to Call API

**Find the function that handles task status changes** (search for where tasks are moved between Kanban columns)

**Change from:**
```javascript
const handleTaskStatusChange = (taskId, newStatus) => {
  setTasks(tasks.map(task =>
    task.id === taskId ? { ...task, status: newStatus } : task
  ));
};
```

**Change to:**
```javascript
const handleTaskStatusChange = async (taskId, newStatus) => {
  try {
    // Optimistic update
    setTasks(tasks.map(task =>
      task.id === taskId ? { ...task, status: newStatus } : task
    ));

    // API call
    const response = await tasksAPI.update(taskId, { status: newStatus });

    if (response.data.success) {
      // Reload projects to get updated progress
      await loadProjects();
    }
  } catch (err) {
    console.error('Error updating task status:', err);
    // Revert optimistic update
    loadAllTasks();
  }
};
```

### Step 3: Update Create Project Function

**Find `handleCreateProject` or similar function**

**Change to:**
```javascript
const handleCreateProject = async (projectData) => {
  try {
    const response = await projectsAPI.create(projectData);
    if (response.data.success) {
      setShowProjectModal(false);
      await loadProjects(); // Reload to get new project with progress
    }
  } catch (err) {
    console.error('Error creating project:', err);
    setError(err.message);
  }
};
```

### Step 4: Update Create Task Function

**Find `handleCreateTask` or similar function**

**Change to:**
```javascript
const handleCreateTask = async (projectId, taskData) => {
  try {
    const response = await tasksAPI.create(projectId, taskData);
    if (response.data.success) {
      setShowTaskModal(false);
      await loadAllTasks();
      await loadProjects(); // Reload to get updated progress
    }
  } catch (err) {
    console.error('Error creating task:', err);
    setError(err.message);
  }
};
```

### Step 5: Add Subtask UI to Task Cards

**Add subtask management to task cards in Kanban view:**

```javascript
const SubtaskList = ({ task, onUpdate }) => {
  const [subtasks, setSubtasks] = useState(task.subtasks || []);
  const [newSubtask, setNewSubtask] = useState('');

  const handleToggleSubtask = async (index) => {
    const updated = [...subtasks];
    updated[index].completed = !updated[index].completed;
    setSubtasks(updated);

    try {
      await tasksAPI.update(task.id, { subtasks: updated });
      onUpdate(); // Refresh to get updated progress
    } catch (err) {
      console.error('Error updating subtask:', err);
    }
  };

  const handleAddSubtask = async () => {
    if (!newSubtask.trim()) return;

    const updated = [...subtasks, {
      id: Date.now().toString(),
      title: newSubtask,
      completed: false
    }];
    setSubtasks(updated);
    setNewSubtask('');

    try {
      await tasksAPI.update(task.id, { subtasks: updated });
      onUpdate();
    } catch (err) {
      console.error('Error adding subtask:', err);
    }
  };

  return (
    <div className="mt-3 space-y-2">
      {subtasks.map((subtask, index) => (
        <label key={subtask.id} className="flex items-center gap-2 text-sm cursor-pointer">
          <input
            type="checkbox"
            checked={subtask.completed}
            onChange={() => handleToggleSubtask(index)}
            className="rounded border-gray-300"
          />
          <span className={subtask.completed ? 'line-through text-gray-500' : ''}>
            {subtask.title}
          </span>
        </label>
      ))}
      <div className="flex gap-2">
        <input
          type="text"
          value={newSubtask}
          onChange={(e) => setNewSubtask(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleAddSubtask()}
          placeholder="Add subtask..."
          className="flex-1 px-2 py-1 text-sm border rounded"
        />
        <button
          onClick={handleAddSubtask}
          className="px-3 py-1 text-sm bg-blue-500 text-white rounded"
        >
          Add
        </button>
      </div>
    </div>
  );
};
```

**Then add to task card rendering:**
```javascript
{/* Inside task card */}
<div className="task-card">
  {/* ... existing task content ... */}

  {/* Add subtasks */}
  <SubtaskList
    task={task}
    onUpdate={() => {
      loadAllTasks();
      loadProjects();
    }}
  />
</div>
```

### Step 6: Fix Backend API URL

**File:** `frontend/src/services/api.js`

**Current (line 3):**
```javascript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';
```

**Change to:**
```javascript
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';
```

The backend runs on port 3001, not 5000!

### Step 7: Handle Task Attributes Mapping

Backend returns different attribute names (snake_case from database, camelCase from API). Make sure to handle:

```javascript
// Map backend response to frontend format
const mapTaskFromAPI = (task) => ({
  ...task,
  dueDate: task.dueDate || task.due_date,
  createdBy: task.createdBy || task.created_by,
  estimatedHours: task.estimatedHours || task.estimated_hours,
  // ... etc
});
```

## Subtasks Data Structure

Subtasks are stored as JSON in the database:

```javascript
subtasks: [
  {
    id: "1",
    title: "Design mockups",
    completed: false
  },
  {
    id: "2",
    title: "Get client approval",
    completed: true
  }
]
```

## Progress Calculation Logic

**Backend automatically calculates:**
- Task with subtasks: `completed_subtasks / total_subtasks * 100`
- Task without subtasks: `status === 'done' ? 100 : 0`
- Project progress: `average(all_task_completions)`

**Frontend should:**
- Display progress bars based on `project.progress`
- Show subtask checkboxes
- Update backend when subtasks change
- Reload projects after any task/subtask change to get fresh progress

## Testing Checklist

After implementing:

- [ ] Projects load from database on page load
- [ ] Can create new project → saves to database
- [ ] Can create new task → saves to database
- [ ] Moving task in Kanban updates status → saves to database
- [ ] Project progress updates when task status changes
- [ ] Can add subtasks to a task
- [ ] Can check/uncheck subtasks
- [ ] Project progress updates when subtasks are toggled
- [ ] Page refresh shows persisted data
- [ ] Analytics dashboard shows real progress metrics
- [ ] Gantt chart displays correct data

## Database Schema Reference

### Projects Table
- id (UUID)
- name (STRING)
- description (TEXT)
- status (ENUM: 'planning', 'active', 'on-hold', 'completed')
- **progress (INTEGER 0-100)** ← Auto-calculated
- startDate, endDate (DATE)
- color (STRING)
- driveFolderId, driveFolderUrl (STRING)
- ownerId (UUID)

### Tasks Table
- id (UUID)
- projectId (UUID)
- title (STRING)
- description (TEXT)
- status (ENUM: 'todo', 'in-progress', 'review', 'done')
- priority (ENUM: 'low', 'medium', 'high', 'critical')
- dueDate, completedDate (DATE)
- estimatedHours, actualHours (INTEGER)
- **subtasks (JSON)** ← New field!
- createdBy (UUID)

## Common Issues & Solutions

### Issue: "Cannot read property 'data' of undefined"
**Solution:** Backend returns `response.data`, axios wraps it again. Use `response.data.data`

### Issue: Progress shows 0% even after completing tasks
**Solution:** Make sure to reload projects after task updates:
```javascript
await tasksAPI.update(taskId, data);
await loadProjects(); // ← Don't forget this!
```

### Issue: Subtasks don't save
**Solution:** Send entire subtasks array in update:
```javascript
await tasksAPI.update(taskId, { subtasks: updatedSubtasksArray });
```

### Issue: 401 Unauthorized errors
**Solution:** Make sure token is in localStorage:
```javascript
localStorage.getItem('token') // should return JWT token
```

## Next Steps

1. Start with Step 1 (loading projects)
2. Test that projects load correctly
3. Move to Step 2 (task status updates)
4. Test Kanban drag-and-drop updates database
5. Add subtask UI (Step 5)
6. Test end-to-end: create project → create task → add subtasks → check them off → see progress update

## Need Help?

The API is already fully functional. You can test endpoints with:
```bash
# Get all projects
curl http://localhost:3001/api/projects -H "Authorization: Bearer YOUR_TOKEN"

# Update task
curl -X PUT http://localhost:3001/api/tasks/TASK_ID \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"status": "done", "subtasks": [{"id":"1","title":"test","completed":true}]}'
```

Good luck! 🚀
