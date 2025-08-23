'use client';
import { useRouter, useSearchParams } from 'next/navigation';
import EvaluationManager from './components/EvaluationManager';
import { EvalType } from './models/eval.model';


const EvalPage = () => {
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
        <EvaluationManager type={EvalType.evaluation} directorate={directorate} />
    );
};

export default EvalPage;
