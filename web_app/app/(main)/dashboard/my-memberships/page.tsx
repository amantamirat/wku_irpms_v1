'use client';

import React from 'react';
import { useAuth } from "@/contexts/auth-context";
import { BreadCrumb } from 'primereact/breadcrumb';
import { Card } from 'primereact/card';
import CollaboratorManager from '../../collaborators/member/Manager';

const MyMembershipsPage = () => {
    const { getUser } = useAuth();
    const user = getUser();

    const breadcrumbItems = [
        { label: 'My Memberships' }
    ];
    const home = { icon: 'pi pi-home', url: '/' };

    return (
        <div className="p-3 md:p-5 surface-50 min-h-screen">
            <div className="max-w-7xl mx-auto">
                {/* Breadcrumbs */}
                <BreadCrumb
                    model={breadcrumbItems}
                    home={home}
                    className="bg-transparent border-none p-0 mb-3 text-sm"
                />

                {/* Page Header */}
                <div className="flex flex-column md:flex-row md:align-items-center justify-content-between gap-3 mb-4">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-900 m-0 mb-1">
                            My Memberships
                        </h1>
                        <p className="text-500 text-sm m-0">
                            View, manage, and track your active project collaborations and team memberships.
                        </p>
                    </div>
                </div>

                {/* Main Content Card */}
                <Card className="shadow-1 border-none border-round-xl surface-card">
                    {user ? (
                        <CollaboratorManager user={user} />
                    ) : (
                        <div className="p-5 text-center text-500">
                            <i className="pi pi-spin pi-spinner text-2xl mb-2 block text-primary"></i>
                            Loading membership details...
                        </div>
                    )}
                </Card>
            </div>
        </div>
    );
};

export default MyMembershipsPage;