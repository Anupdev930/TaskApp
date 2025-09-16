import React, { useState, useMemo } from 'react';
import { Task, TaskStatus, WorkLog } from '../types';
import { CloseIcon, PlayIcon, StopIcon, LockIcon } from './icons/Icons';
import { TASK_STATUSES } from '../constants';

interface TaskDetailModalProps {
    task: Task;
    onClose: () => void;
    onAddRemark: (taskId: string, remarkText: string) => void;
    onStartTimer: (taskId: string) => void;
    onStopTimer: (taskId: string) => void;
    onUpdateTask: (taskId: string, updates: Partial<Task>) => void;
}

const priorityColors: Record<Task['priority'], string> = {
    Low: 'bg-green-500/20 text-green-300',
    Medium: 'bg-yellow-500/20 text-yellow-300',
    High: 'bg-red-500/20 text-red-300',
};

const statusColors: Record<Task['status'], string> = {
    [TaskStatus.ToDo]: 'bg-sky-500/20 text-sky-300',
    [TaskStatus.InProgress]: 'bg-yellow-500/20 text-yellow-300',
    [TaskStatus.OnHold]: 'bg-gray-500/20 text-gray-300',
    [TaskStatus.Done]: 'bg-green-500/20 text-green-300',
    [TaskStatus.Completed]: 'bg-purple-500/20 text-purple-300',
}

const formatDuration = (start: string, end: string | null) => {
    let diff = (new Date(end ?? Date.now()).getTime() - new Date(start).getTime());
    if (diff < 0) diff = 0; // Prevent negative durations
    diff /= 1000;
    const hours = Math.floor(diff / 3600).toString().padStart(2, '0');
    diff %= 3600;
    const minutes = Math.floor(diff / 60).toString().padStart(2, '0');
    const seconds = Math.floor(diff % 60).toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
}

