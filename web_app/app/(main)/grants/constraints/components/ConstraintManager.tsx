import { createEntityManager } from "@/components/createEntityManager";
import { Constraint, GetConstraintsOptions, ProjectConstraintType } from "../models/constraint.model";
import { ConstraintApi } from "../api/constraint.api";
import { Grant } from "../../models/grant.model";
import SaveConstraint from "./SaveConstraint";
import { constraintUIMap } from "../models/constraint.config";


interface ConstraintManagerProps {
    grant: string | Grant;
}

const ConstraintManager = ({ grant }: ConstraintManagerProps) => {
    const Manager = createEntityManager<Constraint, GetConstraintsOptions | undefined>({
        title: "Project Constraints",
        itemName: "Constraint",
        api: ConstraintApi,
        columns: [
            { 
                field: 'constraint', 
                header: 'Type', 
                sortable: true,
                body: (rowData: Constraint) => {
                    const config = constraintUIMap[rowData.constraint as ProjectConstraintType];
                    return (
                        <div className="flex align-items-center">
                            <i className={`${config?.icon} mr-2 text-primary`} />
                            <span className="font-medium">{config?.label || rowData.constraint}</span>
                        </div>
                    );
                }
            },
            {
                header: 'Range / Requirement',
                body: (rowData: Constraint) => {
                    const config = constraintUIMap[rowData.constraint as ProjectConstraintType];
                    if (config?.format) {
                        return config.format(rowData.min, rowData.max);
                    }
                    return <span className="text-500">Fixed Requirement</span>;
                }
            }
        ],
        createNew: () => ({
            grant: typeof grant === 'string' ? grant : grant._id,
            constraint: ProjectConstraintType.PARTICIPANT, // Default type
            min: 0,
            max: 0
        }),
        query: () => ({
            grant: typeof grant === 'string' ? grant : grant._id,
        }),
        SaveDialog: SaveConstraint,
        permissionPrefix: "constraint"
    });

    return (
        <div className="card border-none p-0">
            <Manager />
        </div>
    );
}

export default ConstraintManager;