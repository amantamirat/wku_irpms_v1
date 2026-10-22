'use client';

import { useState } from 'react';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { Tag } from 'primereact/tag';
import { useRouter } from 'next/navigation';
import {
    differenceInCalendarDays,
    format,
    isPast,
} from 'date-fns';

import { CallOpportunityDTO } from '../../calls/models/call.model';
import { Grant } from '../../grants/models/grant.model';
import { Organization } from '../../organizations/models/organization.model';
import { Calendar } from '../../calendars/models/calendar.model';

interface CallOpportunityCardProps {
    opportunity: CallOpportunityDTO;
}

export const CallOpportunityCard = ({
    opportunity,
}: CallOpportunityCardProps) => {
    const router = useRouter();
    const [expanded, setExpanded] = useState(false);

    const { call, activeStage } = opportunity;

    const grant = call.grant as Grant | undefined;
    const calendar = call.calendar as Calendar | undefined;
    const organization = call.organization as Organization | undefined;

    const deadline = activeStage.deadline ? new Date(activeStage.deadline) : null;
    const now = new Date();
    const daysLeft = deadline ? differenceInCalendarDays(deadline, now) : null;
    const isClosed = deadline ? isPast(deadline) : false;
    const isUrgent = daysLeft !== null && daysLeft >= 0 && daysLeft <= 5;

    const apply = () => {
        if (isClosed) return;
        if (activeStage.order === 1) {
            router.push(`/projects/apply/${call._id}`);
        } else {
            router.push(`/applications/stage/submit/${activeStage._id}`);
        }
    };

    return (
        <Card className="call-card h-full flex flex-col border-1 surface-border border-round-xl shadow-sm hover:shadow-md hover:border-primary transition-all transition-duration-200">
            <div className="flex flex-column h-full justify-content-between">
                <div>
                    {/* Header: FY Tag & Organization */}
                    <div className="flex justify-content-between align-items-center gap-2 mb-3">
                        {calendar?.year ? (
                            <Tag
                                value={`FY ${calendar.year}`}
                                severity="info"
                                rounded
                                className="text-xs px-2 py-1"
                            />
                        ) : (
                            <span />
                        )}
                        <span className="text-xs font-semibold text-500 uppercase tracking-wide">
                            {organization?.name ?? 'Organization'}
                        </span>
                    </div>

                    {/* Grant & Call Title */}
                    <div className="mb-3">
                        <div className="text-xs font-bold text-primary uppercase mb-1">
                            {grant?.title ?? 'Untitled Grant'}
                        </div>
                        <h3 className="text-base font-bold text-900 m-0 line-height-3 line-clamp-2">
                            {call.title}
                        </h3>
                    </div>
                    {/* Description with Inline Expand/Collapse */}
                    {call.description && (
                        <div className="mb-4">
                            <p
                                className="text-sm text-600 line-height-3 m-0"
                                style={
                                    !expanded
                                        ? {
                                            display: '-webkit-box',
                                            WebkitLineClamp: 3,
                                            WebkitBoxOrient: 'vertical',
                                            overflow: 'hidden',
                                        }
                                        : undefined
                                }
                            >
                                {call.description}
                            </p>

                            {/* Only show 'Read More' if the description is actually long (e.g., over 100 chars) */}
                            {call.description.length > 100 && (
                                <button
                                    type="button"
                                    onClick={() => setExpanded(!expanded)}
                                    className="text-xs font-semibold text-primary bg-transparent border-none p-0 mt-1 cursor-pointer hover:underline"
                                >
                                    {expanded ? 'Show Less' : 'Read More'}
                                </button>
                            )}
                        </div>
                    )}

                    {/* Active Stage Info */}
                    <div className="flex align-items-center gap-2 mb-3">
                        <i className="pi pi-list-check text-primary" />
                        <div>
                            <div className="text-xs text-500">Current application stage</div>
                            <div className="text-sm font-semibold text-900">
                                {activeStage.name}
                            </div>
                        </div>
                    </div>
                </div>

                <div>
                    {/* Stage Deadline Box */}
                    <div
                        className={`call-deadline mb-3 p-3 border-round surface-ground ${isUrgent && !isClosed ? 'border-orange-300 bg-orange-50' : ''
                            }`}
                    >
                        <div className="flex align-items-center gap-2">
                            <i
                                className={`pi pi-calendar ${isUrgent && !isClosed
                                        ? 'text-orange-500'
                                        : isClosed
                                            ? 'text-red-500'
                                            : 'text-primary'
                                    }`}
                            />
                            <div className="flex-1 min-w-0">
                                <div className="text-xs text-500">Application deadline</div>
                                <div className="text-sm font-medium text-900">
                                    {deadline
                                        ? format(deadline, 'MMM dd, yyyy • hh:mm a')
                                        : 'No deadline specified'}
                                </div>
                            </div>
                        </div>

                        {daysLeft !== null && (
                            <div className="mt-2 text-xs">
                                <span
                                    className={
                                        isClosed
                                            ? 'text-red-500 font-bold'
                                            : isUrgent
                                                ? 'text-orange-500 font-bold'
                                                : 'text-primary font-bold'
                                    }
                                >
                                    {isClosed
                                        ? 'Deadline passed'
                                        : daysLeft === 0
                                            ? 'Deadline is today'
                                            : `${daysLeft} days remaining`}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Apply Action Button */}
                    <Button
                        label={
                            isClosed
                                ? 'Deadline Passed'
                                : activeStage.order === 1
                                    ? 'Apply Now'
                                    : 'Continue Application'
                        }
                        icon={isClosed ? 'pi pi-lock' : 'pi pi-arrow-right'}
                        iconPos="right"
                        size="small"
                        severity={isClosed ? 'secondary' : isUrgent ? 'warning' : undefined}
                        outlined={!isClosed}
                        disabled={isClosed}
                        onClick={apply}
                        className="w-full justify-content-center"
                    />
                </div>
            </div>
        </Card>
    );
};