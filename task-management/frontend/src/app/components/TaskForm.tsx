import { useState, useEffect } from 'react'
import { Calendar, Clock, User, AlignLeft, X, Plus, Loader2 } from 'lucide-react'

interface Task {
  id: string
  title: string
  description: string
  due_date: string
  status: "todo" | "in-progress" | "completed"
  priority: "low" | "medium" | "high"
  user_id: string
}

interface TaskFormProps {
  onSubmit: (task: Omit<Task, "id">) => Promise<void>;
  onCancel?: () => void;
  initialData?: Partial<Omit<Task, "id">>;
  isModal?: boolean;
}

const TaskForm: React.FC<TaskFormProps> = ({ 
  onSubmit, 
  onCancel, 
  initialData = {}, 
  isModal = false 
}) => {
  const [title, setTitle] = useState(initialData.title || "")
  const [description, setDescription] = useState(initialData.description || "")
  const [dueDate, setDueDate] = useState(
    initialData.due_date ? new Date(initialData.due_date).toISOString().split('T')[0] : ""
  )
  const [priority, setPriority] = useState<"low" | "medium" | "high">(
    initialData.priority as "low" | "medium" | "high" || "medium"
  )
  const [userId, setUserId] = useState(initialData.user_id || "test123")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Update form when initialData changes
  useEffect(() => {
    if (initialData) {
      if (initialData.title) setTitle(initialData.title);
      if (initialData.description) setDescription(initialData.description);
      if (initialData.due_date) {
        setDueDate(new Date(initialData.due_date).toISOString().split('T')[0]);
      }
      if (initialData.priority) {
        setPriority(initialData.priority as "low" | "medium" | "high");
      }
      if (initialData.user_id) setUserId(initialData.user_id);
    }
  }, [initialData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError(null);
  
    const formattedDate = dueDate 
      ? new Date(dueDate + 'T00:00:00').toISOString() 
      : new Date().toISOString();
  
    const newTask: Omit<Task, "id"> = {
      title: title.trim(),
      description: description.trim(),
      due_date: formattedDate,
      status: "todo",
      priority,
      user_id: userId || "default_user",
    };
  
    try {
      console.log("Submitting task data:", newTask);
      await onSubmit(newTask);
  
      // Reset form fields after successful submission
      setTitle("");
      setDescription("");
      setDueDate("");
      setPriority("medium");
  
      if (isModal && onCancel) {
        onCancel(); // Close modal on successful submission
      }
    } catch (error) {
      console.error("Failed to create task:", error);
      setError("Failed to create task. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const getPriorityColor = (p: "low" | "medium" | "high") => {
    switch (p) {
      case "low": return "bg-green-100 text-green-800 border-green-200";
      case "medium": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "high": return "bg-red-100 text-red-800 border-red-200";
    }
  }

  return (
    <div className={`bg-white rounded-lg overflow-hidden ${isModal ? '' : 'shadow-lg'}`}>
      <div className="bg-gradient-to-r from-indigo-500 to-purple-600 px-6 py-4 flex justify-between items-center">
        <h2 className="text-xl font-semibold text-white flex items-center">
          <Plus className="h-5 w-5 mr-2" />
          Create New Task
        </h2>
        {isModal && onCancel && (
          <button 
            type="button"
            onClick={onCancel} 
            className="text-white hover:text-indigo-100"
          >
            <X className="h-6 w-6" />
          </button>
        )}
      </div>
      
      <form onSubmit={handleSubmit} className="p-6 space-y-5">
        {error && (
          <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
            {error}
          </div>
        )}
        
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">Task Title</label>
          <div className="relative">
            <input
              id="title"
              type="text"
              placeholder="E.g., Complete project presentation"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
              className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-200"
            />
            <AlignLeft className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          </div>
        </div>
        
        <div>
          <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">Description</label>
          <textarea
            id="description"
            placeholder="Add details about this task..."
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            required
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-200"
            rows={3}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label htmlFor="dueDate" className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
            <div className="relative">
              <input
                id="dueDate"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-200"
              />
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            </div>
          </div>
          
          <div>
            <label htmlFor="priority" className="block text-sm font-medium text-gray-700 mb-1">Priority</label>
            <div className="relative">
              <select
                id="priority"
                value={priority}
                onChange={(e) => setPriority(e.target.value as "low" | "medium" | "high")}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-200 appearance-none"
              >
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
              <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            </div>
          </div>
          
          <div>
            <label htmlFor="userId" className="block text-sm font-medium text-gray-700 mb-1">Assigned To</label>
            <div className="relative">
              <input
                id="userId"
                type="text"
                placeholder="User ID"
                value={userId}
                onChange={(e) => setUserId(e.target.value)}
                required
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 transition duration-200"
              />
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            </div>
          </div>
        </div>
        
        <div className="flex gap-3 pt-2">
          <div className="flex items-center space-x-2">
            <span className="text-sm font-medium text-gray-700">Priority:</span>
            <span className={`text-xs px-2 py-1 rounded-full border ${getPriorityColor(priority)}`}>
              {priority.charAt(0).toUpperCase() + priority.slice(1)}
            </span>
          </div>
        </div>
        
        <div className="flex space-x-3 pt-3">
          {isModal && onCancel && (
            <button
              type="button"
              onClick={onCancel}
              className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-200 transition duration-200"
            >
              Cancel
            </button>
          )}
          
          <button
            type="submit"
            disabled={isSubmitting || !title.trim()}
            className={`${isModal ? 'flex-1' : 'w-full'} bg-indigo-600 text-white py-2 px-4 rounded-md hover:bg-indigo-700 transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center`}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                Creating...
              </>
            ) : (
              <>
                <Plus className="h-5 w-5 mr-2" />
                Create Task
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  )
}

export default TaskForm