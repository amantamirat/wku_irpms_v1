'use client';

import { useAuth } from "@/contexts/auth-context";
import { PERMISSIONS } from "@/types/permissions";
import AvailableStages from "./dashboard/AvailableStages";
import CallOpportunityGrid from "./dashboard/CallOpportunityGrid";
import { MyPendingWorks } from "./dashboard/MyPendingWorks";
import VerificationWindow from "./dashboard/VerificationWindow";
import { ReportDashboard } from "./reports/components/Dashboard";

const Dashboard = () => {
    const { hasPermission } = useAuth();
    const isAdmin = hasPermission([PERMISSIONS.REPORT.DASHBOARD]);
    const canLookCalls = hasPermission("call:lookup");
    const canLookVerificationConfs = hasPermission("verification-conf:lookup");
    const canLookStages = hasPermission("stage:lookup");
    const canReadAssignedApplications = hasPermission("application:assigned:read");

    // Left content checks if any section can be rendered
    const hasLeftContent = canReadAssignedApplications || canLookCalls;

    return (
        <div className="grid">
            {/* 📊 REPORT OVERVIEW / STATS ROW */}
            {isAdmin && (
                <div className="col-12 mb-2">
                    <ReportDashboard />
                </div>
            )}

            {/* 🔵 LEFT COLUMN: Core Work */}
            <div className="col-12 lg:col-8">
                
                {/* Unified Pending Works Component (Self-contained) */}
                <MyPendingWorks 
                    canReadAssignedApplications={canReadAssignedApplications}
                />

                {/* Call Opportunities */}
                {canLookCalls && (
                    <div className="card border-none shadow-1 p-4 mb-4">
                        <div className="flex align-items-center justify-content-between mb-4">
                            <h5 className="m-0 text-xl font-bold">Call Opportunities</h5>
                        </div>
                        <CallOpportunityGrid />
                    </div>
                )}
            </div>

            {/* 🟠 RIGHT COLUMN: Deadlines & Widgets */}
            <div className="col-12 lg:col-4">
                <div className="grid">
                    {canLookStages && (
                        <div className="col-12">
                            <AvailableStages />
                        </div>
                    )}
                    {canLookVerificationConfs && (
                        <div className="col-12">
                            <VerificationWindow />
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
};

export default Dashboard;