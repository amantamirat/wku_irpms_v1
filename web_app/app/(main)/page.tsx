'use client';
import Link from "next/link";

import { PERMISSIONS } from "@/types/permissions";
import { useAuth } from "@/contexts/auth-context";
import QuickLinks from "./dashboard/QuickLinks";
import { Button } from "primereact/button";
import { useState, useEffect } from "react";
import { CallApi } from "./calls/api/call.api";
import { Call, CallStatus } from "./calls/models/call.model";
import CallOpportunityGrid from "./dashboard/CallOpportunityGrid";

const Dashboard = () => {
    const { hasPermission, getUser: getApplicant } = useAuth();
    const [calls, setCalls] = useState<Call[]>([]);
    const [loading, setLoading] = useState(true);

    // Define roles based on permissions
    const isAdmin = hasPermission([PERMISSIONS.PERMISSION.READ]);
    const isReviewer = hasPermission([PERMISSIONS.REVIEWER.READ]);
    const isResearcher = hasPermission([PERMISSIONS.PROJECT.READ]);


    useEffect(() => {
        const loadCalls = async () => {
            if (isResearcher) {
                try {
                    // Only fetch calls that are actually 'open' or 'active'
                    const data = await CallApi.getAll({ status: CallStatus.active, populate:true });
                    setCalls(data);
                } catch (err) {
                    console.error("Error loading calls:", err);
                } finally {
                    setLoading(false);
                }
            }
        };
        loadCalls();
    }, [isResearcher]);

    return (
        <div className="grid">
            {/* 🟢 TOP ROW: Stats (KPI Cards) */}
            <div className="col-12">
                {//<ProjectStatsView isAdmin={isAdmin} isResearcher={isResearcher} />
                }
            </div>

            {/* 🔵 LEFT COLUMN: Core Work (8/12 width) */}
            <div className="col-12 lg:col-8">
                {/* Researchers see what they can apply to */}
                {isResearcher && (
                    <div className="card border-none shadow-1 p-4 mb-4">
                        <div className="flex align-items-center justify-content-between mb-4">
                            <div>
                                <h5 className="m-0 text-xl font-bold">Call Opportunities</h5>
                                <p className="text-500 text-sm m-0">Open calls for grant applications and projects</p>
                            </div>
                            <Link href="/calls">
                                <Button label="View All" icon="pi pi-arrow-right" iconPos="right" className="p-button-text p-button-sm" />
                            </Link>
                        </div>

                        {/* Pass the fetched calls here */}
                        <CallOpportunityGrid calls={calls} loading={loading} />

                    </div>
                )}

                {/* Admins/Reviewers see submissions needing attention */}
                {(isAdmin || isReviewer) && (
                    <div className="card">
                        <h5>Pending Evaluations</h5>
                        {//<PendingReviewsTable />
                        }
                    </div>
                )}
            </div>


            {/* 🟠 RIGHT COLUMN: Utilities & Feed (4/12 width) */}
            <div className="col-12 lg:col-4">
                <div className="card mb-4">
                    <h5>Action Center</h5>
                    {
                        //<Notifications />
                    }

                </div>

                <div className="card">
                    <h5>Upcoming Deadlines</h5>
                    {
                        //<DeadlineCalendar />
                    }
                </div>
            </div>

            {/* 🟣 BOTTOM ROW: Navigation */}
            <div className="col-12">
                <QuickLinks />
            </div>
        </div>
    );
};

export default Dashboard;