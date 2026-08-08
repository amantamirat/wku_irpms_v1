'use client';

import { useState } from "react";
import CollaboratorManager from "../components/CollaboratorManager";

const CollaboratorPage = () => {
    //const [collaborators, setCollaborators] = useState<any[]>([]);

    return (
        <div className="flex flex-column gap-4 p-4 md:p-5">

            {/* HEADER */}
            <div>
                <h2 className="text-2xl font-semibold text-900 m-0">
                    All Collaborators
                </h2>
                <span className="text-500 text-sm">
                    Project collaborators, roles, and participation
                </span>
            </div>
            {/* MAIN SECTION */}
            <div className="bg-white border-round-xl shadow-1">

                {/* CONTENT */}
                <div className="p-3">
                    <CollaboratorManager />
                </div>
            </div>           

        </div>
    );
};

export default CollaboratorPage;