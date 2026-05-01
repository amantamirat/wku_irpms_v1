'use client';

import { useAuth } from "@/contexts/auth-context";
import { Fieldset } from "primereact/fieldset";
import ReviewerManager from "../components/ReviewerManager";

const ReviewerPage = () => {
    const { getUser } = useAuth();
    const user = getUser();

    return (
        <div className="p-4 md:p-6">
            {/* Page Header */}
            <div className="mb-4">
                <h2 className="text-2xl font-semibold mb-2">
                    My Evaluations
                </h2>
            </div>

            {user && (
                <Fieldset legend={user.name}>
                    <ReviewerManager reviewer={user} />
                </Fieldset>
            )}
        </div>
    );
};

export default ReviewerPage;