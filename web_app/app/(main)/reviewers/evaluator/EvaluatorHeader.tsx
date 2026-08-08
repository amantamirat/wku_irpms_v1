import { ProgressBar } from 'primereact/progressbar';
import { Tag } from 'primereact/tag';

interface ReviewerHeaderProps {
    name: string;
    role: string;
    progress: number; // 0 to 100
    totalWeight: number;
    currentScore: number;
}

export const EvaluatorHeader = ({ name, role, progress, totalWeight, currentScore }: ReviewerHeaderProps) => {
    return (
        <div className="surface-card p-4 border-round-xl shadow-1 mb-4">
            <div className="flex justify-content-between align-items-center mb-3">
                <div>
                    <h2 className="text-2xl font-bold m-0">{name}</h2>
                    <p className="text-600 m-0">{role}</p>
                </div>
                <div className="text-right">
                    <Tag value={`Total Score: ${currentScore} / ${totalWeight}`} severity="info" className="text-lg px-3" />
                </div>
            </div>
            <div className="flex align-items-center gap-3">
                <ProgressBar value={progress} showValue={false} style={{ height: '8px', flex: 1 }} />
                <span className="text-sm font-semibold text-600">{progress}% Complete</span>
            </div>
        </div>
    );
};