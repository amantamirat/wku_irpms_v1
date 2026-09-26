'use client';

import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { Tag } from 'primereact/tag';
import { useRouter } from 'next/navigation';
import {
    differenceInCalendarDays,
    format,
    isPast,
} from 'date-fns';

import { useAuth } from '@/contexts/auth-context';
import { Call } from '../calls/models/call.model';
import { Grant } from '../grants/models/grant.model';
import { Calendar } from '../calendars/models/calendar.model';
import { Organization } from '../organizations/models/organization.model';

interface CallCardProps {
    call: Call;
}

export const CallCard = ({ call }: CallCardProps) => {
    const router = useRouter();
    const { hasPermission } = useAuth();

    const grant = call.grant as Grant;
    const calendar = call.calendar as Calendar;
    const organization = call.organization as Organization;

    const deadline = call.deadline
        ? new Date(call.deadline)
        : null;

    const daysLeft = deadline
        ? differenceInCalendarDays(deadline, new Date())
        : null;

    const isClosed = deadline ? isPast(deadline) : false;

    const isUrgent =
        daysLeft !== null &&
        daysLeft >= 0 &&
        daysLeft <= 5;

    const canApply =
        hasPermission?.('project:apply') ?? false;

    const apply = () => {
        router.push(`/projects/apply/${call._id}`);
    };

    return (
        <Card className="call-card h-full border-1 surface-border border-round-xl shadow-sm hover:shadow-md hover:border-primary transition-all transition-duration-200">
            {/* Flex container to push footer button cleanly to the bottom */}
            <div className="flex flex-column h-full justify-content-between">
                <div>
                    {/* Header */}
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
                            {organization?.name ?? 'UO'}
                        </span>
                    </div>

                    {/* Title */}
                    <div className="mb-3">
                        <div className="text-xs font-bold text-primary uppercase mb-1">
                            {grant?.title ?? 'Untitled Grant'}
                        </div>

                        <h3 className="text-base font-bold text-900 m-0 line-height-3 line-clamp-2">
                            {call.title}
                        </h3>
                    </div>

                    {/* Description */}
                    {call.description && (
                        <p className="text-sm text-600 line-height-3 m-0 mb-4 line-clamp-2">
                            {call.description}
                        </p>
                    )}
                </div>

                <div>
                    {/* Deadline block using your original classes */}
                    <div
                        className={`call-deadline mb-3 ${
                            isUrgent ? 'call-deadline-urgent' : ''
                        }`}
                    >
                        <div className="flex align-items-center gap-2">
                            <i
                                className={`pi pi-calendar ${
                                    isUrgent
                                        ? 'text-orange-500'
                                        : 'text-primary'
                                }`}
                            />

                            <div className="flex-1 min-w-0">
                                <div className="call-deadline-label">
                                    Application deadline
                                </div>

                                <div className="call-deadline-date">
                                    {deadline
                                        ? format(
                                            deadline,
                                            'MMM dd, yyyy • hh:mm a'
                                        )
                                        : 'No deadline specified'}
                                </div>
                            </div>
                        </div>

                        {daysLeft !== null && (
                            <div className="call-deadline-status mt-1">
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
                                        ? 'Application closed'
                                        : daysLeft === 0
                                        ? 'Deadline is today'
                                        : `${daysLeft} days remaining`}
                                </span>
                            </div>
                        )}
                    </div>

                    {/* Footer Action Button */}
                    {canApply && (
                        <Button
                            label={isClosed ? 'Closed' : 'Apply Now'}
                            icon={
                                isClosed
                                    ? 'pi pi-lock'
                                    : 'pi pi-arrow-right'
                            }
                            iconPos="right"
                            size="small"
                            severity={
                                isClosed
                                    ? 'secondary'
                                    : isUrgent
                                    ? 'warning'
                                    : undefined
                            }
                            outlined={!isClosed}
                            disabled={isClosed}
                            onClick={apply}
                            className="w-full justify-content-center"
                        />
                    )}
                </div>
            </div>
        </Card>
    );
};