'use client';

import React from 'react';
import { useAuth } from '@/contexts/auth-context';
import ProjectManager from '../components/ProjectManager';
import { Card } from 'primereact/card';
import { BreadCrumb } from 'primereact/breadcrumb';
import { Fieldset } from 'primereact/fieldset';

const MyProjectsPage = () => {
    const { getUser: getApplicant } = useAuth();
    const applicant = getApplicant();

    // Subtle navigation for a professional feel
    const breadcrumbItems = [
        { label: 'My Projects' }
    ];
    const home = { icon: 'pi pi-home', url: '/' };

    return (
        <div className="p-3 md:p-5 surface-50 min-h-screen">
            <div className="mb-4">
                <BreadCrumb
                    model={breadcrumbItems}
                    home={home}
                    className="bg-transparent border-none p-0 mb-3 text-sm"
                />
                <div className="mb-4">
                    <h2 className="text-2xl font-semibold mb-2">
                        My Applications
                    </h2>
                </div>
                {applicant &&
                    <Fieldset legend={applicant.name}>
                        <ProjectManager applicant={applicant} />
                    </Fieldset>
                }

            </div>
        </div>
    );
};

export default MyProjectsPage;