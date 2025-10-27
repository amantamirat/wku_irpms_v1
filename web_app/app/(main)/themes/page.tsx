'use client';

import { useRouter, useSearchParams } from 'next/navigation';

import ThemeManager from './components/ThemeManager';
import { ThemeType } from './models/theme.model';

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
        <ThemeManager type={ThemeType.thematic_area} directorate={directorate} />
    );
};

export default ThemePage;
