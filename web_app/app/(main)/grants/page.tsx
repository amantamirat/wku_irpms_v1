'use client';

import { DirectorateSelector } from '@/components/DirectorateSelector';
import GrantManager from './components/GrantManager';
import { useDirectorate } from '@/contexts/DirectorateContext';


const GrantPage = () => {
    //const { directorate } = useDirectorate();
    return (
        <>
            <GrantManager />
        </>

    );
};

export default GrantPage;
