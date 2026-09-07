'use client';

import { useRouter } from 'next/navigation';
import { Button } from 'primereact/button';
import RoleManager from "./components/RoleManager";
import { useAuth } from '@/contexts/auth-context';

const RolePage = () => {
    const router = useRouter();
    const { hasPermission } = useAuth();
    // Check if the current user has permission to manage permissions
    const canManagePermissions = hasPermission('permission:read');

    return (
        <div className="p-4 md:p-5 surface-ground min-h-screen">
            
            {/* HEADER WITH NAVIGATION BUTTON */}
            <div className="mb-4 flex flex-column md:flex-row md:align-items-center justify-content-between gap-3">
                <div className="flex flex-column gap-1">
                    <h2 className="text-2xl font-bold text-900 m-0">
                        Role Management
                    </h2>
                    <span className="text-600 text-sm">
                        Manage system roles and configure access privileges
                    </span>
                </div>

                {canManagePermissions && (
                    <Button
                        label="Manage Permissions"
                        icon="pi pi-key"
                        className="p-button-outlined p-button-secondary w-full md:w-auto"
                        onClick={() => router.push('/roles/permissions')} // Adjust target route as needed
                    />
                )}
            </div>

            {/* MAIN CONTENT */}
            <div className="border-round-xl surface-card shadow-1 p-4 md:p-5">
                <RoleManager />
            </div>

        </div>
    );
};

export default RolePage;