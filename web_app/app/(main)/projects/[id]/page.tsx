'use client';

import { SpinnerSkeleton } from '@/components/Skeletons';
import { notFound, useParams } from 'next/navigation';
import { useEffect, useState } from 'react';

import { ProjectApi } from '../api/project.api';
import ProjectDetail from '../components/ProjectDetail';
import { Project } from '../models/project.model';

const Page = () => {
    const params = useParams();
    const rawId = params?.id as string | undefined;

    const [project, setProject] = useState<Project | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!rawId) return;

        let cancelled = false;

        const load = async () => {
            try {
                setLoading(true);
                setError(null);

                const data = await ProjectApi.getById!(rawId);

                if (!cancelled) setProject(data);
            } catch (err: any) {
                console.error('Failed to load project:', err);
                if (!cancelled) {
                    setError(err?.message || 'Failed to load project details. Please try again.');
                }
            } finally {
                if (!cancelled) setLoading(false);
            }
        };

        load();

        return () => {
            cancelled = true;
        };
    }, [rawId]);

    if (!rawId) {
        notFound();
    }

    if (loading) {
        return <SpinnerSkeleton />;
    }

    if (error || !project) {
        return (
            <div className="surface-card border-round p-4 text-center text-red-600 shadow-1">
                <i className="pi pi-exclamation-circle text-3xl mb-2"></i>
                <p className="m-0 font-medium">{error || 'Project data could not be found.'}</p>
            </div>
        );
    }

    return (
        <ProjectDetail
            project={project}
            updateProject={setProject}
            options={{ disableCrud: true, useLookup: true }}
        />
    );
};

export default Page;