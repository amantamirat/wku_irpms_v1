'use client';

import React from 'react';
import { createEntityManager } from "@/components/createEntityManager";
import { PhaseDocApi } from "../api/phase.doc.api";
import { FilterPhaseDocOptions, PhaseDocument } from "../model/phase.doc";
import { Phase } from '../../models/phase.model';
import SavePhaseDocument from './SavePhaseDocument';


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
                            href={row.documentPath}
                            target="_blank"
                            rel="noopener noreferrer"
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

        permissionPrefix: "phase-document",

        query: () => ({
            phase: phase,
        }),
    });

    return <Manager />;
};

export default PhaseDocumentManager;