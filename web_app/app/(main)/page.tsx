'use client';

import { useAuth } from "@/contexts/auth-context";
import { PERMISSIONS } from "@/types/permissions";
import CallOpportunityGrid from "./dashboard/components/CallOpportunityGrid";
import { MyPendingWorks } from "./dashboard/MyPendingWorks";
import VerificationWindow from "./dashboard/VerificationWindow";
import { ReportDashboard } from "./reports/components/Dashboard";

const Dashboard = () => {
    const { hasPermission } = useAuth();
    
    const isAdmin = hasPermission([PERMISSIONS.REPORT.DASHBOARD]);
    const canSubmitApplication = hasPermission("application:submit");
    const canSubmitVerification = hasPermission("verification:submit");
    const canReadAssignedApplications = hasPermission("application:assigned:read");

    // Content visibility checks for dynamic layout spanning
    const hasLeftContent = canReadAssignedApplications || canSubmitApplication;
    const hasRightContent = canSubmitVerification;

    return (
        <div className="grid">
            {/* 📊 REPORT OVERVIEW / STATS ROW */}
            {isAdmin && (
                <div className="col-12 mb-2">
                    <ReportDashboard />
                </div>
            )}

            {/* 🔵 LEFT COLUMN: Core Work */}
            {hasLeftContent && (
                <div className={`col-12 ${hasRightContent ? 'lg:col-8' : 'lg:col-12'}`}>
                    {/* Unified Pending Works Component (Self-contained) */}
                    <MyPendingWorks
                        canReadAssignedApplications={canReadAssignedApplications}
                    />

                    {/* Call Opportunities */}
                    {canSubmitApplication && (
                        <div className="card border-none shadow-1 p-4 mb-4">
                            <div className="flex align-items-center justify-content-between mb-4">
                                <h5 className="m-0 text-xl font-bold">Call Opportunities</h5>
                            </div>
                            <CallOpportunityGrid />
                        </div>
                    )}
                </div>
            )}

            {/* 🟠 RIGHT COLUMN: Deadlines & Widgets */}
            {hasRightContent && (
                <div className={`col-12 ${hasLeftContent ? 'lg:col-4' : 'lg:col-12'}`}>
                    <div className="grid">
                        <div className="col-12">
                            <VerificationWindow />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Dashboard;