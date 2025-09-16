import React from 'react';
import { PlusIcon, UserGroupIcon, UserCircleIcon } from './icons/Icons';
import { User, UserRole } from '../types';

interface HeaderProps {
    onAddTask: () => void;
    title: string;
    showAddTaskButton: boolean;
    currentUser: User | null;
    filterUsers: User[];
    userFilter: string;
    onUserFilterChange: (userId: string) => void;
}

const Header: React.FC<HeaderProps> = ({ onAddTask, title, showAddTaskButton, currentUser, filterUsers, userFilter, onUserFilterChange }) => {
    const isAdmin = currentUser?.role === UserRole.Admin;

    return (
        <header className="flex-shrink-0 bg-slate-800/50 backdrop-blur-sm border-b border-slate-700 px-4 md:px-8 py-4 flex items-center justify-between">
            <h1 className="text-2xl font-bold text-white tracking-tight">
                {title}
            </h1>
            <div className="flex items-center gap-4">
                 {isAdmin && showAddTaskButton && (
                    <div className="relative">
                        <select
                            value={userFilter}
                            onChange={(e) => onUserFilterChange(e.target.value)}
                            className="appearance-none bg-slate-700/50 border border-slate-600 text-white text-sm font-semibold rounded-lg py-2 pl-10 pr-4 focus:outline-none focus:ring-2 focus:ring-indigo-500 hover:bg-slate-700"
                        >
                            <option value="all">All Reportees</option>
                            <option value={currentUser?.id}>My Tasks</option>
                            {filterUsers.map(user => (
                                <option key={user.id} value={user.id}>{user.name}</option>
                            ))}
                        </select>
                         <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                            {userFilter === 'all' ? <UserGroupIcon className="w-5 h-5 text-slate-400" /> : <UserCircleIcon className="w-5 h-5 text-slate-400" />}
                        </div>
                    </div>
                 )}
                 {showAddTaskButton && (
                    <button 
                        onClick={onAddTask}
                        className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-semibold py-2 px-4 rounded-lg transition-all duration-200 shadow-lg shadow-indigo-600/30"
                    >
                        <PlusIcon className="w-5 h-5" />
                        <span className="hidden sm:inline">Add Task</span>
                    </button>
                 )}
            </div>
        </header>
    );
};

export default Header;
