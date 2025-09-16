import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import * as sheetService from './googleSheetService';

dotenv.config();

const app = express();
const port = 3001;

app.use(cors()); // Enable Cross-Origin Resource Sharing
app.use(express.json()); // Enable JSON body parsing

// --- API ROUTES ---

// A single efficient endpoint to get all initial data
app.get('/api/bootstrap', async (req, res) => {    
    try {
        const [tasks, users, reporting] = await Promise.all([
            sheetService.getTasks(),
            sheetService.getUsers(),
            sheetService.getReporting()
        ]);
        res.json({ tasks, users, reporting });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to bootstrap application data.' });
    }
});

// User and Reporting routes
app.get('/api/users', async (req, res) => {
    try {
        const users = await sheetService.getUsers();
        res.json(users);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to get users.' });
    }
});

app.get('/api/reporting', async (req, res) => {
    try {
        const reporting = await sheetService.getReporting();
        res.json(reporting);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to get reporting data.' });
    }
});

// Task routes
app.get('/api/tasks', async (req, res) => {
    try {
        const tasks = await sheetService.getTasks();
        res.json(tasks);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to get tasks.' });
    }
});

app.post('/api/tasks', async (req, res) => {
    try {
        const newTask = await sheetService.addTask(req.body);
        res.status(201).json(newTask);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to add task.' });
    }
});

app.put('/api/tasks/:id', async (req, res) => {
    try {
        const updatedTask = await sheetService.updateTask(req.params.id, req.body);
        res.json(updatedTask);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to update task.' });
    }
});

app.delete('/api/tasks/:id', async (req, res) => {
    try {
        await sheetService.deleteTask(req.params.id);
        res.status(204).send();
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to delete task.' });
    }
});

// Remarks and Timer routes
app.post('/api/tasks/:id/remarks', async (req, res) => {
    try {
        const updatedTask = await sheetService.addRemarkToTask(req.params.id, req.body.text);
        res.json(updatedTask);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to add remark.' });
    }
});

app.post('/api/tasks/:id/timer/start', async (req, res) => {
    try {
        const updatedTask = await sheetService.startTaskTimer(req.params.id);
        res.json(updatedTask);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to start timer.' });
    }
});

app.post('/api/tasks/:id/timer/stop', async (req, res) => {
    try {
        const updatedTask = await sheetService.stopTaskTimer(req.params.id);
        res.json(updatedTask);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Failed to stop timer.' });
    }
});


app.listen(port, () => {
    console.log(`Backend server listening at http://localhost:${port}`);
});
