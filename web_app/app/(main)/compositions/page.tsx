'use client';

import React from "react";
import { TabView, TabPanel } from "primereact/tabview";
import { createEntityManager } from "@/components/createEntityManager";

// APIs
import { CompositionApi } from "./api/composition.api";
import { ProfileApi } from "./api/profile.api";
import { HistoryApi } from "./api/history.api";
import { MemberRequirementApi } from "./api/requirement.api";

// Save Dialogs
import SaveComposition from "./components/SaveComposition";
import SaveProfile from "./components/SaveProfile";
import SaveHistory from "./components/SaveHistory";
import SaveRequirement from "./components/SaveRequirement";

// Models
import { Composition } from "./models/composition.model";
import { HistoryRule } from "./models/history.model";
import { EligibilityProfile } from "./models/profile.model";
import { MemberRequirement } from "./models/requirement.model";
import { HistoryRuleView } from "./components/HistoryRuleView";
import { EligibilityProfileView } from "./components/EligibilityProfileView";
import { MemberRequirementView } from "./components/MemberRequirementView";

// --- Helpers for Compositions Tab ---
const renderEntityName = (
    entity?: string | EligibilityProfile | HistoryRule,
    fallback = "None"
) => {
    if (!entity) return <span style={{ color: "var(--text-color-secondary)" }}>{fallback}</span>;
    if (typeof entity === "object" && entity.name) {
        return <span style={{ fontWeight: 500 }}>{entity.name}</span>;
    }
    return <span style={{ fontSize: "0.85rem", opacity: 0.85 }}>{String(entity)}</span>;
};

const renderMemberRequirements = (requirements?: string[] | MemberRequirement[]) => {
    if (!requirements || requirements.length === 0) {
        return <span style={{ color: "var(--text-color-secondary)" }}>No member rules set</span>;
    }

    const count = requirements.length;
    const names = requirements
        .map((req) => (typeof req === "object" ? req.name : null))
        .filter(Boolean);

    return (
        <div>
            <span
                style={{
                    fontSize: "0.8rem",
                    backgroundColor: "var(--primary-color)",
                    color: "var(--primary-color-text)",
                    padding: "2px 8px",
                    borderRadius: "12px",
                    fontWeight: 600,
                    marginRight: "6px"
                }}
            >
                {count} Rule{count > 1 ? "s" : ""}
            </span>
            {names.length > 0 && (
                <span style={{ fontSize: "0.85rem", color: "var(--text-color-secondary)" }}>
                    ({names.join(", ")})
                </span>
            )}
        </div>
    );
};

// --- Sub-Entity Managers ---

// 1. Compositions Manager Component
const CompositionsTab = createEntityManager<Composition>({
    title: "Team Composition Rules",
    itemName: "Composition Spec",
    api: CompositionApi,
    columns: [
        {
            field: "name",
            header: "Composition Name",
            sortable: true,
            body: (rowData: Composition) => (
                <div>
                    <div style={{ fontWeight: 600 }}>{rowData.name}</div>
                    {rowData.description && (
                        <small style={{ color: "var(--text-color-secondary)" }}>{rowData.description}</small>
                    )}
                </div>
            )
        },
        {
            field: "leadProfileRule",
            header: "Lead Profile Rule",
            body: (rowData: Composition) => renderEntityName(rowData.leadProfileRule)
        },
        {
            field: "leadHistoryRule",
            header: "Lead History Rule",
            body: (rowData: Composition) => renderEntityName(rowData.leadHistoryRule)
        },
        {
            field: "memberRequirements",
            header: "Member Requirements",
            body: (rowData: Composition) => renderMemberRequirements(rowData.memberRequirements)
        }
    ],
    createNew: () => ({ name: "", description: "", memberRequirements: [] }),
    query: () => undefined,
    SaveDialog: SaveComposition,
    permissionPrefix: "composition"
});

