import { EntityApi } from "@/api/EntityApi";
import { ApiClient } from "@/api/ApiClient";
import { sanitize } from "@/utils/utils";
import { FilterPhaseDocOptions, PhaseDocument } from "../model/phase.doc";

const end_point = "/project/phase/documents";

export const PhaseDocApi: EntityApi<PhaseDocument, FilterPhaseDocOptions> = {

    async getAll(options) {
        return ApiClient.get(end_point, options);
    },

    async create(phaseDoc) {
        const sanitized = sanitize(phaseDoc);

        const formData = new FormData();

        formData.append("phase", sanitized.phase as string);

        if (sanitized.description) {
            formData.append("description", sanitized.description);
        }

        if (phaseDoc.file) {
            formData.append("document", phaseDoc.file);
        }

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

    async delete(phaseDoc) {
        if (!phaseDoc._id) {
            throw new Error("_id required");
        }

        return ApiClient.delete(`${end_point}/${phaseDoc._id}`);
    }
};