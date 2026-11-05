'use client';

import {
    Activity,
    PhaseActivityTypeLabels,
} from '../models/phase-activity.model';
import { etbCurrencyFormatter } from '@/utils/utils';
import { ActivityDetailFields } from './ActivityDetailFields';

const ActivityExpandedRow = ({ activity }: { activity: Activity }) => {
    const meta = PhaseActivityTypeLabels[activity.kind];
    const details = (activity as any).details;
    const hasDetails = details && Object.keys(details).length > 0;

    return (
        <div className="p-3 surface-ground border-round">
            {/* Header: type + description */}
            <div className="mb-3">
                <div className="font-bold text-sm">
                    {meta?.label ?? activity.kind ?? 'Activity'}
                </div>
                {meta?.description && (
                    <div className="text-xs text-500 mt-1">{meta.description}</div>
                )}
                {activity.description && (
                    <p className="text-sm text-700 mt-2 mb-0">
                        {activity.description}
                    </p>
                )}
            </div>

            {/* Cost breakdown */}
            {activity.detailCost && (
                <div className="flex align-items-center justify-content-between mb-3 text-sm">
                    <span className="text-600">
                        {activity.detailCost.duration} days × {activity.detailCost.participants} participants ×{' '}
                        {etbCurrencyFormatter.format(activity.detailCost.unitPrice)}
                    </span>
                    <span className="font-bold font-mono text-green-700">
                        {etbCurrencyFormatter.format(activity.cost)}
                    </span>
                </div>
            )}

            {/* Kind-specific details, read only */}
            {hasDetails ? (
                <ActivityDetailFields
                    kind={activity.kind}
                    details={details}
                    disabled
                />
            ) : (
                <div className="text-sm text-500">
                    No additional details provided.
                </div>
            )}
        </div>
    );
};

export default ActivityExpandedRow;