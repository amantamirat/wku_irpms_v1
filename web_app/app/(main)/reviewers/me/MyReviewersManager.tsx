'use client';
import { useEffect, useState } from 'react';
import MyBadge from '@/templates/MyBadge';
import {
    ItemDataTable,
    RowActionButton
} from '@/components/data-table/ItemDataTable';
import { ReviewerApi } from '../api/reviewer.api';
import {
    Reviewer,
    ReviewerStatus,
    ReviewerTargetType
} from '../models/reviewer.model';

import EvaluationDialog from '../components/EvaluationDialog';
import { useStateTransitionActions } from '@/hooks/useStateTransitionActions';
import { StateTransition } from '@/api/EntityApi';
import { REVIEWER_USER_TRANSITIONS } from '../models/reviewer.state-machine';

const MyReviewersManager = () => {
    const [reviewers, setReviewers] = useState<Reviewer[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedReviewer, setSelectedReviewer] =
        useState<Reviewer | null>(null);

    useEffect(() => {
        ReviewerApi.me()
            .then(data => {
                setReviewers(Array.isArray(data) ? data : []);
            })
            .catch(error =>
                console.error('Error fetching my evaluations', error)
            )
            .finally(() => setLoading(false));
    }, []);


    const handleTransition = async (
        id: string,
        transition: StateTransition
    ) => {
        const updated = await ReviewerApi.transitionState?.(
            id,
            transition
        );

        if (!updated) return;

        setReviewers(prev =>
            prev.map(item =>
                item._id === id
                    ? { ...item, status: updated.status }
                    : item
            )
        );
    };
    const stateActions: RowActionButton<Reviewer>[] =
        useStateTransitionActions({
            resource: 'reviewer',
            statusField: 'status',
            transitions: REVIEWER_USER_TRANSITIONS,
            onTransition: handleTransition
        });

    const rowActions: RowActionButton<Reviewer>[] = [
        {
            icon: 'pi pi-eye',
            severity: 'secondary',
            tooltip: 'Start/View Evaluation',
            disabled: reviewer =>
                reviewer.status === ReviewerStatus.pending,
            onClick: reviewer => {
                setSelectedReviewer(reviewer);
            }
        }
    ];

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

    const handleCloseDialog = () => {
        setSelectedReviewer(null);

        ReviewerApi.me()
            .then(data => {
                setReviewers(Array.isArray(data) ? data : []);
            })
            .catch(error =>
                console.error('Error refreshing evaluations', error)
            );
    };

    if (loading) {
        return (
            <div className="p-4 text-center">
                Loading evaluations...
            </div>
        );
    }

    return (
        <>
            <ItemDataTable
                items={reviewers}
                columns={columns}
                rowActions={[...stateActions, ...rowActions]}
                enableSearch={false}
                emptyTitle="No project evaluation"
                emptyDescription="You are not listed as an evaluator on any projects."
            />

            <EvaluationDialog
                reviewer={selectedReviewer}
                enableEvaluation={true}
                onClose={handleCloseDialog}
            />
        </>
    );
};

export default MyReviewersManager;