// 2. Eligibility Profiles Manager Component
const ProfilesTab = createEntityManager<EligibilityProfile>({
    title: "Eligibility Demographics Profiles",
    itemName: "Profile Criteria",
    api: ProfileApi,
    columns: [
        {
            field: "name",
            header: "Profile Name",
            sortable: true,
            body: (rowData: EligibilityProfile) => (
                <div>
                    <div style={{ fontWeight: 600 }}>{rowData.name}</div>
                    {rowData.description && (
                        <small style={{ color: "var(--text-color-secondary)" }}>{rowData.description}</small>
                    )}
                </div>
            )
        },
        {
            field: "gender",
            header: "Gender Target",
            body: (rowData: EligibilityProfile) => rowData.gender || "Any"
        },
        {
            field: "academicLevels",
            header: "Academic Levels",
            body: (rowData: EligibilityProfile) => rowData.academicLevels?.join(", ") || "Any"
        }
    ],
    createNew: () => ({ name: "", description: "" }),
    query: () => undefined,
    SaveDialog: SaveProfile,
    expandable: {
        template: (profile) => (
            <EligibilityProfileView profile={profile} />
        )
    },
    permissionPrefix: "composition"
});

// 3. History Rules Manager Component
const HistoryTab = createEntityManager<HistoryRule>({
    title: "Project History & Performance Rules",
    itemName: "History Rule",
    api: HistoryApi,
    columns: [
        {
            field: "name",
            header: "Rule Name",
            sortable: true,
            body: (rowData: HistoryRule) => (
                <div>
                    <div style={{ fontWeight: 600 }}>{rowData.name}</div>
                    {rowData.description && (
                        <small style={{ color: "var(--text-color-secondary)" }}>{rowData.description}</small>
                    )}
                </div>
            )
        }
    ],
    createNew: () => ({ name: "", description: "" }),
    query: () => undefined,
    SaveDialog: SaveHistory,
    expandable: {
        template: (hist) => (
            <HistoryRuleView historyRule={hist} />
        )
    },
    permissionPrefix: "composition"
});

// 4. Member Requirements Manager Component
const RequirementsTab = createEntityManager<MemberRequirement>({
    title: "Member Requirements & Aggregation Rules",
    itemName: "Member Requirement",
    api: MemberRequirementApi,
    columns: [
        {
            field: "name",
            header: "Requirement Name",
            sortable: true,
            body: (rowData: MemberRequirement) => (
                <div>
                    <div style={{ fontWeight: 600 }}>{rowData.name}</div>
                    {rowData.description && (
                        <small style={{ color: "var(--text-color-secondary)" }}>{rowData.description}</small>
                    )}
                </div>
            )
        },
        {
            field: "mode",
            header: "Mode",
            sortable: true,
            body: (rowData: MemberRequirement) => (
                <span
                    style={{
                        fontSize: "0.85rem",
                        backgroundColor: "var(--surface-b)",
                        padding: "2px 8px",
                        borderRadius: "4px"
                    }}
                >
                    {rowData.mode}
                </span>
            )
        },
        {
            field: "threshold",
            header: "Threshold Target",
            body: (rowData: MemberRequirement) =>
                rowData.threshold
                    ? `${rowData.threshold.min} - ${rowData.threshold.max === Infinity ? "∞" : rowData.threshold.max}`
                    : "N/A"
        }
    ],
    createNew: () => ({
        name: "",
        description: "",
        mode: "COUNT" as any,
        threshold: { min: 0, max: Infinity }
    }),
    query: () => undefined,
    SaveDialog: SaveRequirement,
    expandable: {
        template: (requirement) => (
            <MemberRequirementView requirement={requirement} />
        )
    },
    permissionPrefix: "composition"
});

// --- Master Single Page Hub ---
const Page = () => {
    return (
        <div className="card p-3">
            <h3 className="text-xl font-bold mb-4">Team Composition & Evaluation Engine</h3>

            <TabView>
                <TabPanel header="Compositions" leftIcon="pi pi-sitemap mr-2">
                    <CompositionsTab />
                </TabPanel>

                <TabPanel header="Member Requirements" leftIcon="pi pi-users mr-2">
                    <RequirementsTab />
                </TabPanel>

                <TabPanel header="Demographic Profiles" leftIcon="pi pi-id-card mr-2">
                    <ProfilesTab />
                </TabPanel>

                <TabPanel header="History Rules" leftIcon="pi pi-history mr-2">
                    <HistoryTab />
                </TabPanel>
            </TabView>
        </div>
    );
};

export default Page;