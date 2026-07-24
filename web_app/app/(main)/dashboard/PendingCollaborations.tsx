'use client';

import React, { useCallback, useEffect, useState } from 'react';
import CollaboratorManager from '../projects/collaborators/components/CollaboratorManager';
import { Button } from 'primereact/button';
import Link from 'next/link';
import { Collaborator, CollaboratorStatus } from '../projects/collaborators/models/collaborator.model';
import { CollaboratorApi } from '../projects/collaborators/api/collaborator.api';

interface PendingCollaborationsProps {
    user: any;
}

const PendingCollaborations = ({ user }: PendingCollaborationsProps) => {
    const [collaborations, setCollaborations] = useState<Collaborator[] | null>(null);
    const [loading, setLoading] = useState(true);

    const fetchPending = useCallback(async (showSilent = false) => {
        if (!user?._id) return;

        if (!showSilent) setLoading(true);

        try {
            const data = await CollaboratorApi.getAll({
                applicant: user._id,
                status: CollaboratorStatus.pending,
                populate: true
            });
            setCollaborations(data);
        } catch (error) {
            console.error("Failed to fetch collaborations:", error);
            setCollaborations([]);
        } finally {
            setLoading(false);
        }
    }, [user?._id]);

    useEffect(() => {
        fetchPending();
    }, [fetchPending]);

    const handleRefresh = useCallback(() => {
        fetchPending(true);
    }, [fetchPending]);

    if (!loading && (!collaborations || collaborations.length === 0)) {
        return null;
    }

    return (
        <div className="card border-none shadow-1 p-4 mb-4">
            <div className="flex align-items-center justify-content-between mb-4">
                <div>
                    <h5 className="m-0 text-xl font-bold">Pending Invitations</h5>
                    <p className="text-500 text-sm m-0">Project teams you have been invited to join</p>
                </div>
                <Link href="/projects/collaborators/my-memberships">
                    <Button label="View All" icon="pi pi-arrow-right" iconPos="right" className="p-button-text p-button-sm" />
                </Link>
            </div>

            {loading ? (
                <div className="flex align-items-center gap-2 py-4">
                    <i className="pi pi-spin pi-spinner" style={{ fontSize: '1.2rem' }}></i>
                    <span>Loading invitations...</span>
                </div>
            ) : (
                <CollaboratorManager
                    member={user}
                    collaborations={collaborations || []}
                    //onItemsChange={handleRefresh}
                    hideSearch
                />
            )}
        </div>
    );
};

export default PendingCollaborations;