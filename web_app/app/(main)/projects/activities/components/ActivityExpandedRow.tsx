'use client';

import {
    Activity,
    PhaseActivityTypeLabels,
} from '../models/phase-activity.model';
import { computeDurationFromDates, etbCurrencyFormatter } from '@/utils/utils';
import { ActivityDetailFields } from './ActivityDetailFields';

const formatDate = (value?: Date | string | null) => {
    if (!value) return null;
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return null;

    return date.toLocaleDateString(undefined, {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
    });
};

const DateBlock = ({
    label,
    value,
    icon,
}: {
    label: string;
    value: string | null;
    icon: string;
}) => (
    <div className="flex align-items-center gap-2">
        <i className={`${icon} text-primary`} />
        <div>
            <div className="text-xs text-500 uppercase font-semibold">{label}</div>
            <div className="text-sm font-medium">
                {value ?? <span className="text-400">Not set</span>}
            </div>
        </div>
    </div>
);

const ActivityExpandedRow = ({ activity }: { activity: Activity }) => {
    const meta = PhaseActivityTypeLabels[activity.kind];
    const details = (activity as any).details;
    const hasDetails = details && Object.keys(details).length > 0;

    const start = formatDate(activity.startDate);
    const end = formatDate(activity.endDate);
    const duration = computeDurationFromDates(activity.startDate, activity.endDate);

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

            {/* Schedule */}
            <div className="surface-card border-1 surface-border border-round p-3 mb-3">
                <div className="flex flex-wrap align-items-center justify-content-between gap-3">
                    <DateBlock label="Start" value={start} icon="pi pi-calendar-plus" />

                    <div className="flex align-items-center gap-2 flex-1 justify-content-center">
                        <div className="border-top-1 surface-border flex-1" />
                        <span className="text-xs font-semibold text-primary border-1 border-round-3xl px-2 py-1 white-space-nowrap">
                            {duration > 0
                                ? `${duration} ${duration === 1 ? 'day' : 'days'}`
                                : '—'}
                        </span>
                        <div className="border-top-1 surface-border flex-1" />
                    </div>

                    <DateBlock label="End" value={end} icon="pi pi-calendar-minus" />
                </div>
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