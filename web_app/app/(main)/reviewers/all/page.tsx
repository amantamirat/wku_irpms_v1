'use client';
import ReviewerManager from "../components/ReviewerManager";

const Page = () => {
    return (
        <div className="flex flex-column gap-4 p-4 md:p-5">

            {/* HEADER */}
            <div>
                <h2 className="text-2xl font-semibold text-900 m-0">
                    All Reviewers
                </h2>
                <span className="text-500 text-sm">
                    Project reviewers, and scores
                </span>
            </div>
            {/* MAIN SECTION */}
            <div className="bg-white border-round-xl shadow-1">
                {/* CONTENT */}
                <div className="p-3">
                    <ReviewerManager />
                </div>
            </div>

        </div>
    );
};

export default Page;