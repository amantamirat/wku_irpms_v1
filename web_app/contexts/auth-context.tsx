'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { OrgnUnit } from '@/app/(main)/organizations/models/organization.model';
import { UserApi } from '@/app/(main)/users/api/user.api';
import { User } from '@/app/(main)/users/models/user.model';
import { IOwnership } from '@/app/(main)/applicants/models/applicant.model';
import { AuthApi } from '@/app/(full-page)/auth/api/auth.service';

interface AuthContextType {
    user: User | null;
    loading: boolean;
    loggedIn: boolean;
    login: (user: User) => Promise<boolean>;
    logout: () => void;
    hasPermission: (perms: string[]) => boolean;
    getScopesByUnit: (unit: OrgnUnit) => any[] | "*";
    getApplicant: () => any | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    //const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [permissions, setPermissions] = useState<string[]>();
    const [ownerships, setOwnerships] = useState<IOwnership[]>();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const userInfo = AuthApi.getLoggedInUser();
        setUser(userInfo ?? null);
        if (userInfo) {
            setPermissions(userInfo.permissions);
            setOwnerships(userInfo.ownerships);
        }
        setLoading(false);
    }, []);

    const login = async (user: User) => {
        try {
            const userInfo = await AuthApi.loginUser(user);
            setUser(userInfo);
            setPermissions(userInfo.permissions);
            setOwnerships(userInfo.ownerships);
            return true;
        } catch (err) {
            throw err;
            //return false;
        }
    };

    const logout = () => {
        AuthApi.logout();
        setUser(null);
    };

    const hasPermission = (perms: string[]): boolean => {
        return perms.some((p) => permissions?.includes(p));
    };


    const getScopesByUnit = (unit: OrgnUnit) => {
        const ownership = ownerships?.find(o => o.unitType === unit);
        if (!ownership) return [];
        return ownership.scope;
        //return ownership.scope === '*' ? '*' : ownership.scope;
    };

    const getApplicant = (): any | null => {
        if (!user || !user.applicant) return null;
        return user.applicant;
    }

    return (
        <AuthContext.Provider value={{
            user, loading, loggedIn: !!user, login, logout, hasPermission, //hasOrganizationType, 
            getScopesByUnit,
            getApplicant
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