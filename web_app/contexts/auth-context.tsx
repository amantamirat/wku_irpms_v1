'use client';

import React, {
    createContext,
    useContext,
    useEffect,
    useState
} from 'react';

import { AuthApi } from '@/app/(full-page)/auth/api/auth.api';
import { LoginDto } from '@/app/(full-page)/auth/dto/auth.dto';
import { AccountStatus } from '@/app/(main)/accounts/models/account.model';

export type AuthScope = string[] | "*" | null;

export type AuthSession = {
    user: {
        _id: string;
        name: string;
        email: string;
        scope: AuthScope;
    };

    permissions: string[];
    status: AccountStatus;
};

interface AuthContextType {
    session: AuthSession | null;

    loading: boolean;

    loggedIn: boolean;

    login: (
        dto: LoginDto
    ) => Promise<boolean>;

    logout: () => void;

    hasPermission: (
        perms: string | string[]
    ) => boolean;

    getScope: () => AuthScope;

    hasFullAccess: () => boolean;

    getUser: () => AuthSession["user"] | null;
}

const AuthContext =
    createContext<AuthContextType | undefined>(
        undefined
    );

export const AuthProvider: React.FC<{
    children: React.ReactNode;
}> = ({ children }) => {

    const [session, setSession] =
        useState<AuthSession | null>(null);

    const [loading, setLoading] =
        useState(true);

    useEffect(() => {

        const handleLogout = () => {
            setSession(null);
        };

        window.addEventListener(
            "auth:logout",
            handleLogout
        );

        return () => {
            window.removeEventListener(
                "auth:logout",
                handleLogout
            );
        };

    }, []);

    useEffect(() => {

        const storedSession =
            AuthApi.getLoggedInUser();

        setSession(
            storedSession as AuthSession | null
        );

        setLoading(false);

    }, []);

    const login = async (
        dto: LoginDto
    ): Promise<boolean> => {

        const loggedInSession =
            await AuthApi.loginUser(dto);

        setSession(
            loggedInSession as AuthSession
        );

        return true;
    };

    const logout = () => {

        AuthApi.logout();

        setSession(null);
    };

    const hasPermission = (
        perms: string | string[]
    ): boolean => {

        if (!session) {
            return false;
        }

        const requiredPermissions =
            Array.isArray(perms)
                ? perms
                : [perms];

        return requiredPermissions.some(
            permission =>
                session.permissions.includes(permission)
        );
    };

    const getScope = (): AuthScope => {

        return session?.user.scope ?? null;
    };

    const hasFullAccess = (): boolean => {

        return session?.user.scope === "*";
    };

    const getUser = (): AuthSession["user"] | null => {

        return session?.user ?? null;
    };

    return (
        <AuthContext.Provider
            value={{
                session,
                loading,
                loggedIn: !!session,

                login,
                logout,

                hasPermission,

                getScope,
                hasFullAccess,

                getUser
            }}
        >
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = (): AuthContextType => {

    const context =
        useContext(AuthContext);

    if (!context) {
        throw new Error(
            'useAuth must be used within AuthProvider'
        );
    }

    return context;
};