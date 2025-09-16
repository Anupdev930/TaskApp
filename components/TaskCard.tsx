import React from 'react';
import { Task, WorkLog, TaskStatus, User } from '../types';
import { TrashIcon, ClockIcon, ChatBubbleIcon, LockIcon, UserCircleIcon } from './icons/Icons';

interface TaskCardProps {
    task: Task;
    assignee?: User;
    onDragStart: (task: Task) => void;
    onDelete: (taskId: string) => void;
    onSelect: (task: Task) => void;
}

const priorityColors: Record<Task['priority'], string> = {
    Low: 'bg-green-500/20 text-green-300 border border-green-500/30',
    Medium: 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30',
    High: 'bg-red-500/20 text-red-300 border border-red-500/30',
};

const calculateTotalTime = (workLogs: WorkLog[]): number => {
    return workLogs.reduce((total, log) => {
        const start = new Date(log.startTime).getTime();
        const end = log.endTime ? new Date(log.endTime).getTime() : Date.now();
        return total + (end - start);
    }, 0);
};

const formatMilliseconds = (ms: number): string => {
    if (ms < 0) ms = 0;
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    
    if (hours === 0 && minutes === 0) return "0m";
    return `${hours > 0 ? `${hours}h ` : ''}${minutes}m`;
};

const UserAvatar: React.FC<{ user?: User }> = ({ user }) => {
    const initials = user ? user.name.split(' ').map(n => n[0]).join('').substring(0,2) : '?';
    // A simple hash function to get a color for the user
    const colorIndex = user ? user.name.charCodeAt(0) % 5 : 0;
    const colors = ['bg-pink-500', 'bg-purple-500', 'bg-blue-500', 'bg-teal-500', 'bg-orange-500'];
    
    return (
        <div title={`Assigned to ${user?.name || 'Unassigned'}`} className={`w-6 h-6 rounded-full ${colors[colorIndex]} flex items-center justify-center text-xs font-bold text-white uppercase`}>
            {initials}
        </div>
    );
}

const TaskCard: React.FC<TaskCardProps> = ({ task, assignee, onDragStart, onDelete, onSelect }) => {
    const isLocked = task.status === TaskStatus.Done || task.status === TaskStatus.Completed;

    const handleDragStart = (e: React.DragEvent<HTMLDivElement>) => {
        if (isLocked) {
            e.preventDefault();
            return;
        }
        e.stopPropagation();
        e.dataTransfer.effectAllowed = 'move';
        onDragStart(task);
    };

    const handleDelete = (e: React.MouseEvent<HTMLButtonElement>) => {
        e.stopPropagation();
        if (window.confirm(`Are you sure you want to delete "${task.title}"?`)) {
            onDelete(task.id);
        }
    }

    const totalTimeLogged = calculateTotalTime(task.workLogs);
    const isTimerRunning = task.workLogs.some(log => log.endTime === null);

    return (
        <div
            onClick={() => onSelect(task)}
            onDragStart={handleDragStart}
            draggable={!isLocked}
            role="button"
            className={`bg-slate-800 p-4 rounded-lg shadow-md border border-slate-700 transition-all duration-200 group ${isLocked ? 'opacity-70 cursor-not-allowed' : 'cursor-pointer active:cursor-grabbing hover:border-indigo-500 hover:bg-slate-800/80'}`}
        >
            <div className="flex justify-between items-start">
                <h3 className={`font-bold text-slate-100 pr-2 ${!isLocked && 'group-hover:text-indigo-400'} transition-colors`}>{task.title}</h3>
                <button
                    onClick={handleDelete}
                    disabled={isLocked}
                    className="flex-shrink-0 text-slate-500 hover:text-red-400 transition-colors duration-200 p-1 rounded-full hover:bg-slate-700 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:text-slate-500"
                    title={isLocked ? "Cannot delete completed task" : "Delete task"}
                >
                    <TrashIcon className="w-4 h-4" />
                </button>
            </div>
            
            <div className="flex items-center justify-between mt-4">
                <span className={`text-xs font-semibold px-2 py-1 rounded-full ${priorityColors[task.priority]}`}>
                    {task.priority}
                </span>
                <div className="flex items-center gap-1.5 text-xs text-slate-400">
                    <span title="Remarks" className="flex items-center gap-1">
                        <ChatBubbleIcon className="w-4 h-4"/>
                        {task.remarks.length}
                    </span>
                    <span title="Time Logged" className={`flex items-center gap-1 ${isTimerRunning ? 'text-green-400' : ''}`}>
                        {isTimerRunning && <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>}
                        <ClockIcon className="w-4 h-4"/>
                        {formatMilliseconds(totalTimeLogged)}
                    </span>
                    {isLocked && <LockIcon className="w-4 h-4 text-slate-500" title="Task is locked"/>}
                </div>
            </div>

            <div className="border-t border-slate-700 mt-4 pt-3 flex items-center justify-end gap-2">
                <span className="text-xs text-slate-400">{assignee?.name || 'Unassigned'}</span>
                <UserAvatar user={assignee} />
            </div>
        </div>
    );
};

export default TaskCard;
