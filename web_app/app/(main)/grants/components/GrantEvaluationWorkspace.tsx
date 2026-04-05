'use client';
import { ListBox } from 'primereact/listbox';
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
        /* Use flex-column for mobile (stacking) and flex-row for desktop */
        <div className="flex flex-column md:flex-row gap-4 p-2 md:p-4 surface-ground" style={{ minHeight: 'calc(100vh - 9rem)' }}>

            {/* LEFT SIDEBAR: ListBox */}
            <div className="w-full md:w-3 shadow-2 bg-white border-round p-3 flex-shrink-0">
                <h4 className="mb-3 text-primary">Grant Allocations</h4>
                <ListBox
                    value={selectedAlloc}
                    options={allocations}
                    onChange={(e) => setSelectedAlloc(e.value)}
                    itemTemplate={allocationOptionTemplate}
                    optionLabel="grant.title"
                    className="border-none w-full"
                    listStyle={{ maxHeight: '400px' }} // Fixed height on mobile, calc on desktop
                    emptyMessage="No Grant Allocations Found"
                />
            </div>

            {/* RIGHT DETAIL: Content */}
            <div className="w-full md:w-9 bg-white shadow-2 border-round p-3 md:p-4 overflow-hidden flex flex-column">
                {selectedAlloc ? (
                    grantStages.length > 0 ? (
                        <div className="flex flex-column h-full w-full">
                            <div className="mb-4">
                                <h2 className="m-0 font-bold text-900 text-xl md:text-2xl">
                                    {getAllocationLabel(selectedAlloc)}
                                </h2>
                            </div>

                            {/* This container ensures the TabView/Tables can scroll horizontally if needed */}
                            <div className="w-full overflow-x-auto">
                                <TabView
                                    activeIndex={activeIndex}
                                    onTabChange={(e) => setActiveIndex(e.index)}
                                    scrollable
                                    className="w-full"
                                >
                                    {grantStages.map((stage) => (
                                        <TabPanel key={stage._id} header={stage.name} leftIcon="pi pi-step-forward mr-2">
                                            {/* Ensure the manager is wrapped in a scrollable div for large tables */}
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
                        <div className="flex flex-column align-items-center justify-content-center py-8 bg-gray-50 border-round-xl border-1 border-dashed border-300 h-full">
                            <i className="pi pi-sitemap text-6xl text-300 mb-4" />
                            <h3 className="text-900 m-0">No Evaluation Stages Defined</h3>
                        </div>
                    )
                ) : (
                    <div className="flex flex-column align-items-center justify-content-center h-full text-400 py-8">
                        <i className="pi pi-arrow-left text-4xl mb-3" />
                        <p className="font-medium text-center">Select a Grant Budget from the left to start evaluation.</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default GrantEvaluationWorkspace;