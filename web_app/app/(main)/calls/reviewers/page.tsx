'use client';

import { useAuth } from "@/contexts/auth-context";
import ReviewerManager from "./components/ReviewerManager";

const ReviwerPage = () => {
    const { getApplicant } = useAuth();
    const applicant = getApplicant();
    return (
        <ReviewerManager applicant={applicant} />
    );
};
export default ReviwerPage;