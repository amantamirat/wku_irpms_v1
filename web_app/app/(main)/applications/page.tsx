'use client';

import { CallApi } from '@/app/(main)/calls/api/call.api';
import { Call, CallStatus } from '@/app/(main)/calls/models/call.model';
import { StageApi } from '@/app/(main)/calls/stages/api/stage.api';
import { Stage } from '@/app/(main)/calls/stages/models/stage.model';
import { Dropdown } from 'primereact/dropdown';
import { TabPanel, TabView } from 'primereact/tabview';
import { useEffect, useState } from "react";
import ApplicationManager from './components/ApplicationManager';

const Page = () => {
    const [calls, setCalls] = useState<Call[]>([]);
    const [selectedCall, setSelectedCall] = useState<Call | null>(null);
    const [stages, setStages] = useState<Stage[]>([]);
    const [activeIndex, setActiveIndex] = useState(0);

    useEffect(() => {
        const fetchCalls = async () => {
            const data = await CallApi.getAll({ status: CallStatus.active, populate: true });
            setCalls(data);
            if (data?.length) setSelectedCall(data[0]);
        };
        fetchCalls();
    }, []);

    useEffect(() => {
        if (selectedCall) {
            const fetchStages = async () => {
                const data = await StageApi.getAll({ call: selectedCall });
                setStages(data);
                setActiveIndex(0);
            };
            fetchStages();
        }
    }, [selectedCall]);

    return (
        <div className="p-4 md:p-5 surface-ground min-h-screen">

            {/* HEADER */}
            <div className="mb-4 flex flex-column gap-2">
                <h2 className="text-2xl font-bold text-900 m-0">
                    Applications Management
                </h2>
                <span className="text-600 text-sm">
                    Review, evaluate, and manage project applications efficiently
                </span>
            </div>

            {/* CONTROL PANEL */}
            <div className="border-round-xl shadow-1 p-4 mb-4 flex flex-column md:flex-row md:align-items-end md:justify-content-between gap-4">

                <div className="flex flex-column gap-2">
                    <label className="text-700 font-medium text-sm">
                        Select Call Source
                    </label>

                    <Dropdown
                        value={selectedCall}
                        options={calls}
                        onChange={(e) => setSelectedCall(e.value)}
                        optionLabel="title"
                        placeholder="Choose call..."
                        className="w-full md:w-20rem"
                        showClear
                    />
                </div>

                {selectedCall && (
                    <div className="text-right">
                        <div className="text-900 font-semibold">
                            {selectedCall.title}
                        </div>
                        <div className="text-500 text-sm">
                            Active Workflow
                        </div>
                    </div>
                )}
            </div>

            {/* MAIN CONTENT */}
            <div className="border-round-xl shadow-1 p-4 md:p-5">

                {selectedCall ? (
                    stages.length > 0 ? (
                        <>
                            {/* SECTION TITLE */}
                            <div className="mb-4">
                                <h3 className="m-0 text-lg font-semibold text-900">
                                    Stages
                                </h3>
                                <span className="text-500 text-sm">
                                    Navigate through each stage of call
                                </span>
                            </div>

                            {/* TABS */}
                            <TabView
                                activeIndex={activeIndex}
                                onTabChange={(e) => setActiveIndex(e.index)}
                                scrollable
                                className="custom-tabs"
                            >
                                {stages.map((stage, index) => (
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
                                            <ApplicationManager
                                                stage={stage}
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
                        <h3 className="text-900 m-0">No Call Selected</h3>
                        <p className="text-500 mt-2">
                            Choose a call to begin managing workflow stages.
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Page;