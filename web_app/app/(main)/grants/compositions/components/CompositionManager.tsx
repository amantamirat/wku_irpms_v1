import { createEntityManager } from "@/components/createEntityManager";
import { Composition, GetCompositionsOptions, TargetScope, OperationMode } from "../models/composition.model";
import { CompositionApi } from "../api/composition.api";
import { Grant } from "../../models/grant.model";
import SaveComposition from "./SaveComposition";

// Helper component or styling for Scope Badges to make it scannable in PrimeReact
const formatScope = (scope: TargetScope) => {
    switch (scope) {
        case TargetScope.PI_ONLY:
            return { label: "PI Only", style: { color: "var(--blue-600)", fontWeight: "bold" } };
        case TargetScope.CO_ONLY:
            return { label: "Co-PI Only", style: { color: "var(--purple-600)", fontWeight: "bold" } };
        case TargetScope.ALL_MEMBERS:
            return { label: "Every Member", style: { color: "var(--teal-600)", fontWeight: "bold" } };
        case TargetScope.TEAM_AGGREGATE:
            return { label: "Team Aggregate", style: { color: "var(--orange-600)", fontWeight: "bold" } };
        default:
            return { label: scope, style: {} };
    }
};

interface CompositionManagerProps {
    grant: string | Grant;
}

const CompositionManager = ({ grant }: CompositionManagerProps) => {
    const Manager = createEntityManager<Composition, GetCompositionsOptions | undefined>({
        title: "Manage Evaluation Compositions",
        itemName: "Composition Rule",
        api: CompositionApi,
        columns: [
            {
                field: "description",
                header: "Rule Description",
                sortable: true,
                body: (rowData: Composition) => (
                    <span style={{ fontWeight: 500 }}>{rowData.description}</span>
                )
            },
            {
                field: "targetScope",
                header: "Target Scope",
                sortable: true,
                body: (rowData: Composition) => {
                    const config = formatScope(rowData.targetScope);
                    return <span style={config.style}>{config.label}</span>;
                }
            },
            {
                field: "mode",
                header: "Evaluation Mode",
                sortable: true,
                body: (rowData: Composition) => {
                    if (!rowData.mode) return <span style={{ color: "var(--text-color-secondary)" }}>N/A</span>;
                    
                    const isCount = rowData.mode === OperationMode.COUNT;
                    const minVal = rowData.threshold?.min ?? 0;
                    const maxVal = rowData.threshold?.max === Infinity ? "∞" : rowData.threshold?.max;

                    return (
                        <div>
                            <span style={{ fontSize: "0.85rem", textTransform: "lowercase", backgroundColor: "var(--surface-b)", padding: "2px 6px", borderRadius: "4px", marginRight: "6px" }}>
                                {rowData.mode}
                            </span>
                            <span style={{ fontSize: "0.9rem" }}>
                                ({minVal} - {maxVal})
                            </span>
                        </div>
                    );
                }
            }
        ],
        createNew: () => ({
            grant: grant,
            description: "",
            targetScope: TargetScope.TEAM_AGGREGATE, // Sane default
            threshold: { min: 0, max: Infinity }    // Standard range defaults
        }),
        query: () => ({
            grant: grant,
        }),
        SaveDialog: SaveComposition,
        permissionPrefix: "composition"
    });

    return <Manager />;
}

export default CompositionManager;