'use client';

import React, { useEffect, useMemo, useState } from 'react';
import ReviewerManager from '../components/ReviewerManager';
import { Button } from 'primereact/button';
import Link from 'next/link';
import { Reviewer, ReviewerStatus } from '../models/reviewer.model';
import { ReviewerApi } from '../api/reviewer.api';

interface PendingEvaluationsProps {
    user: any;
}

const PendingEvaluations = ({ user }: PendingEvaluationsProps) => {
    const [reviews, setReviews] = useState<Reviewer[] | null>(null);
    const [loading, setLoading] = useState(true);

    const PENDING_STATUSES = useMemo(() => [ReviewerStatus.pending, ReviewerStatus.accepted], []);

    useEffect(() => {
        const fetchPending = async () => {
            if (!user?._id) return;
            try {
                const data = await ReviewerApi.getAll({
                    reviewer: user._id,
                    status: PENDING_STATUSES,
                    populate: true
                });
                setReviews(data);
            } catch (error) {
                setReviews([]);
            } finally {
                setLoading(false);
            }
        };

        fetchPending();
    }, [user?._id, PENDING_STATUSES]);

    // Only hide the component entirely if we are NOT loading AND we have no items
    if (!loading && (!reviews || reviews.length === 0)) {
        return null;
    }

    return (
        <div className="card border-none shadow-1 p-4 mb-4">
            <div className="flex align-items-center justify-content-between mb-4">
                <div>
                    <h5 className="m-0 text-xl font-bold">Pending Evaluations</h5>
                    <p className="text-500 text-sm m-0">Assignments requiring your review</p>
                </div>
                <Link href="reviewers/my-evaluations">
                    <Button label="View All" icon="pi pi-arrow-right" iconPos="right" className="p-button-text p-button-sm" />
                </Link>
            </div>

            {loading ? (
                <div className="flex align-items-center gap-2 py-4">
                    <i className="pi pi-spin pi-spinner" style={{ fontSize: '1.2rem' }}></i>
                    <span>Loading evaluations...</span>
                </div>
            ) : (
                <ReviewerManager
                    reviewer={user}
                    reviewers={reviews || []}
                    hideSearch
                />
            )}
        </div>
    );
};

export default PendingEvaluations;