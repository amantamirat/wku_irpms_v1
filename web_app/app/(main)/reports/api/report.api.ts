import { ApiClient } from "@/api/ApiClient";
import { OverviewFilterDTO, InstitutionalOverviewDTO } from "../models/overview.model";

const end_point = "/reports";

export const ReportApi = {
    async getOverview(filter?: OverviewFilterDTO): Promise<InstitutionalOverviewDTO> {
        const data = await ApiClient.post(end_point, filter ?? {});
        return data as InstitutionalOverviewDTO;
    }
};