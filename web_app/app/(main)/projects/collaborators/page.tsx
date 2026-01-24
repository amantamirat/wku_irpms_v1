'use client';

import { useAuth } from "@/contexts/auth-context";
import CollaboratorManager from "./components/CollaboratorManager";

const CollaboratorPage = () => {
    const { getApplicant } = useAuth();
    const applicant = getApplicant();
    return (
        <CollaboratorManager applicant={applicant} />
    );
};
export default CollaboratorPage;