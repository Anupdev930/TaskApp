import React, { createContext, useState, useContext, ReactNode, useCallback, useEffect } from 'react';
import { User } from '../types';
import * as sheetService from '../services/googleSheetService';


interface AuthContextType {
    isLoggedIn: boolean;
    user: User | null;
    login: (user: string, pass: string) => Promise<boolean>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_USER_KEY = 'auth_user';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(() => {
        try {
            const userJson = localStorage.getItem(AUTH_USER_KEY);
            return userJson ? JSON.parse(userJson) : null;
        } catch {
            return null;
        }
    });

    const isLoggedIn = !!user;

    useEffect(() => {
        if (user) {
            localStorage.setItem(AUTH_USER_KEY, JSON.stringify(user));
        } else {
            localStorage.removeItem(AUTH_USER_KEY);
        }
    }, [user]);

    const login = useCallback(async (username: string, pass: string): Promise<boolean> => {
        const users = await sheetService.getUsers();
        const foundUser = users.find(u => u.username === username && u.password === pass);

        if (foundUser) {
            setUser(foundUser);
            return true;
        } else {
            return false;
        }
    }, []);

    const logout = useCallback(() => {
        setUser(null);
    }, []);

    return (
        <AuthContext.Provider value={{ isLoggedIn, user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};