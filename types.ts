export enum TaskStatus {
    ToDo = 'To Do',
    InProgress = 'In Progress',
    OnHold = 'On Hold',
    Done = 'Done',
    Completed = 'Completed'
}

export enum UserRole {
    Admin = 'Admin',
    User = 'User'
}

export interface Remark {
    id: string;
    // FIX: Added taskId to align the type with the data structure in Google Sheets, resolving a type error in `googleSheetService.ts`.
    taskId: string;
    text: string;
    createdAt: string;
}

export interface WorkLog {
    id:string;
    // FIX: Added taskId to align the type with the data structure in Google Sheets, resolving a type error in `googleSheetService.ts`.
    taskId: string;
    startTime: string;
    endTime: string | null;
}

export interface Task {
    id: string;
    title: string;
    description: string;
    status: TaskStatus;
    priority: 'Low' | 'Medium' | 'High';
    createdAt: string;
    remarks: Remark[];
    workLogs: WorkLog[];
    assigneeId: string;
}

export interface User {
    id: string;
    username: string;
    password; // In a real app, this would be a hash
    name: string;
    role: UserRole;
}

export interface Reporting {
    id: string;
    userId: string;
    reportToUserId: string;
}