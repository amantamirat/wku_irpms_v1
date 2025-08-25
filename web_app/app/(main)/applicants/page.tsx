'use client';
import React, { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Category } from '../organizations/models/organization.model';
import ApplicantManager from './components/ApplicantManager';



const ApplicantPage = () => {
    const searchParams = useSearchParams();
    const router = useRouter();
    const scopeParam = searchParams.get('scope');

    const isValidScope = (value: string): value is Category =>
        Object.values(Category).includes(value as Category);

    const shouldRedirect = !scopeParam || !isValidScope(scopeParam);

    useEffect(() => {
        if (shouldRedirect) {
            router.push('/');
        }
    }, [shouldRedirect, router]);

    if (shouldRedirect) {
        return null;
    }
    const scope = scopeParam as Category;
    return (
        <ApplicantManager scope={scope} />
    );
};

export default ApplicantPage;
