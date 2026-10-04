'use client';

import { useAuth } from "@/contexts/auth-context";
import MyBadge from "@/templates/MyBadge";
import { etbCurrencyFormatter } from "@/utils/utils";
import { format } from "date-fns";
import { TabPanel, TabView } from "primereact/tabview";
import PhaseDocManager from "../documents/components/PhaseDocumentManager";
import PhaseActivityManager from "../activities/components/PhaseActivityManager";
import { Phase } from "../models/phase.model";
import { StatusHistoryWidget } from "@/components/StatusHistoryWidget";
import PhaseEquipmentManager from "../equipments/components/PhaseEquipmentManager";

interface PhaseDetailProps {
    phase: Phase;
}

export default function PhaseDetail({ phase }: PhaseDetailProps) {
    const { hasPermission } = useAuth();

    /**
     * Safely extract project title whether it's populated or an ObjectId string
     */
    const projectTitle =
        typeof phase.project === 'object' && phase.project !== null && 'title' in phase.project
            ? (phase.project as any).title
            : 'N/A';

    // Tab Configuration including Equipment tab with 'phaseEquipment:read' permission
    const tabs = [
        {
            header: "Activities",
            icon: "pi pi-list",
            permission: ["phaseActivity:read", "phaseActivity:lookup"],
            content: <PhaseActivityManager phase={phase} />
        },
        {
            header: "Equipment",
            icon: "pi pi-box",
            permission: ["phaseEquipment:read", "phaseActivity:lookup"],
            content: <PhaseEquipmentManager phase={phase} />
        },
        {
            header: "Documents",
            icon: "pi pi-file",
            permission: ["phaseDocument:read", "phaseDocument:lookup"],
            content: <PhaseDocManager phase={phase} />
        },
        {
            header: "Status History",
            icon: "pi pi-history",
            permission: ["phase:read"],
            content: <StatusHistoryWidget history={phase.statusHistory} />
        }
    ];

    const allowedTabs = tabs.filter(tab => hasPermission(tab.permission));

    return (
        <div className="surface-card border-round p-3 shadow-1">
            {/* Header Section matching your ProjectDetail layout */}
            <div className="flex flex-column md:flex-row md:justify-content-between md:align-items-center gap-3 pb-3 border-bottom-1 surface-border">
                <div className="flex-1">
                    <span className="block text-xs font-bold text-primary uppercase tracking-wider mb-1">
                        Project: {projectTitle}
                    </span>
                    <h1 className="text-xl md:text-2xl font-bold m-0 mb-2 text-900">
                        Phase {phase.order}
                    </h1>
                    {phase.description && (
                        <p className="text-600 text-sm m-0 line-height-3">
                            {phase.description}
                        </p>
                    )}
                </div>
                <div className="flex align-items-center gap-3">
                    <MyBadge type="status" value={phase.status ?? 'proposed'} />
                </div>
            </div>

            {/* Metrics Cards matching your ProjectDetail style */}
            <div className="grid mt-4 mb-4 gap-3 md:gap-0">
                <div className="col-12 sm:col-6 md:col-4 p-2">
                    <div className="p-3 surface-100 border-round border-left-3 border-green-500 h-full">
                        <span className="block text-500 text-xs font-bold mb-1 uppercase">Budget Allocation</span>
                        <div className="text-xl font-bold text-900">{etbCurrencyFormatter.format(phase.budget ?? 0)}</div>
                    </div>
                </div>
                <div className="col-12 sm:col-6 md:col-4 p-2">
                    <div className="p-3 surface-100 border-round border-left-3 border-blue-500 h-full">
                        <span className="block text-500 text-xs font-bold mb-1 uppercase">Duration</span>
                        <div className="text-xl font-bold text-900">{phase.duration} Days</div>
                    </div>
                </div>
                {phase.createdAt && (
                    <div className="col-12 sm:col-6 md:col-4 p-2">
                        <div className="p-3 surface-100 border-round h-full">
                            <span className="block text-500 text-xs font-bold mb-1 uppercase">Created On</span>
                            <div className="text-sm font-bold text-900 pt-1">
                                {format(new Date(phase.createdAt), 'PPP')}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Tabs matching your standard TabView pattern */}
            <TabView className="mt-2" renderActiveOnly={true}>
                {allowedTabs.map((tab) => (
                    <TabPanel key={tab.header} header={tab.header} leftIcon={tab.icon + " mr-2"}>
                        <div className="pt-4">
                            {tab.content}
                        </div>
                    </TabPanel>
                ))}
            </TabView>
        </div>
    );
}