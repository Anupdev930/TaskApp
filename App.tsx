
import React from 'react';
import { useAuth } from './hooks/useAuth';
import LoginPage from './components/LoginPage';
import DashboardPage from './components/DashboardPage';

const App: React.FC = () => {
    const { isLoggedIn } = useAuth();

    return (
        <div className="min-h-screen bg-slate-900 font-sans">
            {isLoggedIn ? <DashboardPage /> : <LoginPage />}
        </div>
    );
};

export default App;
