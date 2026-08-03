import { createEntityManager } from "@/components/createEntityManager";
import { Constraint } from "../models/constraint.model";
import { ConstraintApi } from "../api/constraint.api";
import SaveConstraint from "./SaveConstraint";
import { ConstraintView } from "./ConstraintView";

const formatCurrency = (value?: number) => {
    if (value == null) return "N/A";
    return new Intl.NumberFormat('en-ET', {
        style: 'currency',
        currency: 'ETB',
        maximumFractionDigits: 0
    }).format(value);
};

const ConstraintManager = () => {
    const Manager = createEntityManager<Constraint, undefined>({
        title: "Project Constraints",
        itemName: "Constraint Profile",
        api: ConstraintApi,
        columns: [
            {
                field: 'name',
                header: 'Profile Name',
                sortable: true,
                body: (rowData: Constraint) => (
                    <div>
                        <div className="font-medium text-900">{rowData.name}</div>
                        {rowData.description && (
                            <small className="text-500">{rowData.description}</small>
                        )}
                    </div>
                )
            },
            {
                header: 'Budget Range',
                body: (rowData: Constraint) => {
                    if (rowData.minBudget == null && rowData.maxBudget == null) {
                        return <span className="text-500">-</span>;
                    }
                    return `${formatCurrency(rowData.minBudget)} - ${formatCurrency(rowData.maxBudget)}`;
                }
            },
            {
                header: 'Duration (Days)',
                body: (rowData: Constraint) => {
                    if (rowData.minDuration == null && rowData.maxDuration == null) {
                        return <span className="text-500">-</span>;
                    }
                    return `${rowData.minDuration ?? 0} - ${rowData.maxDuration ?? '∞'} days`;
                }
            },
            {
                header: 'Participants',
                body: (rowData: Constraint) => {
                    if (rowData.minParticipants == null && rowData.maxParticipants == null) {
                        return <span className="text-500">-</span>;
                    }
                    return `${rowData.minParticipants ?? 0} - ${rowData.maxParticipants ?? '∞'}`;
                }
            }
        ],
        createNew: () => ({
            name: '',
            description: ''
        }),
        expandable: {
            template: (con) => (
                <ConstraintView constraint={con} />
            )
        },
        SaveDialog: SaveConstraint,
        permissionPrefix: "constraint"
    });

    return (
        <div className="card border-none p-0">
            <Manager />
        </div>
    );
};

export default ConstraintManager;