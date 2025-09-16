import { google } from 'googleapis';
import { Task, User, Remark, WorkLog, Reporting, UserRole, TaskStatus } from '../../types';

// --- CONFIGURATION ---
const SPREADSHEET_ID = process.env.GOOGLE_SHEET_ID;

const auth = new google.auth.GoogleAuth({
    credentials: {
        client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
        private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({ version: 'v4', auth });

// --- HELPERS ---

// Helper to convert a raw row array from sheets to a typed object
const arrayToTask = (row: any[], remarks: Remark[], workLogs: WorkLog[]): Task => ({
    id: row[0],
    title: row[1],
    description: row[2],
    status: row[3] as TaskStatus,
    priority: row[4] as 'Low' | 'Medium' | 'High',
    createdAt: row[5],
    assigneeId: row[6],
    remarks,
    workLogs,
});

const arrayToUser = (row: any[]): User => ({
    id: row[0],
    username: row[1],
    password: row[2],
    name: row[3],
    role: row[4] as UserRole,
});

const arrayToRemark = (row: any[]): Remark => ({
    id: row[0],
    taskId: row[1],
    text: row[2],
    createdAt: row[3],
});

const arrayToWorkLog = (row: any[]): WorkLog => ({
    id: row[0],
    taskId: row[1],
    startTime: row[2],
    endTime: row[3] || null,
});

const arrayToReporting = (row: any[]): Reporting => ({
    id: row[0],
    userId: row[1],
    reportToUserId: row[2],
});

// Helper to find the row index of an item by its ID
const findRowIndex = (id: string, allRows: any[][]): number => {
    // +2 because sheets are 1-indexed and we skip the header row
    const rowIndex = allRows.findIndex(row => row[0] === id);
    if (rowIndex === -1) throw new Error(`Item with ID ${id} not found.`);
    return rowIndex + 2;
}


// --- DATA FETCHING ---

export const getUsers = async (): Promise<User[]> => {
    const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: 'Users!A2:E',
    });
    const rows = response.data.values || [];
    return rows.map(arrayToUser);
};

export const getReporting = async (): Promise<Reporting[]> => {
    const response = await sheets.spreadsheets.values.get({
        spreadsheetId: SPREADSHEET_ID,
        range: 'Reporting!A2:C',
    });
    const rows = response.data.values || [];
    return rows.map(arrayToReporting);
};

export const getTasks = async (): Promise<Task[]> => {
    // Fetch all data types in parallel for efficiency
    const [taskRes, remarkRes, workLogRes] = await Promise.all([
        sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: 'Tasks!A2:G' }),
        sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: 'Remarks!A2:D' }),
        sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: 'WorkLogs!A2:D' }),
    ]);

    const taskRows = taskRes.data.values || [];
    const allRemarks = (remarkRes.data.values || []).map(arrayToRemark);
    const allWorkLogs = (workLogRes.data.values || []).map(arrayToWorkLog);

    // Group remarks and worklogs by taskId for easy lookup
    const remarksByTaskId = allRemarks.reduce((acc, r) => {
        (acc[r.taskId] = acc[r.taskId] || []).push(r);
        return acc;
    }, {} as Record<string, Remark[]>);

    const workLogsByTaskId = allWorkLogs.reduce((acc, wl) => {
        (acc[wl.taskId] = acc[wl.taskId] || []).push(wl);
        return acc;
    }, {} as Record<string, WorkLog[]>);
    
    return taskRows.map(row => arrayToTask(row, remarksByTaskId[row[0]] || [], workLogsByTaskId[row[0]] || []));
};


// --- DATA MUTATION ---

export const addTask = async (taskData: Omit<Task, 'id' | 'createdAt' | 'remarks' | 'workLogs'>): Promise<Task> => {
    const newTask: Omit<Task, 'remarks' | 'workLogs'> = {
        ...taskData,
        id: `task-${Date.now()}`,
        createdAt: new Date().toISOString(),
    };

    await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: 'Tasks!A:G',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
            values: [[newTask.id, newTask.title, newTask.description, newTask.status, newTask.priority, newTask.createdAt, newTask.assigneeId]],
        },
    });

    return { ...newTask, remarks: [], workLogs: [] };
};

