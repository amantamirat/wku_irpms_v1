'use client';
import { Button } from 'primereact/button';
import { Card } from 'primereact/card';
import { Divider } from 'primereact/divider';
import { Tag } from 'primereact/tag';
import { useRouter } from 'next/navigation';

// Date Utilities
import { format, differenceInCalendarDays, isPast } from 'date-fns';

// Types
import { Call } from '../calls/models/call.model';
import { Grant } from '../grants/models/grant.model';
import { Calendar } from '../calendars/models/calendar.model';
import { Organization } from '../organizations/models/organization.model';


interface CallCardProps {
    call: Call;
    onApply?: (callId: string) => void;
}

export const CallCard = ({ call }: CallCardProps) => {
    const router = useRouter();
    // Direct Data Mapping 
    const grant = call.grant as Grant;
    const calendar = call.calendar as Calendar;
    const organization = call.organization as Organization;
    const deadline = call.deadline;
    const today = new Date();

    // Calculate actual days remaining for the primary initial submission
    const daysLeft = deadline ? differenceInCalendarDays(deadline, today) : 0;
    const isClosed = deadline ? isPast(deadline) && daysLeft < 0 : false;
    const isUrgent = daysLeft >= 0 && daysLeft < 5;

    const proceedToApply = () => {
        router.push(`/applications/apply/${call._id}`);
    };

    return (
        <Card className="h-full border-1 border-300 shadow-hover transition-all transition-duration-300 hover:border-primary flex flex-column">
            {/* TOP SECTION: Metadata */}
            <div className="flex justify-content-between align-items-start mb-2">
                <div className="flex">
                    {calendar?.year && (
                        <Tag
                            severity="info"
                            value={`FY ${calendar.year}`}
                            rounded
                            className="white-space-nowrap bg-bluegray-500"
                        />
                    )}
                </div>

                <div className="text-right ml-2">
                    <small className="block text-500 uppercase font-bold text-xs">
                        {organization?.name || 'Unknown'}
                    </small>
                </div>
            </div>

            {/* MIDDLE SECTION: Titles */}
            <div className="mb-3">
                <span className="text-xs font-bold text-500 uppercase tracking-wider">
                    {grant?.title || "Untitled Grant"}
                </span>
                <h4 className="text-xl font-bold m-0 line-height-3 text-900">
                    {call.title}
                </h4>
            </div>

            <p className="text-600 text-sm mb-4 line-height-3 line-clamp-2">
                {call.description}
            </p>

            {/* HIGHLIGHT SECTION: Financials & Primary Stage Timeline */}
            <div className="p-3 border-round mb-3 bg-highlight">
                <div className="flex flex-column gap-2">

                    {/* Call Deadline Date & Time */}
                    <div className="flex align-items-center gap-2">
                        <i className={`pi pi-clock text-sm ${isUrgent ? 'text-orange-500' : 'text-primary'
                            }`}></i>
                        <span className="text-xs font-semibold text-color-secondary">
                            Deadline: {deadline ? format(new Date(deadline), 'MMM dd, yyyy - hh:mm a') : 'N/A'}
                        </span>
                    </div>
                </div>

                {/* Status/Countdown */}
                <div className={`flex align-items-center gap-2 border-top-1 pt-2 mt-2 ${isUrgent ? 'border-orange-200' : 'border-300'
                    }`}>
                    <i className={`pi pi-clock ${isUrgent ? 'text-orange-500' : 'text-primary'
                        }`}></i>
                    <span className={`text-xs font-bold ${isUrgent ? 'text-orange-500' : 'text-primary'
                        }`}>
                        {isClosed ? 'Application Closed' : `${daysLeft} days remaining to apply`}
                    </span>
                </div>
            </div>

            <Divider className="my-3 mt-auto" />

            {/* FOOTER: Actions */}
            <div className="flex align-items-center justify-content-between">
                <div className="flex flex-column">
                    <small className="text-500 text-xs">Funding Source</small>
                    <span className="text-xs font-medium">{(grant?.fundingSource) || 'Internal Fund'}</span>
                </div>
                <Button
                    label={isClosed ? "Closed" : "Apply"}
                    icon={isClosed ? "pi pi-lock" : "pi pi-pencil"}
                    size="small"
                    className={`p-button-raised ${isUrgent ? 'p-button-warning' : ''}`}
                    disabled={isClosed}
                    onClick={proceedToApply}
                />
            </div>
        </Card>
    );
};