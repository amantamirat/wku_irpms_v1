'use client';

import { BreadCrumb } from 'primereact/breadcrumb';
import { Card } from 'primereact/card';
import MyProjectsManager from '../../projects/me/MyProjectsManager';

const BREADCRUMB_ITEMS = [{ label: 'My Projects' }];
const BREADCRUMB_HOME = { icon: 'pi pi-home', url: '/' };

const MyProjectsPage = () => {
    return (
        <div className="p-3 md:p-5 surface-50 min-h-screen">
            <div className="max-w-7xl mx-auto">
                {/* Breadcrumbs */}
                <BreadCrumb
                    model={BREADCRUMB_ITEMS}
                    home={BREADCRUMB_HOME}
                    className="bg-transparent border-none p-0 mb-3 text-sm"
                />

                {/* Page Header */}
                <div className="flex flex-column md:flex-row md:align-items-center justify-content-between gap-3 mb-4">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-bold text-900 m-0 mb-1">
                            My Projects
                        </h1>
                        <p className="text-500 text-sm m-0">
                            View, edit, and track all your ongoing and submitted research projects.
                        </p>
                    </div>
                </div>

                {/* Main Content Card */}
                <Card className="shadow-1 border-none border-round-xl surface-card">
                    <MyProjectsManager />
                </Card>
            </div>
        </div>
    );
};

export default MyProjectsPage;