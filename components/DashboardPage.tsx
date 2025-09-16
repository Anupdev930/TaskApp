import React, { useState, useEffect, useMemo } from 'react';
import { Task, TaskStatus, User, Reporting, UserRole } from '../types';
import { TASK_STATUSES } from '../constants';
import * as sheetService from '../services/googleSheetService';
import Header from './Header';
import TaskColumn from './TaskColumn';
import AddTaskModal from './AddTaskModal';
import TaskDetailModal from './TaskDetailModal';
import Loader from './Loader';
import Sidebar from './Sidebar';
import AnalysisPage from './AnalysisPage';
import { useAuth } from '../hooks/useAuth';

type View = 'board' | 'analysis';

const DashboardPage: React.FC = () => {
    const { user: currentUser } = useAuth();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [allUsers, setAllUsers] = useState<User[]>([]);
    const [reportingData, setReportingData] = useState<Reporting[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [selectedTask, setSelectedTask] = useState<Task | null>(null);
    const [draggedTask, setDraggedTask] = useState<Task | null>(null);
    const [currentView, setCurrentView] = useState<View>('board');
    const [userFilter, setUserFilter] = useState<string>('all'); // 'all' or a specific userId

    useEffect(() => {
        const loadInitialData = async () => {
            setIsLoading(true);
            setError(null);
            try {
                // Use the new, more efficient bootstrap function
                const { tasks, users, reporting } = await sheetService.getInitialData();
                setTasks(tasks);
                setAllUsers(users);
                setReportingData(reporting);
            } catch (error) {
                console.error("Failed to fetch initial data", error);
                setError("Could not connect to the backend server. Please ensure the server is running (e.g., `npm run dev` in the /backend folder) and that it's accessible at http://localhost:3001.");
            } finally {
                setIsLoading(false);
            }
        };

        loadInitialData();
    }, []);
    
    const { visibleTasks, assignableUsers, filterUsers } = useMemo(() => {
        if (!currentUser || !allUsers.length) {
            return { visibleTasks: [], assignableUsers: [], filterUsers: [] };
        }

        if (currentUser.role === UserRole.Admin) {
            const reporteeIds = reportingData
                .filter(r => r.reportToUserId === currentUser.id)
                .map(r => r.userId);
            
            const teamUserIds = [currentUser.id, ...reporteeIds];
            
            const _assignableUsers = allUsers.filter(u => teamUserIds.includes(u.id));
            const _reportees = allUsers.filter(u => reporteeIds.includes(u.id));

            let _visibleTasks = tasks.filter(task => teamUserIds.includes(task.assigneeId));

            if (userFilter !== 'all') {
                _visibleTasks = _visibleTasks.filter(task => task.assigneeId === userFilter);
            }

            return { visibleTasks: _visibleTasks, assignableUsers: _assignableUsers, filterUsers: _reportees };
        } else { // UserRole.User
            const _visibleTasks = tasks.filter(task => task.assigneeId === currentUser.id);
            return { visibleTasks: _visibleTasks, assignableUsers: [currentUser], filterUsers: [] };
        }
    }, [tasks, currentUser, allUsers, reportingData, userFilter]);
    
    const updateTaskInState = (updatedTask: Task) => {
        setTasks(prevTasks => prevTasks.map(t => t.id === updatedTask.id ? updatedTask : t));
        if (selectedTask && selectedTask.id === updatedTask.id) {
            setSelectedTask(updatedTask);
        }
    };

    const handleAddTask = async (taskData: Omit<Task, 'id' | 'createdAt' | 'remarks' | 'workLogs'>) => {
        try {
            const newTask = await sheetService.addTask(taskData);
            setTasks(prev => [...prev, newTask]);
            setIsAddModalOpen(false);
        } catch (error) {
            console.error("Failed to add task", error);
        }
    };

    const handleUpdateTask = async (taskId: string, updates: Partial<Task>) => {
        const originalTasks = tasks;
        // Optimistic update for UI responsiveness
        setTasks(prevTasks => prevTasks.map(task => task.id === taskId ? { ...task, ...updates } : task));
        if (selectedTask && selectedTask.id === taskId) {
            setSelectedTask(prev => prev ? { ...prev, ...updates } : null);
        }

        try {
            const updatedTask = await sheetService.updateTask(taskId, updates);
            // Sync with the server's response
            updateTaskInState(updatedTask);
        } catch (error) {
            console.error("Failed to update task", error);
            // Revert on error
            setTasks(originalTasks);
        }
    };

    const handleDeleteTask = async (taskId: string) => {
        const originalTasks = tasks;
        setTasks(prev => prev.filter(task => task.id !== taskId));
        try {
            await sheetService.deleteTask(taskId);
        } catch (error) {
            console.error("Failed to delete task", error);
            setTasks(originalTasks);
        }
    };

    const handleAddRemark = async (taskId: string, remarkText: string) => {
        try {
            const updatedTask = await sheetService.addRemarkToTask(taskId, remarkText);
            updateTaskInState(updatedTask);
        } catch (error) {
            console.error("Failed to add remark:", error);
        }
    };
    
    const handleStartTimer = async (taskId: string) => {
        try {
            const updatedTask = await sheetService.startTaskTimer(taskId);
            updateTaskInState(updatedTask);
        } catch (error) {
            console.error("Failed to start timer:", error);
        }
    };
    
    const handleStopTimer = async (taskId: string) => {
        try {
            const updatedTask = await sheetService.stopTaskTimer(taskId);
            updateTaskInState(updatedTask);
        } catch (error) {
            console.error("Failed to stop timer:", error);
        }
    };

    const onDragStart = (task: Task) => {
        setDraggedTask(task);
    };

    const onDrop = (status: TaskStatus) => {
        if (draggedTask && draggedTask.status !== status) {
            handleUpdateTask(draggedTask.id, { status });
        }
        setDraggedTask(null);
    };

    const pageTitle = currentView === 'board' ? 'Gemini TaskBoard' : 'Project Analysis';

    return (
        <div className="flex h-screen bg-slate-900 text-white overflow-hidden">
            <Sidebar currentView={currentView} onNavigate={setCurrentView} />

            <div className="flex flex-col flex-grow overflow-hidden">
                <Header 
                    onAddTask={() => setIsAddModalOpen(true)} 
                    title={pageTitle}
                    showAddTaskButton={currentView === 'board'}
                    currentUser={currentUser}
                    filterUsers={filterUsers}
                    userFilter={userFilter}
                    onUserFilterChange={setUserFilter}
                />
                
                {isLoading ? (
                    <div className="flex-grow flex items-center justify-center">
                        <Loader />
                    </div>
                ) : error ? (
                     <div className="flex-grow flex flex-col items-center justify-center p-8 text-center">
                        <div className="bg-red-900/50 border border-red-500/50 text-red-200 p-8 rounded-2xl max-w-lg">
                            <h2 className="text-2xl font-bold mb-3 text-white">Connection Error</h2>
                            <p className="text-red-200 mb-6">{error}</p>
                            <p className="text-sm text-slate-400">This app requires a separate backend server to connect to Google Sheets. The frontend is running, but it can't reach the server.</p>
                        </div>
                    </div>
                ) : (
                    <>
                        {currentView === 'board' && (
                             <main className="flex-grow p-4 md:p-6 lg:p-8 flex gap-6 overflow-x-auto">
                                {TASK_STATUSES.map(status => (
                                    <TaskColumn
                                        key={status}
                                        status={status}
                                        tasks={visibleTasks.filter(t => t.status === status)}
                                        onDrop={onDrop}
                                        onDragStart={onDragStart}
                                        onDeleteTask={handleDeleteTask}
                                        onSelectTask={setSelectedTask}
                                        allUsers={allUsers}
                                    />
                                ))}
                            </main>
                        )}
                        {currentView === 'analysis' && (
                            <main className="flex-grow overflow-y-auto">
                                <AnalysisPage tasks={visibleTasks} />
                            </main>
                        )}
                    </>
                )}
            </div>

            {isAddModalOpen && (
                <AddTaskModal
                    onClose={() => setIsAddModalOpen(false)}
                    onAddTask={handleAddTask}
                    currentUser={currentUser!}
                    assignableUsers={assignableUsers}
                />
            )}

            {selectedTask && (
                <TaskDetailModal 
                    task={selectedTask}
                    onClose={() => setSelectedTask(null)}
                    onAddRemark={handleAddRemark}
                    onStartTimer={handleStartTimer}
                    onStopTimer={handleStopTimer}
                    onUpdateTask={handleUpdateTask}
                />
            )}
        </div>
    );
};

export default DashboardPage;