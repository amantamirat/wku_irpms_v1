import { Constraint } from "../models/constraint.model";
import { ConstraintApi } from "../api/constraint.api";
import SaveConstraint from "./SaveConstraint";
import { ConstraintView } from "./ConstraintView";
import { etbCurrencyFormatter } from "@/utils/utils";
import { formatRange } from "@/types/range";
import { createEntityManager } from "@/components/data-table/createEntityManager";

const ConstraintManager = () => {
    const Manager = createEntityManager<Constraint, undefined>({
        title: "Project Constraints",
        itemName: "Constraint Profile",
        api: ConstraintApi,
        columns: [
            {
                field: "name",
                header: "Profile Name",
                sortable: true,
                body: (rowData: Constraint) => (
                    <div>
                        <div className="font-medium text-900">{rowData.name}</div>
                        {rowData.description && (
                            <small className="text-500">{rowData.description}</small>
                        )}
                    </div>
                ),
            },
            {
                header: "Budget Range",
                body: (rowData: Constraint) =>
                    formatRange(
                        rowData.budget,
                        etbCurrencyFormatter.format.bind(etbCurrencyFormatter)
                    ),
            },
            {
                header: "Duration (Days)",
                body: (rowData: Constraint) =>
                    formatRange(rowData.duration, (val) => `${val} days`),
            },
            {
                header: "Participants",
                body: (rowData: Constraint) => formatRange(rowData.participants),
            },
        ],
        createNew: () => ({
            name: "",
            description: "",
        }),
        expandable: {
            template: (con) => <ConstraintView constraint={con} />,
        },
        SaveDialog: SaveConstraint,
        permissionPrefix: "constraint",
    });

    return (
        <div className="card border-none p-0">
            <Manager />
        </div>
    );
};

export default ConstraintManager;