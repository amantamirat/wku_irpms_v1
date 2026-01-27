'use client';
import { useDirectorate } from '@/contexts/DirectorateContext';
import EvaluationManager from './components/EvaluationManager';
import { DirectorateSelector } from '@/components/DirectorateSelector';



const EvaluationPage = () => {
    const { directorate, directorates } = useDirectorate();
    return (
        <>
            <DirectorateSelector />
            <EvaluationManager directorate={directorate} />
        </>

    );
};

export default EvaluationPage;
