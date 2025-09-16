import React, { useMemo } from 'react';
import { Task, TaskStatus } from '../types';
import { TASK_STATUSES } from '../constants';
// FIX: Import missing icons to resolve 'Cannot find name' errors.
import { ClockIcon, ViewGridIcon, TrashIcon } from './icons/Icons';

interface AnalysisPageProps {
    tasks: Task[];
}

const StatCard: React.FC<{ title: string; value: string | number; icon: React.ReactNode }> = ({ title, value, icon }) => (
    <div className="bg-slate-800 p-6 rounded-lg flex items-center gap-4">
        <div className="bg-slate-700 p-3 rounded-full">
            {icon}
        </div>
        <div>
            <p className="text-slate-400 text-sm">{title}</p>
            <p className="text-2xl font-bold text-white">{value}</p>
        </div>
    </div>
);

const BarChart: React.FC<{ title: string; data: { label: string; value: number; color: string }[] }> = ({ title, data }) => {
    const maxValue = Math.max(...data.map(d => d.value), 1);
    return (
        <div className="bg-slate-800 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-slate-200 mb-4">{title}</h3>
            <div className="space-y-4">
                {data.map(item => (
                    <div key={item.label} className="grid grid-cols-4 gap-3 items-center text-sm">
                        <span className="text-slate-400 col-span-1 truncate">{item.label}</span>
                        <div className="col-span-3 flex items-center gap-3">
                             <div className="w-full bg-slate-700 rounded-full h-2.5">
                                <div
                                    className={`${item.color} h-2.5 rounded-full`}
                                    style={{ width: `${(item.value / maxValue) * 100}%` }}
                                ></div>
                            </div>
                            <span className="font-semibold text-slate-200 w-8 text-right">{item.value}</span>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

const AnalysisPage: React.FC<AnalysisPageProps> = ({ tasks }) => {
    const analysisData = useMemo(() => {
        const totalTimeMs = tasks.reduce((total, task) => {
            return total + task.workLogs.reduce((taskTotal, log) => {
                const start = new Date(log.startTime).getTime();
                const end = log.endTime ? new Date(log.endTime).getTime() : start;
                return taskTotal + (end - start);
            }, 0);
        }, 0);

        const totalHours = (totalTimeMs / (1000 * 60 * 60)).toFixed(1);
        
        const sevenDaysAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
        const overdueTasks = tasks.filter(t => t.status === TaskStatus.ToDo && new Date(t.createdAt).getTime() < sevenDaysAgo).length;

        const tasksByStatus = TASK_STATUSES.map(status => ({
            label: status,
            value: tasks.filter(t => t.status === status).length,
        }));
        
        const priorities: Task['priority'][] = ['High', 'Medium', 'Low'];
        const tasksByPriority = priorities.map(p => ({
            label: p,
            value: tasks.filter(t => t.priority === p).length
        }));

        const recentlyCompleted = tasks
            .filter(t => t.status === TaskStatus.Completed)
            .sort((a, b) => {
                const lastLogA = a.workLogs[a.workLogs.length - 1];
                const lastLogB = b.workLogs[b.workLogs.length - 1];
                const timeA = lastLogA?.endTime ? new Date(lastLogA.endTime).getTime() : 0;
                const timeB = lastLogB?.endTime ? new Date(lastLogB.endTime).getTime() : 0;
                return timeB - timeA;
            })
            .slice(0, 5);

        return { totalHours, overdueTasks, tasksByStatus, tasksByPriority, recentlyCompleted };
    }, [tasks]);
    
    const statusChartData = [
        { label: 'To Do', value: analysisData.tasksByStatus.find(s=>s.label === TaskStatus.ToDo)?.value ?? 0, color: 'bg-sky-500' },
        { label: 'In Progress', value: analysisData.tasksByStatus.find(s=>s.label === TaskStatus.InProgress)?.value ?? 0, color: 'bg-yellow-500' },
        { label: 'On Hold', value: analysisData.tasksByStatus.find(s=>s.label === TaskStatus.OnHold)?.value ?? 0, color: 'bg-gray-500' },
        { label: 'Done', value: analysisData.tasksByStatus.find(s=>s.label === TaskStatus.Done)?.value ?? 0, color: 'bg-green-500' },
        { label: 'Completed', value: analysisData.tasksByStatus.find(s=>s.label === TaskStatus.Completed)?.value ?? 0, color: 'bg-purple-500' },
    ];
    
     const priorityChartData = [
        { label: 'High', value: analysisData.tasksByPriority.find(p=>p.label === 'High')?.value ?? 0, color: 'bg-red-500' },
        { label: 'Medium', value: analysisData.tasksByPriority.find(p=>p.label === 'Medium')?.value ?? 0, color: 'bg-yellow-500' },
        { label: 'Low', value: analysisData.tasksByPriority.find(p=>p.label === 'Low')?.value ?? 0, color: 'bg-green-500' },
    ];

    return (
        <div className="p-4 md:p-6 lg:p-8 space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <StatCard title="Total Tasks" value={tasks.length} icon={<ViewGridIcon className="w-6 h-6 text-indigo-300" />} />
                <StatCard title="Total Time Logged" value={`${analysisData.totalHours} hrs`} icon={<ClockIcon className="w-6 h-6 text-green-300" />} />
                <StatCard title="Overdue Tasks" value={analysisData.overdueTasks} icon={<TrashIcon className="w-6 h-6 text-red-300" />} />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <BarChart title="Task Distribution by Status" data={statusChartData} />
                <BarChart title="Task Distribution by Priority" data={priorityChartData} />
            </div>
            
            <div className="bg-slate-800 p-6 rounded-lg">
                 <h3 className="text-lg font-semibold text-slate-200 mb-4">Recently Completed</h3>
                 <div className="space-y-3">
                    {analysisData.recentlyCompleted.length > 0 ? (
                        analysisData.recentlyCompleted.map(task => (
                            <div key={task.id} className="bg-slate-900/50 p-3 rounded-md flex justify-between items-center">
                                <p className="text-slate-300">{task.title}</p>
                                <p className="text-sm text-slate-500">
                                    {task.workLogs.length > 0 && task.workLogs[task.workLogs.length - 1].endTime 
                                        ? `Completed on ${new Date(task.workLogs[task.workLogs.length - 1].endTime!).toLocaleDateString()}` 
                                        : 'N/A'}
                                </p>
                            </div>
                        ))
                    ) : (
                        <p className="text-slate-500 text-center py-4">No tasks have been completed yet.</p>
                    )}
                 </div>
            </div>
        </div>
    );
};

export default AnalysisPage;