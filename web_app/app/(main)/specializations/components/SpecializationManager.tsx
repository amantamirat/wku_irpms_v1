'use client';

import { createEntityManager } from "@/components/createEntityManager";
import { SpecializationApi } from "../api/specialization.api";
import { Specialization } from "../models/specialization.model";
import SaveSpecialization from "./SaveSpecialization";



const SpecializationManager = () => {

    const Manager = createEntityManager<Specialization, undefined>({
        title: "Manage Specializations",
        itemName: "Specialization",
        api: SpecializationApi,
        /** Columns */
        columns: [
            { header: "Name", field: "name", sortable: true, },
            {
                header: "Ac. Level",
                field: "academicLevel",
                sortable: true,
                body: (r: Specialization) => (
                    <span className={`academic-badge level-${r.academicLevel?.toLowerCase()}`}>
                        {r.academicLevel}
                    </span>
                )
            }
        ],
        /** Create empty */
        createNew: () => ({
            name: "",
        }),

        /** Save dialog */
        SaveDialog: SaveSpecialization,
        permissionPrefix: "specialization",
    });

    return <Manager />;
};

export default SpecializationManager;