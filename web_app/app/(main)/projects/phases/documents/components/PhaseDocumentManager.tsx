'use client';

import { PhaseDocApi } from "../api/phase.doc.api";
import { FilterPhaseDocOptions, PhaseDocument, PhaseDocumentTypeLabels } from "../model/phase.doc";
import { Phase } from '../../models/phase.model';
import SavePhaseDocument from './SavePhaseDocument';
import { createEntityManager } from "@/components/data-table/createEntityManager";
import { BASE_URL } from "@/api/ApiClient";
import { Tag } from "primereact/tag";

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
                header: "Type",
                field: "type",
                body: (row: PhaseDocument) => {
                    const info = PhaseDocumentTypeLabels[row.type];
                    return (
                        <Tag
                            value={info?.label || row.type}
                            severity="info"
                            style={{ fontWeight: 500 }}
                        />
                    );
                }
            },
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
                            <i className="pi pi-external-link"></i> View Document
                        </a>
                    ) : (
                        <span className="text-400 text-sm italic">No document</span>
                    ),
            },
        ],

        createNew: () => ({
            phase,
            type: '' as any, // default state if needed
        }),

        SaveDialog: SavePhaseDocument,

        permissionPrefix: "phaseDocument",

        hideEditAction:true,

        query: () => ({
            phase: phase,
        }),
    });

    return <Manager />;
};

export default PhaseDocumentManager;