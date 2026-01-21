/* eslint-disable @next/next/no-img-element */
'use client';
import CallGrid from "./dashboard/CallGrid";
import QuickLinks from "./dashboard/QuickLinks";
import StageGrid from "./dashboard/StageGrid";



const Dashboard = () => {

    return (
        <div className="grid">
            {/* 📊 Stats Summary */}
            <div className="col-12">
                {/*<ProjectStats />*/}
            </div>

            {/* 
            
            <div className="col-12">
                <div className="card">
                    {
                        <CallGrid />
                    }

                </div>
            </div>
            */}
            

            {/* 🧾 Open Calls */}
            <div className="col-12">
                <div className="card">
                    {
                        <StageGrid />
                    }

                </div>
            </div>

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
