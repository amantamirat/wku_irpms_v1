'use client';
import { AuthApi } from '@/app/(full-page)/auth/api/auth.service';
import { LoginDto } from '@/app/(full-page)/auth/dto/auth.dto';
import { AccountStatus } from '@/app/(main)/accounts/models/account.model';
import { OrgnUnit } from '@/app/(main)/organizations/models/organization.model';
import { IOwnership } from '@/app/(main)/users/models/user.model';
import React, { createContext, useContext, useEffect, useState } from 'react';

type AuthSession = {
    user: {
        id: string;
        name: string;
        email: string;
    };
    permissions: string[];
    ownerships: IOwnership[];
    status: AccountStatus;
};

interface AuthContextType {
    session: AuthSession | null;
    loading: boolean;
    loggedIn: boolean;
    login: (dto: LoginDto) => Promise<boolean>;
    logout: () => void;
    hasPermission: (perms: string | string[]) => boolean;
    getScopesByUnit: (unit: OrgnUnit) => any[] | "*";
    getUser: () => AuthSession["user"] | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    //const router = useRouter();
    const [session, setSession] = useState<AuthSession | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const stored = AuthApi.getLoggedInUser();
        setSession(stored ?? null);
        setLoading(false);
    }, []);

    const login = async (dto: LoginDto) => {
        try {
            const session = await AuthApi.loginUser(dto);
            setSession(session);
            return true;
        } catch (err) {
            throw err;
            //return false;
        }
    };

    const logout = () => {
        AuthApi.logout();
        setSession(null);
    };

    const hasPermission = (perms: string | string[]): boolean => {
        if (!session) return false;
        const permArray = Array.isArray(perms) ? perms : [perms];
        return permArray.some((p) => session.permissions.includes(p));
    };

    const getScopesByUnit = (unit: OrgnUnit) => {
        if (!session) return [];
        const ownership = session.ownerships.find(o => o.unitType === unit);
        if (!ownership) return [];
        return ownership.scope;
    };

    const getUser = () => {
        return session?.user ?? null;
    };

    return (
        <AuthContext.Provider value={{
            session: session, loading, loggedIn: !!session, login, logout, hasPermission, //hasOrganizationType, 
            getScopesByUnit,
            getUser: getUser
        }}>
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