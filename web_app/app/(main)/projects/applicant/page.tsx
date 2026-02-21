'use client';
import { useAuth } from '@/contexts/auth-context';
import ProjectManager from '../components/ProjectManager';
import { Divider } from 'primereact/divider';

const Page = () => {
    const { getApplicant } = useAuth();
    const applicant = getApplicant();

    return (
        <div className="p-4 md:p-6">
            {/* Page Header */}
            <div className="mb-4">
                <h2 className="text-2xl font-semibold mb-2">
                    My Projects
                </h2>

                {applicant && (
                    <p className="text-color-secondary">
                        Applicant: <span className="font-medium">{applicant.name}</span>
                    </p>
                )}
            </div>

            <Divider align="left">
                <span className="text-sm font-semibold text-primary">
                    Project Overview
                </span>
            </Divider>

            {applicant && <ProjectManager applicant={applicant} />}
        </div>
    );
};

export default Page;
