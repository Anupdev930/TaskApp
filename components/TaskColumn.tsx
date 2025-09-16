import React from 'react';
import { Task, TaskStatus, User } from '../types';
import TaskCard from './TaskCard';

interface TaskColumnProps {
    status: TaskStatus;
    tasks: Task[];
    allUsers: User[];
    onDrop: (status: TaskStatus) => void;
    onDragStart: (task: Task) => void;
    onDeleteTask: (taskId: string) => void;
    onSelectTask: (task: Task) => void;
}

const statusColors: Record<TaskStatus, string> = {
    [TaskStatus.ToDo]: 'border-t-sky-500',
    [TaskStatus.InProgress]: 'border-t-yellow-500',
    [TaskStatus.OnHold]: 'border-t-gray-500',
    [TaskStatus.Done]: 'border-t-green-500',
    [TaskStatus.Completed]: 'border-t-purple-500',
};

const TaskColumn: React.FC<TaskColumnProps> = ({ status, tasks, allUsers, onDrop, onDragStart, onDeleteTask, onSelectTask }) => {
    
    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        onDrop(status);
    };

    return (
        <div
            className={`bg-slate-800/50 rounded-xl p-4 border-t-4 ${statusColors[status]} h-full flex flex-col w-80 flex-shrink-0`}
            onDragOver={handleDragOver}
            onDrop={handleDrop}
        >
            <div className="flex justify-between items-center mb-4">
                <h2 className="text-lg font-semibold text-slate-200">{status}</h2>
                <span className="bg-slate-700 text-slate-300 text-sm font-bold px-2 py-1 rounded-full">
                    {tasks.length}
                </span>
            </div>
            <div className="space-y-4 overflow-y-auto flex-grow pr-2 -mr-2">
                {tasks.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()).map(task => (
                    <TaskCard 
                        key={task.id} 
                        task={task}
                        assignee={allUsers.find(u => u.id === task.assigneeId)}
                        onDragStart={onDragStart} 
                        onDelete={onDeleteTask}
                        onSelect={onSelectTask}
                    />
                ))}
                {tasks.length === 0 && (
                    <div className="text-center text-slate-500 pt-10">
                        <p>Drag tasks here</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TaskColumn;
