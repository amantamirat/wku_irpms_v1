'use client';

import React, { useCallback, useEffect, useState } from 'react';
import ReviewerManager from '../reviewers/components/ReviewerManager';
import { Button } from 'primereact/button';
import Link from 'next/link';
import { Reviewer, ReviewerStatus } from '../reviewers/models/reviewer.model';
import { ReviewerApi } from '../reviewers/api/reviewer.api';

interface PendingEvaluationsProps {
    user: any;
}

const PendingEvaluations = ({ user }: PendingEvaluationsProps) => {
    const [reviews, setReviews] = useState<Reviewer[] | null>(null);
    const [loading, setLoading] = useState(true);

    // 1. Define the fetch logic
    const fetchPending = useCallback(async (showSilent = false) => {
        if (!user?._id) return;
        
        // Only show the big spinner on initial load, not on refreshes
        if (!showSilent) setLoading(true); 
        
        try {
            const data = await ReviewerApi.getAll({
                reviewer: user._id,
                status: [ReviewerStatus.pending, ReviewerStatus.accepted],
                populate: true
            });
            setReviews(data);
        } catch (error) {
            console.error("Failed to fetch evaluations:", error);
            setReviews([]);
        } finally {
            setLoading(false);
        }
    }, [user?._id]);

    // 2. Trigger initial fetch on mount (This was missing!)
    useEffect(() => {
        fetchPending();
    }, [fetchPending]);

    // 3. Callback for the child component
    const handleRefresh = useCallback(() => {
        fetchPending(true); // "Silent" update so the whole card doesn't flicker
    }, [fetchPending]);

    // Only hide if loading is done and there's nothing to show
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
                    //onItemsChange={handleRefresh} // Pass the memoized callback
                    hideSearch
                />
            )}
        </div>
    );
};

export default PendingEvaluations;