export const updateTask = async (taskId: string, updates: Partial<Task>): Promise<Task> => {
    const taskRows = (await sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: 'Tasks!A:G' })).data.values || [];
    const rowIndex = findRowIndex(taskId, taskRows);
    
    // We can only update status or priority this way for now.
    // More complex updates would require more specific logic.
    if (updates.status) {
        await sheets.spreadsheets.values.update({
            spreadsheetId: SPREADSHEET_ID,
            range: `Tasks!D${rowIndex}`,
            valueInputOption: 'RAW',
            requestBody: { values: [[updates.status]] }
        });
    }
    // Add other updatable fields here if needed

    const allTasks = await getTasks();
    const updatedTask = allTasks.find(t => t.id === taskId);
    if (!updatedTask) throw new Error("Could not find task after update.");
    return updatedTask;
}

export const deleteTask = async (taskId: string): Promise<void> => {
    const taskRows = (await sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: 'Tasks!A:G' })).data.values || [];
    const rowIndex = findRowIndex(taskId, taskRows);

    await sheets.spreadsheets.values.clear({
        spreadsheetId: SPREADSHEET_ID,
        range: `Tasks!A${rowIndex}:G${rowIndex}`,
    });
}

export const addRemarkToTask = async (taskId: string, remarkText: string): Promise<Task> => {
    const newRemark: Omit<Remark, 'taskId'> = {
        id: `rem-${Date.now()}`,
        text: remarkText,
        createdAt: new Date().toISOString(),
    };

    await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: 'Remarks!A:D',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
            values: [[newRemark.id, taskId, newRemark.text, newRemark.createdAt]],
        },
    });

    const allTasks = await getTasks();
    const updatedTask = allTasks.find(t => t.id === taskId);
    if (!updatedTask) throw new Error("Could not find task after adding remark.");
    return updatedTask;
};

export const startTaskTimer = async (taskId: string): Promise<Task> => {
    const newWorkLog: Omit<WorkLog, 'taskId' | 'endTime'> = {
        id: `wl-${Date.now()}`,
        startTime: new Date().toISOString(),
    };

    await sheets.spreadsheets.values.append({
        spreadsheetId: SPREADSHEET_ID,
        range: 'WorkLogs!A:D',
        valueInputOption: 'USER_ENTERED',
        requestBody: {
            values: [[newWorkLog.id, taskId, newWorkLog.startTime, '']],
        },
    });
    
    const allTasks = await getTasks();
    const updatedTask = allTasks.find(t => t.id === taskId);
    if (!updatedTask) throw new Error("Could not find task after starting timer.");
    return updatedTask;
};

export const stopTaskTimer = async (taskId: string): Promise<Task> => {
    const workLogRes = await sheets.spreadsheets.values.get({ spreadsheetId: SPREADSHEET_ID, range: 'WorkLogs!A:D' });
    const workLogRows = workLogRes.data.values || [];
    
    const runningLogIndex = workLogRows.findIndex(row => row[1] === taskId && !row[3]);
    if (runningLogIndex === -1) throw new Error("No running timer found for this task.");

    const rowIndex = runningLogIndex + 2; // +2 for 1-based index and header

    await sheets.spreadsheets.values.update({
        spreadsheetId: SPREADSHEET_ID,
        range: `WorkLogs!D${rowIndex}`,
        valueInputOption: 'USER_ENTERED',
        requestBody: {
            values: [[new Date().toISOString()]],
        },
    });

    const allTasks = await getTasks();
    const updatedTask = allTasks.find(t => t.id === taskId);
    if (!updatedTask) throw new Error("Could not find task after stopping timer.");
    return updatedTask;
};
