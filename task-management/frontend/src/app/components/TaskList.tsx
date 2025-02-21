import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Calendar from 'react-calendar'
import {  Loader2 } from 'lucide-react'


import { 
  CheckCircle2, Circle, Clock, Trash2, AlertCircle, 
  AlertTriangle, Filter, List, Grid, ArrowDownAZ
} from "lucide-react";

interface Task {
  id: string;
  title: string;
  description: string;
  due_date: string | null;
  status: "todo" | "in-progress" | "completed";
  priority: "low" | "medium" | "high";
}

interface TaskListProps {
    tasks: Task[];
    onStatusChange: (taskId: string, newStatus: Task["status"]) => Promise<void>;
    onDeleteTask: (taskId: string) => Promise<void>;
    viewMode?: 'grid' | 'list'; // Add this line - the ? makes it optional
  }

const TaskList: React.FC<TaskListProps> = ({ tasks, onStatusChange, onDeleteTask }) => {
  const [filter, setFilter] = useState<"all" | Task["status"]>("all");
  const [priorityFilter, setPriorityFilter] = useState<"all" | Task["priority"]>("all");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [sortBy, setSortBy] = useState<"date" | "priority" | "title">("date");
  const [isDeleting, setIsDeleting] = useState<string | null>(null);

  // Filter tasks by status and priority
  const filteredTasks = tasks.filter((task) => {
    const statusMatch = filter === "all" || task.status === filter;
    const priorityMatch = priorityFilter === "all" || task.priority === priorityFilter;
    return statusMatch && priorityMatch;
  });

  // Sort tasks
  const sortedTasks = [...filteredTasks].sort((a, b) => {
    if (sortBy === "date") {
      return new Date(a.due_date || "").getTime() - new Date(b.due_date || "").getTime();
    } else if (sortBy === "priority") {
      const priorityValue = { high: 3, medium: 2, low: 1 };
      return priorityValue[b.priority] - priorityValue[a.priority];
    } else {
      return a.title.localeCompare(b.title);
    }
  });

  const getStatusIcon = (status: Task["status"]) => {
    switch (status) {
      case "completed":
        return <CheckCircle2 className="h-5 w-5 text-green-500" />;
      case "in-progress":
        return <Clock className="h-5 w-5 text-blue-500" />;
      default:
        return <Circle className="h-5 w-5 text-gray-400" />;
    }
  };

  const getPriorityBadge = (priority: Task["priority"]) => {
    const styles = {
      high: "bg-red-100 text-red-800 border-red-200",
      medium: "bg-yellow-100 text-yellow-800 border-yellow-200",
      low: "bg-green-100 text-green-800 border-green-200",
    };
    
    return (
      <span className={`text-xs px-2 py-0.5 rounded-full border ${styles[priority]}`}>
        {priority}
      </span>
    );
  };

  const handleDelete = async (taskId: string) => {
    setIsDeleting(taskId);
    try {
      await onDeleteTask(taskId);
    } catch (error) {
      console.error("Error deleting task:", error);
    } finally {
      setIsDeleting(null);
    }
  };
  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="bg-gradient-to-r from-gray-700 to-gray-900 p-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-white flex items-center">
            <CheckCircle2 className="h-5 w-5 mr-2" />
            Tasks
          </h2>
          <div className="flex space-x-1">
            <button 
              onClick={() => setView("grid")} 
              className={`p-1 rounded ${view === "grid" ? "bg-gray-600 text-white" : "text-gray-300 hover:bg-gray-600"}`}
            >
              <Grid size={18} />
            </button>
            <button 
              onClick={() => setView("list")} 
              className={`p-1 rounded ${view === "list" ? "bg-gray-600 text-white" : "text-gray-300 hover:bg-gray-600"}`}
            >
              <List size={18} />
            </button>
          </div>
        </div>
      </div>

      <div className="p-4 bg-gray-50 border-b border-gray-200">
        <div className="flex flex-wrap gap-3 items-center">
          <div className="flex items-center">
            <Filter className="h-4 w-4 text-gray-500 mr-2" />
            <span className="text-sm font-medium text-gray-700 mr-2">Status:</span>
            <select 
              value={filter} 
              onChange={(e) => setFilter(e.target.value as "all" | Task["status"])}
              className="text-sm border-gray-300 rounded-md py-1 pl-2 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All</option>
              <option value="todo">To Do</option>
              <option value="in-progress">In Progress</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div className="flex items-center">
            <AlertTriangle className="h-4 w-4 text-gray-500 mr-2" />
            <span className="text-sm font-medium text-gray-700 mr-2">Priority:</span>
            <select 
              value={priorityFilter} 
              onChange={(e) => setPriorityFilter(e.target.value as "all" | Task["priority"])}
              className="text-sm border-gray-300 rounded-md py-1 pl-2 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </select>
          </div>

          <div className="flex items-center ml-auto">
            <ArrowDownAZ className="h-4 w-4 text-gray-500 mr-2" />
            <span className="text-sm font-medium text-gray-700 mr-2">Sort:</span>
            <select 
              value={sortBy} 
              onChange={(e) => setSortBy(e.target.value as "date" | "priority" | "title")}
              className="text-sm border-gray-300 rounded-md py-1 pl-2 pr-8 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="date">Due Date</option>
              <option value="priority">Priority</option>
              <option value="title">Title</option>
            </select>
          </div>
        </div>
      </div>

      <div className="p-6">
        {sortedTasks.length === 0 ? (
          <div className="text-center py-16 bg-gray-50 rounded-lg border border-dashed border-gray-300">
            <AlertCircle className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-4 text-lg font-medium text-gray-900">No tasks found</h3>
            <p className="mt-2 text-sm text-gray-500 max-w-md mx-auto">
              {filter !== "all" || priorityFilter !== "all"
                ? "Try changing your filters to see more tasks."
                : "Get started by creating a new task or asking AI for suggestions."}
            </p>
          </div>
        ) : (
          <AnimatePresence>
            <div className={view === "grid" 
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" 
              : "space-y-3"
            }>
              {sortedTasks.map((task) => (
                <motion.div
                  key={task.id}
                  layout
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className={`relative bg-white border rounded-lg shadow-sm overflow-hidden 
                    transition-all ${task.status === "completed" ? "opacity-75" : ""}`}
                >
                  <div className={`h-1 w-full ${
                    task.priority === "high" ? "bg-red-500" : 
                    task.priority === "medium" ? "bg-yellow-500" : "bg-green-500"
                  }`} />
                  
                  <div className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-3">
                        <button
                          onClick={() => {
                            const nextStatus = {
                              todo: "in-progress",
                              "in-progress": "completed",
                              completed: "todo",
                            } as const;
                            onStatusChange(task.id, nextStatus[task.status]);
                          }}
                          className="mt-1 hover:scale-110 transition-transform"
                          title={`Mark as ${
                            task.status === "todo" ? "In Progress" : 
                            task.status === "in-progress" ? "Completed" : "To Do"
                          }`}
                        >
                          {getStatusIcon(task.status)}
                        </button>
                        <div>
                          <h3 className={`font-medium text-gray-900 ${task.status === "completed" ? "line-through opacity-75" : ""}`}>
                            {task.title}
                          </h3>
                          <p className="mt-1 text-sm text-gray-500 line-clamp-2">
                            {task.description}
                          </p>
                        </div>
                      </div>
                      <button 
                        onClick={() => handleDelete(task.id)} 
                        className="text-gray-400 hover:text-red-500 transition-colors"
                        disabled={isDeleting === task.id}
                      >
                        {isDeleting === task.id ? (
                          <Loader2 className="h-5 w-5 animate-spin text-red-500" />
                        ) : (
                          <Trash2 className="h-5 w-5" />
                        )}
                      </button>
                    </div>
                    
                    <div className="mt-4 flex items-center justify-between text-sm">
                      <div className="flex items-center">
                        {getPriorityBadge(task.priority)}
                      </div>
                      
                      {task.due_date && (
                        <span className={`text-xs flex items-center
                          ${new Date(task.due_date) < new Date() && task.status !== "completed"
                            ? "text-red-600"
                            : "text-gray-500"
                          }`}>
                          <Calendar className="h-3 w-3 mr-1" />
                          {new Date(task.due_date).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </AnimatePresence>
        )}
      </div>
    </div>
  );
};

export default TaskList;