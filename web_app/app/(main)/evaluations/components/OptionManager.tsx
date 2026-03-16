'use client';
import { createEntityManager } from "@/components/createEntityManager";
import { Option, GetOptionsFilter, createEmptyOption } from "../models/option.model";
import { OptionApi } from "../api/option.api";
import SaveOption from "./SaveOption";
import { Criterion } from "../models/criterion.model";

interface OptionManagerProps {
    criterion: Criterion;
}

const OptionManager = ({ criterion }: OptionManagerProps) => {

    const Manager = createEntityManager<Option, GetOptionsFilter | undefined>({
        title: `Options for: ${criterion.title}`,
        itemName: "Option",
        api: OptionApi,

        // Matches the permission prefix logic in your other managers
        permissionPrefix: "option",

        // Filter results by the specific criterion ID
        query: () => ({
            criterion: criterion._id ?? undefined
        }),

        // Ensure new options are automatically linked to this criterion
        createNew: () => ({
            ...createEmptyOption(),
            criterion: criterion._id ?? ""
        }),

        columns: [
            { header: "Title", field: "title", sortable: true },
            {
                header: "Value / Score",
                field: "score",
                sortable: true,
                body: (row: Option) => <strong>{row.score}</strong>
            },
        ],

        SaveDialog: SaveOption,
    });

    return (
        <div className="p-3 surface-ground border-round shadow-1 my-2">
            <Manager />
        </div>
    );
};

export default OptionManager;