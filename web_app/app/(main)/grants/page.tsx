'use client';

import { DirectorateSelector } from '@/components/DirectorateSelector';
import GrantManager from './components/GrantManager';
import { useDirectorate } from '@/contexts/DirectorateContext';


const GrantPage = () => {
    const { directorate } = useDirectorate();
    return (
        <>
            <DirectorateSelector />
            <GrantManager directorate={directorate} />
        </>

    );
};

export default GrantPage;
