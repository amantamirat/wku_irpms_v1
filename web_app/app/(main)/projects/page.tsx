'use client';
import { useAuth } from '@/contexts/auth-context';
import ProjectManager from './components/ProjectManager';

const ProjectPage = () => {
    const { getApplicant: getLinkedApplicant, hasPermission } = useAuth();
    const linkedApplicant = getLinkedApplicant();
    //const isOwner = linkedApplicant?._id === leadPI?._id;
    return (
        <ProjectManager />
    );
};

export default ProjectPage;
