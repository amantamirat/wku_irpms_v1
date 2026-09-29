'use client';


import { PhaseDocApi } from "../api/phase.doc.api";
import { FilterPhaseDocOptions, PhaseDocument } from "../model/phase.doc";
import { Phase } from '../../models/phase.model';
import SavePhaseDocument from './SavePhaseDocument';
import { createEntityManager } from "@/components/data-table/createEntityManager";
import { BASE_URL } from "@/api/ApiClient";

interface PhaseDocumentManagerProps {
    phase: Phase;
}

const PhaseDocumentManager = ({ phase }: PhaseDocumentManagerProps) => {

    const Manager = createEntityManager<
        PhaseDocument,
        FilterPhaseDocOptions
    >({
        title: `Documents for ${phase.title}`,
        itemName: "Phase Document",

        api: PhaseDocApi,

        columns: [
            {
                header: "Description",
                field: "description",
            },
            {
                header: "Document",
                field: "documentPath",
                body: (row: PhaseDocument) =>
                    row.documentPath ? (
                        <a
                            href={`${BASE_URL}/uploads/${row.documentPath.replace(
                                /^\\/,
                                ''
                            )}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline"
                        >
                            View Document
                        </a>
                    ) : (
                        "No document"
                    ),
            },
        ],

        createNew: () => ({
            phase,
        }),

        SaveDialog: SavePhaseDocument,

        permissionPrefix: "phaseDocument",

        query: () => ({
            phase: phase,
        }),
    });

    return <Manager />;
};

export default PhaseDocumentManager;