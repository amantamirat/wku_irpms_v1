import { createEntityManager } from "@/components/createEntityManager";
import { Composition, GetCompositionsOptions } from "../models/composition.model";

import { CompositionApi } from "../api/composition.api";
import { Grant } from "../../models/grant.model";
import SaveComposition from "./SaveComposition";

interface CompositionManagerProps {
    grant: string | Grant;
}
const CompositionManager = ({ grant }: CompositionManagerProps) => {
    const Manager = createEntityManager<Composition, GetCompositionsOptions | undefined>({
        title: "Manage Compositions",
        itemName: "Composition",
        api: CompositionApi,
        columns: [
            {
                field: "title",
                header: "Title",
                sortable: true,
                body: (rowData: Composition) => (
                    <>
                        {rowData.title}
                        {rowData.isPI && (
                            <span style={{ marginLeft: 8, color: "var(--primary-color)" }}>
                                (PI)
                            </span>
                        )}
                    </>
                )
            }
        ],
        createNew: () => ({
            grant: grant,
            minCount: 1
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