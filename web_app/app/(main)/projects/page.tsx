'use client';
import { useAuth } from '@/contexts/auth-context';
import ProjectManager from './components/ProjectManager';

const ProjectPage = () => {
    const { getLinkedApplicant, hasPermission } = useAuth();
    const linkedApplicant = getLinkedApplicant();
    //const isOwner = linkedApplicant?._id === leadPI?._id;
    return (
        <ProjectManager leadPI={linkedApplicant} />
    );
};

export default ProjectPage;
