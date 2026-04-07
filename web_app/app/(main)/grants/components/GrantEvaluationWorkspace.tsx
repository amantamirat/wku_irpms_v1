'use client';
import { Dropdown } from 'primereact/dropdown';
import { TabPanel, TabView } from 'primereact/tabview';
import { useEffect, useState } from "react";
import ProjectStageManager from "../../projects/stages/components/ProjectStageManager";
import { GrantAllocationApi } from "../allocations/api/grant.allocation.api";
import { allocationOptionTemplate, getAllocationLabel } from "../allocations/components/AllocationTempletes";
import { GrantAllocation } from "../allocations/models/grant.allocation.model";
import { GrantStageApi } from "../stages/api/grant.stage.api";
import { GrantStage } from "../stages/models/grant.stage.model";

const GrantEvaluationWorkspace = () => {
    const [allocations, setAllocations] = useState<GrantAllocation[]>([]);
    const [selectedAlloc, setSelectedAlloc] = useState<GrantAllocation | null>(null);
    const [grantStages, setGrantStages] = useState<GrantStage[]>([]);
    const [activeIndex, setActiveIndex] = useState(0);

    useEffect(() => {
        const fetchAlloc = async () => {
            const data = await GrantAllocationApi.getAll({ populate: true });
            setAllocations(data);
            if (data && data.length > 0) setSelectedAlloc(data[0]);
        };
        fetchAlloc();
    }, []);

    useEffect(() => {
        if (selectedAlloc) {
            const fetchStages = async () => {
                const data = await GrantStageApi.getAll({ grant: selectedAlloc.grant });
                setGrantStages(data);
                setActiveIndex(0);
            };
            fetchStages();
        }
    }, [selectedAlloc]);

    return (
        <div className="p-3 md:p-4 surface-ground" style={{ minHeight: 'calc(100vh - 9rem)' }}>

            {/* TOP BAR */}
            <div className="bg-white shadow-2 border-round p-3 mb-4 flex flex-column md:flex-row md:align-items-center md:justify-content-between gap-3">

                <div>
                    <h2 className="m-0 text-900 font-bold text-xl">Grant Evaluation Workspace</h2>
                    <span className="text-600 text-sm">Manage evaluation stages and scoring</span>
                </div>

                <div className="w-full md:w-20rem">
                    <Dropdown
                        value={selectedAlloc}
                        options={allocations}
                        onChange={(e) => setSelectedAlloc(e.value)}
                        itemTemplate={allocationOptionTemplate}
                        optionLabel="grant.title"
                        placeholder="Select Grant Allocation"
                        className="w-full"
                        showClear
                    />
                </div>
            </div>

            {/* CONTENT */}
            <div className="bg-white shadow-2 border-round p-3 md:p-4">

                {selectedAlloc ? (
                    grantStages.length > 0 ? (
                        <div className="flex flex-column">

                            <div className="mb-4">
                                <h4 className="m-0 font-semibold text-900">
                                    {getAllocationLabel(selectedAlloc)}
                                </h4>
                            </div>

                            <div className="overflow-x-auto">
                                <TabView
                                    activeIndex={activeIndex}
                                    onTabChange={(e) => setActiveIndex(e.index)}
                                    scrollable
                                >
                                    {grantStages.map((stage) => (
                                        <TabPanel
                                            key={stage._id}
                                            header={stage.name}
                                            leftIcon="pi pi-step-forward mr-2"
                                        >
                                            <div className="overflow-x-auto">
                                                <ProjectStageManager
                                                    grantStage={stage}
                                                    grantAllocation={selectedAlloc}
                                                />
                                            </div>
                                        </TabPanel>
                                    ))}
                                </TabView>
                            </div>

                        </div>
                    ) : (
                        <div className="flex flex-column align-items-center justify-content-center py-8 text-center">
                            <i className="pi pi-sitemap text-5xl text-300 mb-3" />
                            <h3 className="text-900 m-0">No Evaluation Stages Defined</h3>
                        </div>
                    )
                ) : (
                    <div className="flex flex-column align-items-center justify-content-center py-8 text-center text-500">
                        <i className="pi pi-folder-open text-4xl mb-3" />
                        <p>Select a Grant Allocation to start evaluation.</p>
                    </div>
                )}

            </div>
        </div>
    );
};

export default GrantEvaluationWorkspace;