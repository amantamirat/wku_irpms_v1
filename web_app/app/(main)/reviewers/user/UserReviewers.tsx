'use client';

import { useEffect, useState } from 'react';
import MyBadge from '@/templates/MyBadge';
import { ItemDataTable } from '@/components/data-table/ItemDataTable';
import { ReviewerApi } from '../api/reviewer.api';
import { Reviewer, ReviewerTargetType } from '../models/reviewer.model';

interface UserReviewersProps {
    user: string | { _id?: string; id?: string;[key: string]: any };
}

const UserReviewers = ({ user }: UserReviewersProps) => {
    const [reviewers, setReviewers] = useState<Reviewer[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Extract ID whether user is a string or an object containing an ID
        const userId = typeof user === 'string' ? user : (user?._id || user?.id);

        if (!userId) {
            setReviewers([]);
            setLoading(false);
            return;
        }

        ReviewerApi.getAll({ reviewer: userId })
            .then(data => {
                setReviewers(Array.isArray(data) ? data : []);
            })
            .catch(error =>
                console.error('Error fetching evaluations for user', error)
            )
            .finally(() => setLoading(false));
    }, [user]);

    const columns = [
        {
            header: 'Project',
            field: 'project.title',
            body: (reviewer: Reviewer) => {
                const project =
                    typeof reviewer.project === 'object'
                        ? reviewer.project
                        : null;

                const title = project?.title ?? 'Unknown Project';

                return (
                    <div
                        className="truncate text-sm font-medium"
                        title={title}
                        style={{ maxWidth: '350px' }}
                    >
                        {title}
                    </div>
                );
            }
        },
        {
            header: 'Stage',
            field: 'targetType',
            body: (reviewer: Reviewer) => {
                const targetType =
                    reviewer.targetType ??
                    (reviewer.application
                        ? ReviewerTargetType.APPLICATION
                        : ReviewerTargetType.VERIFICATION);

                if (targetType === ReviewerTargetType.APPLICATION) {
                    const stageName =
                        typeof reviewer.application === 'object' &&
                            typeof reviewer.application?.stage === 'object'
                            ? reviewer.application.stage?.name
                            : null;

                    return (
                        <span className="text-sm text-gray-700 font-medium">
                            {stageName ?? ReviewerTargetType.APPLICATION}
                        </span>
                    );
                }

                return (
                    <span className="text-sm text-gray-700 font-medium">
                        {ReviewerTargetType.VERIFICATION}
                    </span>
                );
            }
        },
        {
            header: 'Status',
            field: 'status',
            sortable: true,
            body: (reviewer: Reviewer) => (
                <MyBadge
                    type="status"
                    value={reviewer.status ?? 'Unknown'}
                />
            )
        }
    ];

    if (loading) {
        return (
            <div className="p-4 text-center">
                Loading evaluations...
            </div>
        );
    }

    return (
        <ItemDataTable
            items={reviewers}
            columns={columns}
            rowActions={[]}
            enableSearch={false}
            emptyTitle="No project evaluation"
            emptyDescription="This user is not listed as an evaluator on any projects."
        />
    );
};

export default UserReviewers;