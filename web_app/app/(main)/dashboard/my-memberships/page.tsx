'use client';

import { BreadCrumb } from 'primereact/breadcrumb';
import { Card } from 'primereact/card';
import MyMembershipsManager from '../../collaborators/me/MyMembershipsManager';

const BREADCRUMB_ITEMS = [{ label: 'My Memberships' }];
const BREADCRUMB_HOME = { icon: 'pi pi-home', url: '/' };

const MyMembershipsPage = () => {
    return (
        <div className="p-3 md:p-5 surface-50 min-h-screen">
            <div className="max-w-7xl mx-auto">
                <BreadCrumb
                    model={BREADCRUMB_ITEMS}
                    home={BREADCRUMB_HOME}
                    className="bg-transparent border-none p-0 mb-3 text-sm"
                />

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

                <Card className="shadow-1 border-none border-round-xl surface-card">
                    <MyMembershipsManager />
                </Card>
            </div>
        </div>
    );
};

export default MyMembershipsPage;