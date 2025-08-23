'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import ThemeManager from './components/ThemeManager';
import { ThemeType } from './models/theme.model';
import { Organization } from '../organizations/models/organization.model';

const ThemePage = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const directorate = JSON.parse(searchParams.get("directorate")!) as Organization;
    

    useEffect(() => {
        if (!directorate) {
            router.push('/auth/error');
            return;
        }        
    }, [directorate, router]);


    if (!directorate) {
        return null; // Or redirecting already handled
    }

    return (
        <ThemeManager type={ThemeType.catalog} directorate={directorate} />
    );
};

export default ThemePage;
