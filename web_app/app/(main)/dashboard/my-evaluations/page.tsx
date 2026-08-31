'use client';

import React from 'react';
import MyReviewersManager from "../../reviewers/me/MyReviewersManager";
import { BreadCrumb } from 'primereact/breadcrumb';
import { Card } from 'primereact/card';

const MyEvaluationsPage = () => {
    const breadcrumbItems = [{ label: 'My Evaluations' }];
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
                            My Evaluations
                        </h1>
                        <p className="text-500 text-sm m-0">
                            Track, review, and submit feedback for your assigned proposal evaluations.
                        </p>
                    </div>
                </div>

                {/* Main Content Card */}
                <Card className="shadow-1 border-none border-round-xl surface-card">
                    <MyReviewersManager />
                </Card>
            </div>
        </div>
    );
};

export default MyEvaluationsPage;