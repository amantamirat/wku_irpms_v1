'use client';
import PhaseManager from "../components/PhaseManager";

const PhasePage = () => {
    

    return (
        <div className="flex flex-column gap-4 p-4 md:p-5">

            {/* HEADER */}
            <div>
                <h2 className="text-2xl font-semibold text-900 m-0">
                    All Phases
                </h2>
                <span className="text-500 text-sm">
                    Project phases, budgets, and durations
                </span>
            </div>
            {/* MAIN SECTION */}
            <div className="bg-white border-round-xl shadow-1">
                {/* CONTENT */}
                <div className="p-3">
                    <PhaseManager />
                </div>
            </div>

        </div>
    );
};

export default PhasePage;