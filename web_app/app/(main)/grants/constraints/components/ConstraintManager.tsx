import { createEntityManager } from "@/components/createEntityManager";
import { Constraint, GetConstraintsOptions } from "../models/constraint.model";

import { ConstraintApi } from "../api/constraint.api";
import { Grant } from "../../models/grant.model";
import SaveConstraint from "./SaveConstraint";

interface ConstraintManagerProps {
    grant: string | Grant;
}
const ConstraintManager = ({ grant }: ConstraintManagerProps) => {
    const Manager = createEntityManager<Constraint, GetConstraintsOptions | undefined>({
        title: "Manage Constraints",
        itemName: "Constraint",
        api: ConstraintApi,
        columns: [
            { field: 'constraint', header: 'Constraint', sortable: true },
            { field: 'min', header: 'Min', sortable: true },
            { field: 'max', header: 'Max', sortable: true },

        ],
        createNew: () => ({
            grant: grant
        }),
        query: () => ({
            grant: grant,
        }),
        SaveDialog: SaveConstraint,
        permissionPrefix: "constraint"
    });
    return <Manager />;
}

export default ConstraintManager;