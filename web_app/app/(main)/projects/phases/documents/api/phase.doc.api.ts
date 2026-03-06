import { ApiClient } from "@/api/ApiClient";
import { GetPhaseDocOptions, PhaseDocument, sanitize } from "../model/phase.doc";

const end_point = '/project/phase/documents';

export const PhaseDocApi = {

    async getPhaseDocs(options: GetPhaseDocOptions): Promise<PhaseDocument[]> {
        const query = new URLSearchParams();
        const santized = sanitize(options);
        if (options.phase) query.append("phase", santized.phase as string);
        const data = await ApiClient.get(`${end_point}?${query.toString()}`);
        return data;
    },

    async create(phaseDoc: Partial<PhaseDocument>): Promise<PhaseDocument> {

        const sanitized = sanitize(phaseDoc);

        const formData = new FormData();

        formData.append("phase", sanitized.phase as string);

        if (sanitized.description) {
            formData.append("description", sanitized.description);
        }

        if (phaseDoc.file) {
            formData.append("document", phaseDoc.file);
        }

        const created = await ApiClient.post(end_point, formData);

        return created;
    },

    async delete(phaseDoc: Partial<PhaseDocument>): Promise<boolean> {
        if (!phaseDoc._id) throw new Error("_id required.");
        const url = `${end_point}/${phaseDoc._id}`;
        const deleted = await ApiClient.delete(url);
        return deleted;
    },
};
