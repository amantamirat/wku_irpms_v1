'use client';

import React, { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

import ThemeManager from './components/ThemeManager';
import { ThemeType } from './models/theme.model';
import { Organization } from '../organizations/models/organization.model';

const ThemePage = () => {
    const router = useRouter();
    const searchParams = useSearchParams();

    const directorateId = searchParams.get('id');
    const directorateName = searchParams.get('name');

    if (!directorateId || !directorateName) {
        router.push('/auth/error');
        return null;
    }

    const directorate = {
        _id: directorateId,
        name: directorateName
    };

    return (
        <ThemeManager type={ThemeType.catalog} directorate={directorate} />
    );
};

export default ThemePage;
