'use client';
import { useDirectorate } from '@/contexts/DirectorateContext';
import { DirectorateSelector } from '@/components/DirectorateSelector';
import EvaluationManager from './components/EvaluationManager';



const EvaluationPage = () => {
    //const { directorate, directorates } = useDirectorate();
    return (
        <>
           
           <EvaluationManager />
        </>

    );
};

export default EvaluationPage;
