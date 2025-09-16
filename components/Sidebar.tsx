import React from 'react';
import { useAuth } from '../hooks/useAuth';
import { UserCircleIcon, ViewGridIcon, ChartBarIcon, LogoutIcon } from './icons/Icons';

type View = 'board' | 'analysis';

interface SidebarProps {
    currentView: View;
    onNavigate: (view: View) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ currentView, onNavigate }) => {
    const { logout, user } = useAuth();

    const navItems = [
        { id: 'board', label: 'Board', icon: ViewGridIcon },
        { id: 'analysis', label: 'Analysis', icon: ChartBarIcon },
    ];

    return (
        <aside className="w-64 bg-slate-800/80 backdrop-blur-sm border-r border-slate-700 flex flex-col flex-shrink-0">
            <div className="p-6 border-b border-slate-700">
                <div className="flex items-center gap-3">
                    <UserCircleIcon className="w-10 h-10 text-slate-400" />
                    <div>
                        <p className="font-semibold text-white">{user?.name || 'User'}</p>
                        <p className="text-sm text-slate-400">{user?.role || 'Role'}</p>
                    </div>
                </div>
            </div>

            <nav className="flex-grow p-4 space-y-2">
                {navItems.map(item => {
                    const isActive = currentView === item.id;
                    return (
                        <button
                            key={item.id}
                            onClick={() => onNavigate(item.id as View)}
                            className={`w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                                isActive 
                                ? 'bg-indigo-600 text-white shadow-lg' 
                                : 'text-slate-300 hover:bg-slate-700 hover:text-white'
                            }`}
                        >
                            <item.icon className="w-5 h-5" />
                            <span>{item.label}</span>
                        </button>
                    )
                })}
            </nav>

            <div className="p-4 border-t border-slate-700">
                <button
                    onClick={logout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium text-slate-300 hover:bg-slate-700 hover:text-white transition-colors"
                >
                    <LogoutIcon className="w-5 h-5" />
                    <span>Logout</span>
                </button>
            </div>
        </aside>
    );
};

export default Sidebar;