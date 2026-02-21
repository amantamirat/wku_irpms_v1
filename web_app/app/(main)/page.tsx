/* eslint-disable @next/next/no-img-element */
'use client';
import { PERMISSIONS } from "@/types/permissions";
import QuickLinks from "./dashboard/QuickLinks";
import StageGrid from "./dashboard/StageGrid";
import { useAuth } from "@/contexts/auth-context";



const Dashboard = () => {

    const { hasPermission } = useAuth();
    const canReadStages = hasPermission([PERMISSIONS.STAGE.READ]);

    return (
        <div className="grid">

            <div className="col-12">
                {/*<ProjectStats />*/}
            </div>


            {/* 🧾 Open Calls */}
            {canReadStages &&
                <div className="col-12">
                    <div className="card">
                        {
                            <StageGrid />
                        }
                    </div>
                </div>
            }

            {/* 📈 Performance Chart */}
            <div className="col-12 lg:col-6">
                {/*<OverviewChart />*/}
            </div>

            {/* 🔔 Notifications */}
            <div className="col-12 lg:col-6">
                { /*<Notifications />*/}
            </div>

            {/* ⚡ Quick Access */}
            <div className="col-12">                
                <QuickLinks />
            </div>
        </div>
    );
};

export default Dashboard;
