import { Card } from 'primereact/card';
import { Knob } from 'primereact/knob';

interface EvaluationSummaryProps {
    currentScore: number;
    maxScore: number;
    answeredCount: number;
    totalCount: number;
}

export const EvaluationSummary = ({
    currentScore,
    maxScore,
    answeredCount,
    totalCount
}: EvaluationSummaryProps) => {
    const percentage = Math.round((currentScore / maxScore) * 100) || 0;

    return (
        <Card className="sticky top-0 shadow-3">
            <div className="text-center">
                <h4 className="m-0 mb-3 text-700">Total Progress</h4>
                <Knob value={percentage} valueTemplate={"{value}%"} size={120} readOnly />
                <div className="mt-3">
                    <div className="text-2xl font-bold text-primary">{currentScore} <span className="text-sm text-500">/ {maxScore}</span></div>
                    <div className="text-sm text-600 mt-1">{answeredCount} of {totalCount} Criteria Evaluated</div>
                </div>
            </div>
        </Card>
    );
};