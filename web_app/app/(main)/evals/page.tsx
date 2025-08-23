'use client';
import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { OrganizationService } from '@/services/OrganizationService';
import EvaluationManager from './components/EvaluationManager';
import { EvalType } from './models/eval.model';
import { Organization } from '../organizations/models/organization.model';


const EvalPage = () => {
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
        return null; // Or redirecting already handled
    }
    return (
        <EvaluationManager type={EvalType.evaluation} directorate={directorate} />
    );
};

export default EvalPage;
