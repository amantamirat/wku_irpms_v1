'use client';
import { Scope } from '@/models/applicant';
import React, { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ApplicantComp from '../../components/applicant/Applicant';

const ApplicantPage = () => {
    const searchParams = useSearchParams();
    const router = useRouter();
    const scopeParam = searchParams.get('scope');

    const isValidScope = (value: string): value is Scope =>
        Object.values(Scope).includes(value as Scope);

    const shouldRedirect = !scopeParam || !isValidScope(scopeParam);

    useEffect(() => {
        if (shouldRedirect) {
            router.push('/');
        }
    }, [shouldRedirect, router]);

    if (shouldRedirect) {
        return null;
    }
    const scope = scopeParam as Scope;
    return (
        <ApplicantComp scope={scope} />
    );
};

export default ApplicantPage;
