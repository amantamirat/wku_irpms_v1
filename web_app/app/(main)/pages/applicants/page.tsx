'use client';
import React, { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import ApplicantComp from '../../components/applicant/Applicant';
import { Category } from '../../organizations/models/organization.model';


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
        <ApplicantComp scope={scope} />
    );
};

export default ApplicantPage;
