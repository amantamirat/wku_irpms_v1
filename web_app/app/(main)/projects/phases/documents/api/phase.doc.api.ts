import { ApiClient } from "@/api/ApiClient";
import { GetPhaseDocOptions, PhaseDocument } from "../model/phase.doc";

const end_point = '/project/phase/documents';

export const PhaseDocApi = {

    async getPhaseDocs(options: GetPhaseDocOptions): Promise<PhaseDocument[]> {
        const query = new URLSearchParams();
        //const santized = sanitizePhaseDoc(options);
        if (options.phase) query.append("phase", options.phase as string);
        const data = await ApiClient.get(`${end_point}?${query.toString()}`);
        return data;
    },

    async create(phaseDoc: Partial<PhaseDocument>): Promise<PhaseDocument> {
        //const santized = sanitizePhaseDoc(projectTheme);
        const created = await ApiClient.post(end_point, phaseDoc);
        return created;
    },

    async delete(phaseDoc: Partial<PhaseDocument>): Promise<boolean> {
        if (!phaseDoc._id) throw new Error("_id required.");
        const url = `${end_point}/${phaseDoc._id}`;
        const deleted = await ApiClient.delete(url);
        return deleted;
    },
};
