'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import { OrganizationService } from '@/services/OrganizationService';
import { Organization } from '@/models/organization';
import ThemeManager from './components/ThemeManager';
import { ThemeType } from './models/theme.model';

const ThemePage = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const directorateId = searchParams.get('directorate');
    const [directorate, setDirectorate] = useState<Organization | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!directorateId) {
            router.push('/auth/error');
            return;
        }

        OrganizationService.getDirectorateByID(directorateId)
            .then((result) => {
                if (!result) {
                    router.push('/auth/error');
                } else {
                    setDirectorate(result);
                }
            })
            .catch(() => {
                router.push('/auth/error');
            })
            .finally(() => setLoading(false));
    }, [directorateId, router]);

    if (loading) {
        return <p>Loading...</p>;
    }

    if (!directorate) {
        return null; // Or redirecting already handled
    }

    return (
        <ThemeManager type={ThemeType.catalog} directorate={directorate} />
    );
};

export default ThemePage;
