'use client';

import { useAuth } from "@/contexts/auth-context";

import { Divider } from "primereact/divider";
import CollaboratorManager from "../components/CollaboratorManager";

const CollaboratorPage = () => {
    const { getUser: getApplicant } = useAuth();
    const applicant = getApplicant();

    return (
        <div className="p-4 md:p-6">
            {/* Page Header */}
            <div className="mb-4">
                <h2 className="text-2xl font-semibold mb-2">
                    Collaboration Management Dashboard
                </h2>

                {applicant && (
                    <p className="text-color-secondary">
                        Applicant: <span className="font-medium">{applicant.name}</span>
                    </p>
                )}
            </div>

            <Divider align="left">
                <span className="text-sm font-semibold text-primary">
                    My Collaborations
                </span>
            </Divider>
            {applicant && <CollaboratorManager applicant={applicant} />}
        </div>
    );
};

export default CollaboratorPage;