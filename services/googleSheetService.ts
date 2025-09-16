import { Task, User, Reporting } from '../types';

// This is the base URL of our new backend server.
const API_BASE_URL = 'http://localhost:3001/api';

// --- API Client for the Backend ---
// This service now makes HTTP requests to our Node.js server,
// which securely communicates with the Google Sheets API.

/**
 * Fetches all necessary initial data (tasks, users, reporting) in one call.
 */
const bootstrap = async (): Promise<{ tasks: Task[], users: User[], reporting: Reporting[] }> => {
    const response = await fetch(`${API_BASE_URL}/bootstrap`);
    if (!response.ok) throw new Error('Failed to fetch initial data');
    return response.json();
};

export const getTasks = async (): Promise<Task[]> => {
    // This function is kept for potential future use but bootstrap is more efficient.
    const response = await fetch(`${API_BASE_URL}/tasks`);
    if (!response.ok) throw new Error('Failed to fetch tasks');
    return response.json();
};

export const getUsers = async (): Promise<User[]> => {
    // This is called by the auth hook during login.
    const response = await fetch(`${API_BASE_URL}/users`);
    if (!response.ok) throw new Error('Failed to fetch users');
    return response.json();
};

export const getReporting = async (): Promise<Reporting[]> => {
    const response = await fetch(`${API_BASE_URL}/reporting`);
    if (!response.ok) throw new Error('Failed to fetch reporting data');
    return response.json();
};

// Re-export bootstrap for the dashboard to use
export { bootstrap as getInitialData };


export const addTask = async (taskData: Omit<Task, 'id' | 'createdAt' | 'remarks' | 'workLogs'>): Promise<Task> => {
    const response = await fetch(`${API_BASE_URL}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(taskData),
    });
    if (!response.ok) throw new Error('Failed to add task');
    return response.json();
};

export const updateTask = async (taskId: string, updates: Partial<Task>): Promise<Task> => {
    const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
    });
    if (!response.ok) throw new Error('Failed to update task');
    return response.json();
};

export const deleteTask = async (taskId: string): Promise<void> => {
    const response = await fetch(`${API_BASE_URL}/tasks/${taskId}`, {
        method: 'DELETE',
    });
    if (!response.ok) throw new Error('Failed to delete task');
};

export const addRemarkToTask = async (taskId: string, remarkText: string): Promise<Task> => {
     const response = await fetch(`${API_BASE_URL}/tasks/${taskId}/remarks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: remarkText }),
    });
    if (!response.ok) throw new Error('Failed to add remark');
    return response.json();
};

export const startTaskTimer = async (taskId: string): Promise<Task> => {
    const response = await fetch(`${API_BASE_URL}/tasks/${taskId}/timer/start`, { method: 'POST' });
    if (!response.ok) throw new Error('Failed to start timer');
    return response.json();
};

export const stopTaskTimer = async (taskId: string): Promise<Task> => {
    const response = await fetch(`${API_BASE_URL}/tasks/${taskId}/timer/stop`, { method: 'POST' });
    if (!response.ok) throw new Error('Failed to stop timer');
    return response.json();
};
