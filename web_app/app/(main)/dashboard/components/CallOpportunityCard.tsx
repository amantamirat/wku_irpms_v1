'use client';

import { useState } from 'react';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { Tag } from 'primereact/tag';
import { classNames } from 'primereact/utils';
import { useRouter } from 'next/navigation';
import { format } from 'date-fns';

import { CallOpportunityDTO } from '../../calls/models/call.model';
import { Grant } from '../../grants/models/grant.model';
import { Organization } from '../../organizations/models/organization.model';
import { Calendar } from '../../calendars/models/calendar.model';
import { DeadlineState, getDeadlineInfo } from '@/utils/deadline';

const FIRST_STAGE_ORDER = 1;
const DESCRIPTION_PREVIEW_LENGTH = 100;

const TONE: Record<DeadlineState, { icon: string; text: string; box: string }> = {
    none: { icon: 'text-primary', text: 'text-primary', box: '' },
    open: { icon: 'text-primary', text: 'text-primary', box: '' },
    urgent: { icon: 'text-orange-500', text: 'text-orange-500', box: 'border-1 border-orange-300 bg-orange-50' },
    closed: { icon: 'text-red-500', text: 'text-red-500', box: '' },
};

interface CallOpportunityCardProps {
    opportunity: CallOpportunityDTO;
}

export const CallOpportunityCard = ({ opportunity }: CallOpportunityCardProps) => {
    const router = useRouter();
    const [expanded, setExpanded] = useState(false);

    const { call, activeStage } = opportunity;

    const grant = call.grant as Grant | undefined;
    const calendar = call.calendar as Calendar | undefined;
    const organization = call.organization as Organization | undefined;

    const { date: deadline, state, label: deadlineLabel } = getDeadlineInfo(activeStage.deadline);
    const tone = TONE[state];
    const isClosed = state === 'closed';
    const isUrgent = state === 'urgent';

    // Only the first stage is open to everyone.
    // Later stages are continued from "Action Required" (Pending Works).
    const isFirstStage = activeStage.order === FIRST_STAGE_ORDER;
    const canApply = isFirstStage && !isClosed;

    const apply = () => {
        if (canApply) router.push(`/projects/apply/${call._id}`);
    };

    const description = call.description ?? '';
    const isLongDescription = description.length > DESCRIPTION_PREVIEW_LENGTH;

    return (
        <Card className="h-full border-1 surface-border border-round-xl shadow-1 hover:shadow-3 hover:border-primary transition-all transition-duration-200">
            <div className="flex flex-column h-full justify-content-between">
                <div>
                    {/* Header: FY tag & organization */}
                    <div className="flex justify-content-between align-items-center gap-2 mb-3">
                        {calendar?.year ? (
                            <Tag value={`FY ${calendar.year}`} severity="info" rounded className="text-xs px-2 py-1" />
                        ) : (
                            <span />
                        )}
                        <span className="text-xs font-semibold text-500 uppercase">
                            {organization?.name ?? 'Organization'}
                        </span>
                    </div>

                    {/* Grant & call title */}
                    <div className="mb-3">
                        <div className="text-xs font-bold text-primary uppercase mb-1">
                            {grant?.title ?? 'Untitled Grant'}
                        </div>
                        <h3
                            className="text-base font-bold text-900 m-0 line-height-3"
                            style={{
                                display: '-webkit-box',
                                WebkitLineClamp: 2,
                                WebkitBoxOrient: 'vertical',
                                overflow: 'hidden',
                            }}
                            title={call.title}
                        >
                            {call.title}
                        </h3>
                    </div>

                    {/* Description */}
                    {description && (
                        <div className="mb-4">
                            <p
                                className="text-sm text-600 line-height-3 m-0"
                                style={
                                    expanded
                                        ? undefined
                                        : {
                                            display: '-webkit-box',
                                            WebkitLineClamp: 3,
                                            WebkitBoxOrient: 'vertical',
                                            overflow: 'hidden',
                                        }
                                }
                            >
                                {description}
                            </p>

                            {isLongDescription && (
                                <button
                                    type="button"
                                    aria-expanded={expanded}
                                    onClick={() => setExpanded((v) => !v)}
                                    className="text-xs font-semibold text-primary bg-transparent border-none p-0 mt-1 cursor-pointer hover:underline"
                                >
                                    {expanded ? 'Show Less' : 'Read More'}
                                </button>
                            )}
                        </div>
                    )}

                    {/* Active stage */}
                    <div className="flex align-items-center gap-2 mb-3">
                        <i className="pi pi-list-check text-primary" />
                        <div>
                            <div className="text-xs text-500">Current application stage</div>
                            <div className="text-sm font-semibold text-900">{activeStage.name}</div>
                        </div>
                    </div>
                </div>

                <div>
                    {/* Deadline box */}
                    <div className={classNames('mb-3 p-3 border-round surface-ground', tone.box)}>
                        <div className="flex align-items-center gap-2">
                            <i className={classNames('pi pi-calendar', tone.icon)} />
                            <div className="flex-1 min-w-0">
                                <div className="text-xs text-500">Application deadline</div>
                                <div className="text-sm font-medium text-900">
                                    {deadline ? format(deadline, 'MMM dd, yyyy • hh:mm a') : 'No deadline specified'}
                                </div>
                            </div>
                        </div>

                        {deadline && (
                            <div className="mt-2 text-xs">
                                <span className={classNames('font-bold', tone.text)}>{deadlineLabel}</span>
                            </div>
                        )}
                    </div>

                    {/* Action */}
                    {isFirstStage ? (
                        <Button
                            label={isClosed ? 'Deadline Passed' : 'Apply Now'}
                            icon={isClosed ? 'pi pi-lock' : 'pi pi-arrow-right'}
                            iconPos="right"
                            size="small"
                            severity={isClosed ? 'secondary' : isUrgent ? 'warning' : undefined}
                            outlined={!isClosed}
                            disabled={!canApply}
                            onClick={apply}
                            className="w-full justify-content-center"
                        />
                    ) : (
                        <div className="flex align-items-start gap-2 p-2 border-round surface-50">
                            <i className="pi pi-info-circle text-500 mt-1" />
                            <small className="text-600 line-height-3">
                                {isClosed
                                    ? 'Submissions are closed.'
                                    : 'Open to applicants accepted in the previous stage.'}
                            </small>
                        </div>
                    )}
                </div>
            </div>
        </Card>
    );
};