'use client';

import { createEntityManager } from "@/components/data-table/createEntityManager";
import { DocumentTemplateApi } from "./api/documentTemplate.api";
import SaveDocumentTemplate from "./components/SaveDocumentTemplate";
import { createEmptyDocumentTemplate, IDocumentTemplate } from "./models/documentTemplate.model";
import MyBadge from "@/templates/MyBadge";

export default createEntityManager<IDocumentTemplate>({
    title: "Manage Document Templates",
    itemName: "Document Template",
    api: DocumentTemplateApi,
    columns: [
        { header: "Name", field: "name", sortable: true },
        { header: "Type", field: "type", sortable: true },
        { header: "Engine", field: "engine", sortable: true },
        {
            field: "status",
            header: "Status",
            sortable: true,
            body: (dt: IDocumentTemplate) =>
                <MyBadge type="status" value={dt.status ?? "Unknown"} />
        },
        { header: "Version", field: "version", sortable: true }
    ],
    createNew: () => createEmptyDocumentTemplate(),
    SaveDialog: SaveDocumentTemplate,
    permissionPrefix: "documentTemplate",
    disableEditRow(row) {
        return true;
    },
});