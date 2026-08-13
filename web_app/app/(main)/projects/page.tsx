'use client';

import { useEffect, useState } from 'react';
import { Dropdown } from 'primereact/dropdown';
import { GrantApi } from '@/app/(main)/grants/api/grant.api';
import { Grant } from '@/app/(main)/grants/models/grant.model';
//import ProjectManager from './components/ProjectManager';
import ProjectManager from './grant/Manager';

const Page = () => {
    const [grants, setGrants] = useState<Grant[]>([]);
    const [selectedGrant, setSelectedGrant] = useState<Grant | null>(null);

    // Fetch available Grants on load
    useEffect(() => {
        const fetchGrants = async () => {
            try {
                const data = await GrantApi.getAll({ populate: true });
                setGrants(data || []);
                if (data?.length) {
                    setSelectedGrant(data[0]);
                }
            } catch (error) {
                console.error('Failed to fetch grants:', error);
            }
        };
        fetchGrants();
    }, []);

    return (
        <div className="p-4 md:p-5 surface-ground min-h-screen">

            {/* HEADER */}
            <div className="mb-4 flex flex-column gap-2">
                <h2 className="text-2xl font-bold text-900 m-0">
                    Project Management
                </h2>
                <span className="text-600 text-sm">
                    Select a grant to review and manage associated projects
                </span>
            </div>

            {/* CONTROL PANEL */}
            <div className="border-round-xl surface-card shadow-1 p-4 mb-4 flex flex-column md:flex-row md:align-items-end md:justify-content-between gap-4">
                <div className="flex flex-column gap-2">
                    <label className="text-700 font-medium text-sm">
                        Select Grant
                    </label>
                    <Dropdown
                        value={selectedGrant}
                        options={grants}
                        onChange={(e) => setSelectedGrant(e.value)}
                        optionLabel="title"
                        placeholder="Choose grant..."
                        className="w-full md:w-20rem"
                        showClear
                    />
                </div>

                {selectedGrant && (
                    <div className="text-right">
                        <div className="text-900 font-semibold">
                            {selectedGrant.title}
                        </div>
                        <div className="text-500 text-sm">
                            Active Grant Filter
                        </div>
                    </div>
                )}
            </div>

            {/* MAIN CONTENT */}
            <div className="border-round-xl surface-card shadow-1 p-4 md:p-5">
                {selectedGrant ? (
                    <ProjectManager grant={selectedGrant} />
                ) : (
                    <div className="flex flex-column align-items-center justify-content-center py-8 text-center">
                        <i className="pi pi-file-import text-4xl text-300 mb-3" />
                        <h3 className="text-900 m-0 font-medium">No Grant Selected</h3>
                        <p className="text-500 mt-2 text-sm">
                            Please select a grant above to view its projects.
                        </p>
                    </div>
                )}
            </div>

        </div>
    );
};

export default Page;