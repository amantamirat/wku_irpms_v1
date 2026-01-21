'use client';
import { useAuth } from '@/contexts/auth-context';
import ProjectManager from './components/ProjectManager';

const ProjectPage = () => {
    const { getApplicant } = useAuth();
    const applicant = getApplicant();
    return (
        <ProjectManager applicant={applicant} />
    );
};

export default ProjectPage;
