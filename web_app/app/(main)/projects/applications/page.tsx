'use client';

import React from 'react';
import { useAuth } from '@/contexts/auth-context';
import ProjectManager from '../components/ProjectManager';
import { Card } from 'primereact/card';
import { BreadCrumb } from 'primereact/breadcrumb';

const MyProjectsPage = () => {
    const { getUser: getApplicant } = useAuth();
    const applicant = getApplicant();

    // Subtle navigation for a professional feel
    const breadcrumbItems = [
        { label: 'Management' },
        { label: 'My Projects' }
    ];
    const home = { icon: 'pi pi-home', url: '/' };

    return (
        <div className="p-3 md:p-5 surface-50 min-h-screen">
            {/* Contextual Header */}
            <div className="mb-4">
                <BreadCrumb
                    model={breadcrumbItems}
                    home={home}
                    className="bg-transparent border-none p-0 mb-3 text-sm"
                />
                <h1 className="text-2xl font-bold text-900 m-0">My Projects</h1>
                {applicant && (
                    <small className="text-500 font-medium">
                        <span className="text-700 uppercase">{applicant.name}</span>
                    </small>
                )}
            </div>

            {/* Content Container */}
            <Card className="shadow-1 border-none border-round-xl overflow-hidden">               

                {/* The core logic remains intact */}
                {applicant ? (
                    <ProjectManager applicant={applicant} />
                ) : (
                    <div className="p-8 text-center surface-100 border-round">
                        <i className="pi pi-spin pi-spinner text-2xl text-400 mb-2"></i>
                        <p className="text-500">Synchronizing project data...</p>
                    </div>
                )}
            </Card>
        </div>
    );
};

export default MyProjectsPage;