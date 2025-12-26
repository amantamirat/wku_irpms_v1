'use client';
import React, { createContext, useContext, useEffect, useState } from 'react';
import { OrgnUnit } from '@/app/(main)/organizations/models/organization.model';
import { UserApi } from '@/app/(main)/users/api/UserService';
import { User } from '@/app/(main)/users/models/user.model';
import { IOwnership } from '@/app/(main)/applicants/models/applicant.model';


interface AuthContextType {
    user: User | null;
    loading: boolean;
    loggedIn: boolean;
    login: (user: User) => Promise<boolean>;
    logout: () => void;
    hasPermission: (perms: string[]) => boolean;
    hasOrganizationType: (types: OrgnUnit[]) => boolean;
    getOrganizationsByType: (types: OrgnUnit[]) => any[];
    getLinkedApplicant: () => any | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    //const router = useRouter();
    const [user, setUser] = useState<User | null>(null);
    const [permissions, setPermissions] = useState<string[]>();
    const [ownerships, setOwnerships] = useState<IOwnership[]>();
    const [loading, setLoading] = useState(true);


    useEffect(() => {
        const userInfo = UserApi.getLoggedInUser();
        setUser(userInfo ?? null);
        if (userInfo) {
            setPermissions(userInfo.permissions);
            setOwnerships(userInfo.ownerships);
        }
        setLoading(false);
    }, []);

    const login = async (user: User) => {
        try {
            const userInfo = await UserApi.loginUser(user);
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
        UserApi.logout();
        setUser(null);
        //router.push('/auth/login');
    };

    const hasPermission = (perms: string[]): boolean => {
        return perms.some((p) => permissions?.includes(p));
    };

    const hasOrganizationType = (types: OrgnUnit[]): boolean => {
        return false;
        //if (!user?.organizations) return false;
        //return user.organizations.some((org: any) => types.includes(org.type));
    };

    const getOrganizationsByType = (types: OrgnUnit[]): any[] => {
        return [];
        //if (!user?.organizations) return [];
        //return user.organizations.filter((org: any) => types.includes(org.type));
    };

    const getApplicant = (): any | null => {
        if (!user || !user.applicant) return null;
        return user.applicant;
    }

    return (
        <AuthContext.Provider value={{ user, loading, loggedIn: !!user, login, logout, hasPermission, hasOrganizationType, getOrganizationsByType, getLinkedApplicant: getApplicant }}>
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