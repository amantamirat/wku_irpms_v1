'use client';
import { OrganizationType } from '@/models/organization';
import React, { useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import OrganizationComp from '../../components/organization/Organization';

const OrganizationPage = () => {
    const searchParams = useSearchParams();
    const router = useRouter();
    const typeParam = searchParams.get('type');

    const isValidType = (value: string): value is OrganizationType =>
        Object.values(OrganizationType).includes(value as OrganizationType);

    const shouldRedirect = !typeParam || !isValidType(typeParam);

    useEffect(() => {
        if (shouldRedirect) {
            router.push('/');
        }
    }, [shouldRedirect, router]);

    if (shouldRedirect) {
        return null;
    }
    const type = typeParam as OrganizationType;
    
    return (
        <OrganizationComp type={type} />
    );
};

export default OrganizationPage;
