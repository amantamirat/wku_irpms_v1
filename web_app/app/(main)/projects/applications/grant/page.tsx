'use client';
import { GrantApi } from '@/app/(main)/grants/api/grant.api';
import { etbCurrencyFormatter, Grant } from '@/app/(main)/grants/models/grant.model';
import { GrantStatus } from '@/app/(main)/grants/models/grant.state-machine';
import { GrantStageApi } from '@/app/(main)/grants/stages/api/grant.stage.api';
import { GrantStage } from '@/app/(main)/grants/stages/models/grant.stage.model';
import { Dropdown } from 'primereact/dropdown';
import { TabPanel, TabView } from 'primereact/tabview';
import { useEffect, useState } from "react";
import ProjectApplicationManager from '../components/ProjectApplicationManager';

const Page = () => {
    const [grants, setGrants] = useState<Grant[]>([]);
    const [selectedGrant, setSelectedGrant] = useState<Grant | null>(null);
    const [grantStages, setGrantStages] = useState<GrantStage[]>([]);
    const [activeIndex, setActiveIndex] = useState(0);

    useEffect(() => {
        const fetchGrant = async () => {
            const data = await GrantApi.getAll({ status: GrantStatus.active, populate: true });
            setGrants(data);
            if (data?.length) setSelectedGrant(data[0]);
        };
        fetchGrant();
    }, []);

    useEffect(() => {
        if (selectedGrant) {
            const fetchStages = async () => {
                const data = await GrantStageApi.getAll({ grant: selectedGrant });
                setGrantStages(data);
                setActiveIndex(0);
            };
            fetchStages();
        }
    }, [selectedGrant]);

    return (
        <div className="p-4 md:p-5 surface-ground min-h-screen">

            {/* HEADER */}
            <div className="mb-4 flex flex-column gap-2">
                <h2 className="text-2xl font-bold text-900 m-0">
                    Grant Applications Management
                </h2>
                <span className="text-600 text-sm">
                    Review, evaluate, and manage project applications efficiently
                </span>
            </div>

            {/* CONTROL PANEL */}
            <div className="border-round-xl shadow-1 p-4 mb-4 flex flex-column md:flex-row md:align-items-end md:justify-content-between gap-4">

                <div className="flex flex-column gap-2">
                    <label className="text-700 font-medium text-sm">
                        Select Grant Source
                    </label>

                    <Dropdown
                        value={selectedGrant}
                        options={grants}
                        onChange={(e) => setSelectedGrant(e.value)}
                        optionLabel="title"
                        placeholder="Choose grant..."
                        className="w-full md:w-20rem"
                        showClear
                    />
                </div>

                {selectedGrant && (
                    <div className="text-right">
                        <div className="text-900 font-semibold">
                            {selectedGrant.title}({etbCurrencyFormatter.format(selectedGrant.amount)})
                        </div>
                        <div className="text-500 text-sm">
                            Active Workflow
                        </div>
                    </div>
                )}
            </div>

            {/* MAIN CONTENT */}
            <div className="border-round-xl shadow-1 p-4 md:p-5">

                {selectedGrant ? (
                    grantStages.length > 0 ? (
                        <>
                            {/* SECTION TITLE */}
                            <div className="mb-4">
                                <h3 className="m-0 text-lg font-semibold text-900">
                                    Grant Stages
                                </h3>
                                <span className="text-500 text-sm">
                                    Navigate through each stage of grants
                                </span>
                            </div>

                            {/* TABS */}
                            <TabView
                                activeIndex={activeIndex}
                                onTabChange={(e) => setActiveIndex(e.index)}
                                scrollable
                                className="custom-tabs"
                            >
                                {grantStages.map((stage, index) => (
                                    <TabPanel
                                        key={stage._id}
                                        header={
                                            <div className="flex align-items-center gap-2">
                                                <span className="text-xs font-bold border-circle bg-primary text-white px-2 py-1">
                                                    {index + 1}
                                                </span>
                                                <span>{stage.name}</span>
                                            </div>
                                        }
                                    >
                                        <div className="mt-3">
                                            <ProjectApplicationManager
                                                grantStage={stage}
                                                //grantAllocation={selectedGrant}
                                                hideReviewer={false}
                                            //hideDeleteAction={true}
                                            />
                                        </div>
                                    </TabPanel>
                                ))}
                            </TabView>
                        </>
                    ) : (
                        <div className="flex flex-column align-items-center justify-content-center py-8 text-center">
                            <i className="pi pi-sitemap text-4xl text-300 mb-3" />
                            <h3 className="text-900 m-0">No Workflow Defined</h3>
                            <p className="text-500 mt-2">
                                This allocation does not have any stages yet.
                            </p>
                        </div>
                    )
                ) : (
                    <div className="flex flex-column align-items-center justify-content-center py-8 text-center">
                        <i className="pi pi-folder-open text-4xl text-300 mb-3" />
                        <h3 className="text-900 m-0">No Allocation Selected</h3>
                        <p className="text-500 mt-2">
                            Choose a grant allocation to begin managing workflow stages.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Page;