const formatMsToHHMMSS = (ms: number) => {
    if (ms < 0) ms = 0;
    const totalSeconds = Math.floor(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return [
        hours.toString().padStart(2, '0'),
        minutes.toString().padStart(2, '0'),
        seconds.toString().padStart(2, '0')
    ].join(':');
};

const TaskDetailModal: React.FC<TaskDetailModalProps> = ({ task, onClose, onAddRemark, onStartTimer, onStopTimer, onUpdateTask }) => {
    const [newRemark, setNewRemark] = useState('');

    const isLocked = useMemo(() => task.status === TaskStatus.Done || task.status === TaskStatus.Completed, [task.status]);

    const handleRemarkSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!newRemark.trim() || isLocked) return;
        onAddRemark(task.id, newRemark);
        setNewRemark('');
    };

    const isTimerRunning = useMemo(() => task.workLogs.some(log => log.endTime === null), [task.workLogs]);
    const totalTimeMs = useMemo(() => {
        return task.workLogs.reduce((total, log) => {
            const start = new Date(log.startTime).getTime();
            // For locked tasks, don't count time from now, use the end time.
            const end = log.endTime ? new Date(log.endTime).getTime() : (isLocked ? start : Date.now());
            return total + (end - start);
        }, 0);
    }, [task.workLogs, isLocked]);


    return (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={onClose}>
            <div className="bg-slate-800 w-full max-w-4xl max-h-[90vh] rounded-2xl shadow-2xl border border-slate-700 flex flex-col" onClick={e => e.stopPropagation()}>
                {/* Header */}
                <div className="flex justify-between items-center p-6 border-b border-slate-700 flex-shrink-0">
                    <h2 className="text-2xl font-bold text-white truncate pr-4">{task.title}</h2>
                    <div className="flex items-center gap-4">
                        <select
                            value={task.status}
                            onChange={e => onUpdateTask(task.id, { status: e.target.value as TaskStatus })}
                            disabled={isLocked}
                            className="bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-sm text-white focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-70 disabled:cursor-not-allowed"
                        >
                            {TASK_STATUSES.map(status => (
                                <option key={status} value={status}>
                                    {status}
                                </option>
                            ))}
                        </select>
                        <button onClick={onClose} className="p-2 rounded-full text-slate-400 hover:bg-slate-700 hover:text-white transition-colors">
                            <CloseIcon className="w-6 h-6" />
                        </button>
                    </div>
                </div>

                {/* Body */}
                <div className="flex-grow p-6 flex flex-col gap-6 overflow-y-auto">
                    {isLocked && (
                        <div className="bg-yellow-500/20 border border-yellow-500/30 text-yellow-300 text-sm rounded-lg p-3 flex items-center gap-3">
                           <LockIcon className="w-5 h-5 flex-shrink-0"/>
                           <span>This task is in a final state ({task.status}) and cannot be edited.</span>
                        </div>
                    )}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                         {/* Left Column */}
                        <div className="lg:col-span-2 space-y-6">
                            <div>
                                <h3 className="font-semibold text-slate-300 mb-2">Description</h3>
                                <p className="text-slate-400 whitespace-pre-wrap">{task.description || 'No description provided.'}</p>
                            </div>
                            <div>
                                <h3 className="font-semibold text-slate-300 mb-2">Priority</h3>
                                <span className={`px-3 py-1 text-sm font-semibold rounded-full ${priorityColors[task.priority]}`}>{task.priority}</span>
                            </div>
                        </div>

                        {/* Right Column */}
                        <div className="space-y-6">
                            {/* Time Tracker */}
                            <div>
                                <h3 className="font-semibold text-slate-300 mb-3">Time Tracker</h3>
                                <div className="bg-slate-900/50 p-4 rounded-lg">
                                    <div className="text-center mb-4">
                                        <p className="text-sm text-slate-400">Total Time Logged</p>
                                        <p className="text-3xl font-mono font-bold text-white">{formatMsToHHMMSS(totalTimeMs)}</p>
                                    </div>
                                    {isTimerRunning ? (
                                        <button onClick={() => onStopTimer(task.id)} disabled={isLocked} className="w-full flex items-center justify-center gap-2 bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed">
                                            <StopIcon className="w-5 h-5" /> Stop Timer
                                        </button>
                                    ) : (
                                        <button onClick={() => onStartTimer(task.id)} disabled={isLocked} className="w-full flex items-center justify-center gap-2 bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-4 rounded-lg transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed">
                                            <PlayIcon className="w-5 h-5"/> Start Timer
                                        </button>
                                    )}
                                    <ul className="text-sm text-slate-400 mt-4 space-y-1 max-h-24 overflow-y-auto">
                                        {task.workLogs.slice().reverse().map(log => (
                                            <li key={log.id} className="flex justify-between items-center">
                                                <span>{new Date(log.startTime).toLocaleDateString()}</span> 
                                                <span className="font-mono">{formatDuration(log.startTime, log.endTime)}</span>
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </div>
                            {/* Remarks */}
                            <div>
                                <h3 className="font-semibold text-slate-300 mb-2">Remarks</h3>
                                <div className="space-y-3 max-h-48 overflow-y-auto bg-slate-900/50 p-3 rounded-lg">
                                    {task.remarks.length > 0 ? task.remarks.slice().reverse().map(remark => (
                                        <div key={remark.id} className="text-sm bg-slate-800 p-2 rounded">
                                            <p className="text-slate-300">{remark.text}</p>
                                            <p className="text-xs text-slate-500 text-right">{new Date(remark.createdAt).toLocaleString()}</p>
                                        </div>
                                    )) : <p className="text-sm text-slate-500 text-center py-4">No remarks yet.</p>}
                                </div>
                                <form onSubmit={handleRemarkSubmit} className="mt-3 flex gap-2">
                                    <input 
                                        type="text"
                                        value={newRemark}
                                        onChange={e => setNewRemark(e.target.value)}
                                        placeholder={isLocked ? "Task is locked" : "Add a remark..."}
                                        disabled={isLocked}
                                        className="flex-grow bg-slate-900 border border-slate-700 rounded-md px-3 py-2 text-white text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 disabled:opacity-70 disabled:cursor-not-allowed"
                                    />
                                    <button type="submit" disabled={isLocked} className="bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg text-sm transition-colors disabled:bg-slate-600 disabled:cursor-not-allowed">Add</button>
                                </form>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default TaskDetailModal;