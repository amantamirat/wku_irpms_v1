'use client';
import EvaluationManager from './components/EvaluationManager';
import { EvalType } from './models/evaluation.model';


const EvalPage = () => {
    return (
        <EvaluationManager type={EvalType.evaluation} />
    );
};

export default EvalPage;
