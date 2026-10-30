import { EntityApi, StateTransition } from "@/api/EntityApi";
import { ApiClient } from "@/api/ApiClient";
import { sanitize } from "@/utils/utils";
import { FilterPhaseDocumentOptions, ProjectDocument } from "../model/phase.doc";

const end_point = "/project/phase/documents";

export const PhaseDocumentApi: EntityApi<ProjectDocument, FilterPhaseDocumentOptions> = {

    async getAll(filter) {
        return ApiClient.get(end_point, filter);
    },

    async lookup(filter) {
        return ApiClient.get(`${end_point}/lookup`, filter);
    },

    async create(phaseDoc: Partial<ProjectDocument>): Promise<any> {
        const formData = new FormData();

        // 1. Append the real file directly from phaseDoc if it exists
        if (phaseDoc.file) {
            formData.append("file", phaseDoc.file);
        }

        // 2. Separate the file out so sanitize only runs on text/metadata fields
        const { file, ...phaseWithoutFile } = phaseDoc;
        const sanitized = sanitize(phaseWithoutFile);

        // 3. Wrap the clean metadata into a JSON string
        formData.append("phaseDoc", JSON.stringify(sanitized));

        return ApiClient.post(end_point, formData);
    },

    async update(phaseDoc) {
        if (!phaseDoc._id) {
            throw new Error("_id required");
        }

        // If update also supports file upload, use FormData here.
        return ApiClient.put(
            `${end_point}/${phaseDoc._id}`,
            sanitize(phaseDoc)
        );
    },

    async transitionState(id: string, dto: StateTransition) {
        const url = `${end_point}/${id}`;
        const updated = await ApiClient.patch(url, dto);
        return updated;
    },

    async delete(phaseDoc) {
        if (!phaseDoc._id) {
            throw new Error("_id required");
        }

        return ApiClient.delete(`${end_point}/${phaseDoc._id}`);
    }
};