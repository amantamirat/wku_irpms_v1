'use client';
import React, { useEffect, useState } from 'react';
import { Skeleton } from 'primereact/skeleton';
import { Tag } from 'primereact/tag';
import { format } from 'date-fns'; // Recommended for date formatting
import { CallStageApi } from '../calls/stages/api/call.stage.api';
import { CallStage } from '../calls/stages/models/call.stage.model';

const DeadlineCalendar = () => {
    const [stages, setStages] = useState<CallStage[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchDeadlines = async () => {
            try {
                // Fetch stages - you might want to add a filter for 'active' or 'upcoming'
                const data = await CallStageApi.getAll({ populate: true });

                // Sort by deadline ascending
                const sorted = data
                    .filter(s => new Date(s.deadline) >= new Date())
                    .sort((a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime())
                    .slice(0, 5); // Show top 5

                setStages(sorted);
            } catch (error) {
                console.error("Failed to load deadlines", error);
            } finally {
                setLoading(false);
            }
        };

        fetchDeadlines();
    }, []);

    if (loading) {
        return <Skeleton width="100%" height="150px" />;
    }

    if (stages.length === 0) {
        return <p className="text-500 text-sm">No upcoming deadlines.</p>;
    }

    return (
        <ul className="list-none p-0 m-0">
            {stages.map((stage) => {
                const deadlineDate = new Date(stage.deadline);
                const isUrgent = (deadlineDate.getTime() - new Date().getTime()) < 86400000 * 3; // 3 days

                return (
                    <li key={stage._id} className="flex align-items-center py-3 border-bottom-1 surface-border">
                        <div className={`flex flex-column align-items-center justify-content-center border-round surface-100 p-2 mr-3 ${isUrgent ? 'bg-orange-100 text-orange-700' : ''}`} style={{ minWidth: '50px' }}>
                            <span className="text-xs font-bold uppercase">{format(deadlineDate, 'MMM')}</span>
                            <span className="text-xl font-bold">{format(deadlineDate, 'dd')}</span>
                        </div>
                        <div className="flex-grow-1">
                            <div className="text-900 font-medium mb-1">
                                {typeof stage.call === 'object' ? stage.call.title : 'Project Stage'}
                            </div>
                            <div className="text-600 text-sm">
                                {typeof stage.grantStage === 'object' ? stage.grantStage.name : `Stage ${stage.order}`}
                            </div>
                        </div>
                        {isUrgent && <Tag severity="warning" value="Soon" />}
                    </li>
                );
            })}
        </ul>
    );
};

export default DeadlineCalendar;