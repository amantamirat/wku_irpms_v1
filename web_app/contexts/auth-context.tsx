'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { User } from '@/app/(main)/users/models/user.model';
import { LoginDto } from '@/app/(full-page)/auth/login/model/login.model';
import { AuthApi } from '@/app/(full-page)/auth/api/auth.api';


interface AuthContextType {
    user: User | null;
    loading: boolean;
    loggedIn: boolean;
    login: (user: LoginDto) => Promise<boolean>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    //const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const userInfo = AuthApi.getLoggedInUser();
        if (userInfo) {
            try {
                setUser(userInfo);
            } catch {
                setUser(null);
            }
        }
        setLoading(false);
    }, []);


    const login = async (user: LoginDto) => {
        const loggedInuser = await AuthApi.loginUser(user);
        setUser(loggedInuser);
        return true;
    };

    const logout = () => {
        AuthApi.logout();
        setUser(null);
        //router.push('/auth/login');
    };

    return (
        <AuthContext.Provider value={{ user, loading, loggedIn: !!user, login, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return context;
};