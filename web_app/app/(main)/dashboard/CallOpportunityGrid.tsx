'use client';
import { Call } from '../calls/models/call.model';
import { OpenCallCard } from './OpenCallCard';

const CallOpportunityGrid = ({ calls, loading }: { calls: Call[], loading: boolean }) => {
    if (loading) {
        return (
            <div className="grid mt-2">
                {[1, 2, 3].map((i) => (
                    <div key={i} className="col-12 md:col-6 p-2">
                        {/* Assuming OpenCallCard has the skeleton we built earlier */}
                        <div className="card h-10rem surface-100 animate-pulse"></div>
                    </div>
                ))}
            </div>
        );
    }
    return (
        <div className="grid mt-2">
            {calls.length > 0 ? (
                calls.map((call) => (
                    <div key={call._id} className="col-12 md:col-6 xl:col-4 p-2">
                        <OpenCallCard
                            call={call}
                            onApply={(id) => window.location.href = `/apply/${id}`}
                        />
                    </div>
                ))
            ) : (
                <div className="col-12 text-center py-5">
                    <i className="pi pi-folder-open text-4xl text-300 mb-3"></i>
                    <p className="text-500">No active calls available at the moment.</p>
                </div>
            )}
        </div>
    );
};

export default CallOpportunityGrid;