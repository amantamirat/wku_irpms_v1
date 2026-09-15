'use client';
import ProjectManager from "./components/ProjectManager";

const Page = () => {
    return (
        <div className="p-4 md:p-5 surface-ground min-h-screen">
            {/* HEADER */}
            <div className="mb-4 flex flex-column gap-2">
                <h2 className="text-2xl font-bold text-900 m-0">
                    Project Management
                </h2>
                <span className="text-600 text-sm">
                    Review and manage all system projects
                </span>
            </div>

            {/* MAIN CONTENT */}
            <ProjectManager />
        </div>
    );
};

export default Page;