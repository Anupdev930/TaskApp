import React, { useState } from 'react';
import { Task, TaskStatus, User, UserRole } from '../types';
import { generateTaskDescription } from '../services/geminiService';
import { SparklesIcon } from './icons/Icons';

interface AddTaskModalProps {
    onClose: () => void;
    onAddTask: (taskData: Omit<Task, 'id' | 'createdAt' | 'remarks' | 'workLogs'>) => void;
    currentUser: User;
    assignableUsers: User[];
}

const AddTaskModal: React.FC<AddTaskModalProps> = ({ onClose, onAddTask, currentUser, assignableUsers }) => {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState<Task['priority']>('Medium');
    const [status] = useState<TaskStatus>(TaskStatus.ToDo); // Default status
    const [assigneeId, setAssigneeId] = useState<string>(currentUser.role === UserRole.Admin ? '' : currentUser.id);
    const [isGenerating, setIsGenerating] = useState(false);

    const isAdmin = currentUser.role === UserRole.Admin;

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!title.trim() || (isAdmin && !assigneeId)) return;
        
        onAddTask({ title, description, priority, status, assigneeId });
    };

    const handleGenerateDesc = async () => {
        if (!title.trim()) {
            alert("Please enter a title first.");
            return;
        }
        setIsGenerating(true);
        try {
            const generatedDesc = await generateTaskDescription(title);
            setDescription(generatedDesc);
        } catch (error) {
            console.error("Failed to generate description:", error);
            setDescription("Error generating description.");
        } finally {
            setIsGenerating(false);
        }
    };


    return (
        <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50"
            onClick={onClose}
        >
            <div 
                className="bg-slate-800 w-full max-w-lg rounded-2xl shadow-2xl p-8 m-4 border border-slate-700"
                onClick={e => e.stopPropagation()}
            >
                <h2 className="text-2xl font-bold mb-6 text-white">Add New Task</h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                    <div>
                        <label htmlFor="title" className="block text-sm font-medium text-slate-300 mb-2">Title</label>
                        <input
                            type="text"
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            required
                        />
                    </div>
                    <div>
                        <div className="flex justify-between items-center mb-2">
                             <label htmlFor="description" className="block text-sm font-medium text-slate-300">Description</label>
                             <button
                                type="button"
                                onClick={handleGenerateDesc}
                                disabled={isGenerating}
                                className="flex items-center gap-1.5 text-xs font-semibold text-indigo-300 hover:text-indigo-200 disabled:opacity-50 disabled:cursor-wait transition-colors"
                             >
                                <SparklesIcon className={`w-4 h-4 ${isGenerating ? 'animate-pulse' : ''}`}/>
                                {isGenerating ? 'Generating...' : 'Generate with AI'}
                             </button>
                        </div>
                        <textarea
                            id="description"
                            rows={4}
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                             className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </div>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                         <div>
                            <label htmlFor="priority" className="block text-sm font-medium text-slate-300 mb-2">Priority</label>
                            <select
                                id="priority"
                                value={priority}
                                onChange={(e) => setPriority(e.target.value as Task['priority'])}
                                className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            >
                                <option>Low</option>
                                <option>Medium</option>
                                <option>High</option>
                            </select>
                        </div>
                         {isAdmin && (
                             <div>
                                <label htmlFor="assignee" className="block text-sm font-medium text-slate-300 mb-2">Assign To</label>
                                <select
                                    id="assignee"
                                    value={assigneeId}
                                    onChange={(e) => setAssigneeId(e.target.value)}
                                    className="w-full bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                                    required
                                >
                                    <option value="" disabled>Select a user...</option>
                                    {assignableUsers.map(user => (
                                        <option key={user.id} value={user.id}>{user.name}</option>
                                    ))}
                                </select>
                            </div>
                         )}
                     </div>
                    <div className="flex justify-end gap-4 pt-4">
                        <button type="button" onClick={onClose} className="py-2 px-4 rounded-md text-slate-300 hover:bg-slate-700 transition-colors">
                            Cancel
                        </button>
                        <button type="submit" className="py-2 px-4 rounded-md bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-colors">
                            Add Task
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AddTaskModal;
