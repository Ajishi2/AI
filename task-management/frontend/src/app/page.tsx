"use client"

import { useState, useEffect, useCallback } from 'react'
import { Plus, X, Menu, Loader2, AlertTriangle, LayoutGrid, List } from 'lucide-react'
import TaskForm from './components/TaskForm'
import TaskList from './components/TaskList'
import AiSuggestion from './components/AiSuggestion'

type Task = {
  id: string
  title: string
  description: string
  status: 'todo' | 'in-progress' | 'completed'
  priority: 'low' | 'medium' | 'high'
  due_date: string
  user_id: string
}

export default function Home() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [error, setError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [showTaskForm, setShowTaskForm] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [filterStatus, setFilterStatus] = useState<'all' | 'todo' | 'in-progress' | 'completed'>('all')
  const [filterPriority, setFilterPriority] = useState<'all' | 'low' | 'medium' | 'high'>('all')

  const fetchTasks = useCallback(async () => {
    setIsLoading(true)
    try {
      const response = await fetch('https://ai-rcan.onrender.com/tasks?user_id=test123', {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer dummy_token'
        }
      })
  
      if (!response.ok) {
        const errorText = await response.text()
        const errorData = safeJsonParse(errorText)
        throw new Error(errorData.message || errorText || 'Failed to fetch tasks')
      }
  
      const data: Task[] = await response.json()
      setTasks(data)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch tasks'
      setError(errorMessage)
      console.error('Error fetching tasks:', err)
    } finally {
      setIsLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchTasks()
  }, [fetchTasks])

  const handleDeleteTask = async (taskId: string) => {
    try {
      const response = await fetch(`https://ai-rcan.onrender.com/tasks/${taskId}`, {
        method: "DELETE",
      })
  
      if (!response.ok) {
        throw new Error("Failed to delete task")
      }
  
      setTasks((prevTasks) => prevTasks.filter((task) => task.id !== taskId))
    } catch (err) {
      const errorMessage = 'Failed to delete task. Please try again.'
      setError(errorMessage)
      console.error('Error deleting task:', err)
    }
  }

  const handleCreateTask = async (taskData: Omit<Task, 'id'>) => {
    try {
      const response = await fetch('https://ai-rcan.onrender.com/tasks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(taskData),
      })

      if (!response.ok) {
        throw new Error('Failed to create task')
      }

      await fetchTasks()
      setShowTaskForm(false)
    } catch (err) {
      setError('Failed to create task. Please try again.')
      console.error('Error creating task:', err)
    }
  }

  const handleStatusChange = async (taskId: string, newStatus: Task["status"]) => {
    try {
      const response = await fetch(`https://ai-rcan.onrender.com/tasks/${taskId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status: newStatus }),
      })
  
      if (!response.ok) {
        throw new Error("Failed to update task status")
      }
  
      setTasks((prevTasks) =>
        prevTasks.map((task) =>
          task.id === taskId ? { ...task, status: newStatus } : task
        )
      )
    } catch (err) {
      setError("Failed to update task status. Please try again.")
      console.error("Error updating task status:", err)
    }
  }

  const filteredTasks = tasks.filter(task => {
    const statusMatch = filterStatus === 'all' || task.status === filterStatus
    const priorityMatch = filterPriority === 'all' || task.priority === filterPriority
    return statusMatch && priorityMatch
  })

  const statistics = {
    total: tasks.length,
    todo: tasks.filter(t => t.status === 'todo').length,
    inProgress: tasks.filter(t => t.status === 'in-progress').length,
    completed: tasks.filter(t => t.status === 'completed').length,
    highPriority: tasks.filter(t => t.priority === 'high').length
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Navigation Bar */}
      <nav className="bg-white shadow-sm border-b sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Menu className="h-6 w-6 text-gray-500" />
              <h1 className="ml-3 text-xl font-semibold text-gray-900">Task Master AI</h1>
            </div>
            <div className="flex items-center space-x-4">
              <div className="mr-4 flex space-x-2">
                <button 
                  onClick={() => setViewMode('grid')}
                  className={`p-2 rounded ${viewMode === 'grid' ? 'bg-blue-100 text-blue-600' : 'text-gray-500'}`}
                >
                  <LayoutGrid className="h-5 w-5" />
                </button>
                <button 
                  onClick={() => setViewMode('list')}
                  className={`p-2 rounded ${viewMode === 'list' ? 'bg-blue-100 text-blue-600' : 'text-gray-500'}`}
                >
                  <List className="h-5 w-5" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Error Alert */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start">
            <AlertTriangle className="h-5 w-5 text-red-500 mr-3 mt-0.5" />
            <div className="text-red-700">{error}</div>
            <button onClick={() => setError(null)} className="ml-auto">
              <X className="h-5 w-5 text-red-500" />
            </button>
          </div>
        )}

        {/* Task Dashboard */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* AI Suggestion Column */}
          <div className="lg:col-span-2">
            <h2 className="text-2xl font-semibold mb-4 text-black">AI Task Assistant</h2>
            <AiSuggestion onSuggestion={console.log} onCreateTask={handleCreateTask} />
          </div>

          {/* Stats and Quick Actions Column */}
          <div>
            <h2 className="text-2xl font-semibold mb-4">Dashboard</h2>
            
            {/* Task Statistics */}
            <div className="bg-white rounded-lg shadow-md p-4 mb-6">
              <h3 className="text-lg font-medium mb-3">Task Statistics</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-gray-50 rounded-md">
                  <p className="text-sm text-gray-500">Total Tasks</p>
                  <p className="text-2xl font-bold">{statistics.total}</p>
                </div>
                <div className="p-3 bg-blue-50 rounded-md">
                  <p className="text-sm text-blue-500">In Progress</p>
                  <p className="text-2xl font-bold">{statistics.inProgress}</p>
                </div>
                <div className="p-3 bg-yellow-50 rounded-md">
                  <p className="text-sm text-yellow-600">Pending</p>
                  <p className="text-2xl font-bold">{statistics.todo}</p>
                </div>
                <div className="p-3 bg-green-50 rounded-md">
                  <p className="text-sm text-green-500">Completed</p>
                  <p className="text-2xl font-bold">{statistics.completed}</p>
                </div>
              </div>
            </div>
            
            {/* Quick Actions */}
            <div className="bg-white rounded-lg shadow-md p-4 mb-6">
              <h3 className="text-lg font-medium mb-3">Quick Actions</h3>
              <button 
                onClick={() => setShowTaskForm(true)} 
                className="w-full mb-3 p-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 transition-colors flex items-center justify-center"
              >
                <Plus className="h-5 w-5 mr-2" /> Add Task Manually
              </button>
              <button 
                onClick={fetchTasks} 
                className="w-full p-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors flex items-center justify-center"
              >
                <Loader2 className="h-5 w-5 mr-2" /> Refresh Tasks
              </button>
            </div>
            
            {/* Filters */}
            <div className="bg-white rounded-lg shadow-md p-4">
              <h3 className="text-lg font-medium mb-3">Filters</h3>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Statuses</option>
                    <option value="todo">To Do</option>
                    <option value="in-progress">In Progress</option>
                    <option value="completed">Completed</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
                  <select
                    value={filterPriority}
                    onChange={(e) => setFilterPriority(e.target.value as typeof filterPriority)}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="all">All Priorities</option>
                    <option value="low">Low</option>
                    <option value="medium">Medium</option>
                    <option value="high">High</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          {/* Task List Section */}
          <div className="lg:col-span-3">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-semibold">Your Tasks</h2>
              <p className="text-gray-500">
                Showing {filteredTasks.length} of {tasks.length} tasks
              </p>
            </div>
            
            {isLoading ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
              </div>
            ) : (
              <TaskList 
                tasks={filteredTasks} 
                onStatusChange={handleStatusChange} 
                onDeleteTask={handleDeleteTask}
                viewMode={viewMode}
              />
            )}
          </div>
        </div>
      </main>

      {/* Modal for Task Form */}
      {showTaskForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="flex justify-between items-center p-4 border-b">
              <h2 className="text-xl font-semibold">Add New Task</h2>
              <button 
                onClick={() => setShowTaskForm(false)}
                className="text-gray-400 hover:text-gray-500"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4">
              <TaskForm 
                onSubmit={handleCreateTask} 
                onCancel={() => setShowTaskForm(false)}
                initialData={{ user_id: "test123" }}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

const safeJsonParse = (str: string) => {
  try {
    return JSON.parse(str)
  } catch {
    return { message: str }
  }
}