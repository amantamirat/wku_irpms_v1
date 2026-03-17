'use client';

import React, { useEffect } from 'react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { OrgnUnit } from '../models/organization.model';
import OrganizationManager from '../components/OrganizationManager';


const Page = () => {
    const params = useParams();
    const type = params.type as OrgnUnit;
    return (
        <OrganizationManager type={type} />
    );
};

export default Page;
