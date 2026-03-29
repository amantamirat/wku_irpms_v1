'use client';
import CollaboratorManager from "./components/CollaboratorManager";
import { Divider } from "primereact/divider";

const CollaboratorPage = () => {


    return (
        <div className="p-4 md:p-6">
            <Divider align="left">
                <span className="text-sm font-semibold text-primary">
                    All Collaborators
                </span>
            </Divider>

            <CollaboratorManager />
        </div>
    );
};

export default CollaboratorPage;