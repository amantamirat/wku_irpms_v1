'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import CallManager from './components/CallManager';
import { Organization } from '../organizations/models/organization.model';


const CallPage = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const directorate = JSON.parse(searchParams.get("directorate")!) as Organization;
    //const [directorate, setDirectorate] = useState<Organization | null>(null);
    //const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (!directorate) {
            router.push('/auth/error');
            return;
        } 
    }, [directorate, router]);

    if (!directorate) {
         return <p>Loading...</p>; // Or redirecting already handled
    }

    return (
        <CallManager directorate={directorate} />
    );
};

export default CallPage;
