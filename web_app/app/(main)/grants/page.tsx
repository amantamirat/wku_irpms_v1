'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import GrantManager from './components/GrantManager';


const GrantPage = () => {
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
        <GrantManager directorate={directorate} />
    );
};

export default GrantPage;
