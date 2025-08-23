'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import GrantManager from './components/GrantManager';
import { Organization } from '../organizations/models/organization.model';


const GrantPage = () => {
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
        <GrantManager directorate={directorate} />
    );
};

export default GrantPage;
