'use client';

import { useAuth } from "@/contexts/auth-context";

import { Divider } from "primereact/divider";
import CollaboratorManager from "../components/CollaboratorManager";
import { Fieldset } from "primereact/fieldset";

const CollaboratorPage = () => {
    const { getUser } = useAuth();
    const user = getUser();

    return (
        <div className="p-4 md:p-6">
            {/* Page Header */}
            <div className="mb-4">
                <h2 className="text-2xl font-semibold mb-2">
                    My Collaborations
                </h2>
            </div>
            {user &&
                <Fieldset legend={user.name}>
                    <CollaboratorManager applicant={user} />
                </Fieldset>
            }
        </div>
    );
};

export default CollaboratorPage;