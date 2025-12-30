'use client';

import React, {
    createContext,
    useContext,
    useEffect,
    useState
} from 'react';
import { useAuth } from '@/contexts/auth-context';
import { Organization, OrgnUnit } from '@/app/(main)/organizations/models/organization.model';
import { OrganizationApi } from '@/app/(main)/organizations/api/organization.api';

interface DirectorateContextType {
    directorates?: Organization[];
    directorate?: Organization;
    //loading: boolean;
    //error?: string;
    setDirectorate: React.Dispatch<React.SetStateAction<Organization | undefined>>;
    refreshDirectorates: () => Promise<void>;
}

const DirectorateContext = createContext<DirectorateContextType | undefined>(undefined);

export const DirectorateProvider = ({ children }: { children: React.ReactNode }) => {
    const { getScopesByUnit, loggedIn } = useAuth();

    const [directorates, setDirectorates] = useState<Organization[]>();
    const [directorate, setDirectorate] = useState<Organization>();

    //const [loading, setLoading] = useState(false);
    //const [error, setError] = useState<string>();

    const fetchDirectorates = async () => {
        try {
            let scopes = getScopesByUnit(OrgnUnit.Directorate);

            let result: Organization[];

            if (scopes === '*') {
                result = await OrganizationApi.getOrganizations({
                    type: OrgnUnit.Directorate
                });
            } else {
                result = scopes as Organization[];
            }
            setDirectorates(result);
        } catch (err: any) {
            console.error('Failed to load directorates', err);
        }
    };

    /** Fetch once on mount (or when auth changes) */
    useEffect(() => {
        if (!getScopesByUnit) return;
        if(!loggedIn) return;
        fetchDirectorates();
    }, [getScopesByUnit, loggedIn]);


    return (
        <DirectorateContext.Provider
            value={{
                directorates,
                directorate,
                //loading,
                //error,
                setDirectorate,
                refreshDirectorates: fetchDirectorates
            }}
        >
            {children}
        </DirectorateContext.Provider>
    );
};

export const useDirectorate = () => {
    const context = useContext(DirectorateContext);
    if (!context) {
        throw new Error('useDirectorate must be used within DirectorateProvider');
    }
    return context;
};
