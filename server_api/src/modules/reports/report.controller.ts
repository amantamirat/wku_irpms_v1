import { Request, Response } from 'express';
import { errorResponse, successResponse } from "../../common/helpers/response";
import { OverviewFilterDTO } from "./report.dto";
import { ReportService } from "./report.service";


export class ReportController {

    constructor(private readonly reportService = new ReportService()) { }

    getOverview = async (req: Request, res: Response) => {
        try {
            const filter: OverviewFilterDTO = {
                ...req.body
            };
            const data = await this.reportService.getInstitutionalOverview(filter);
            successResponse(res, 200, "Institutional overview retrieved successfully", data);

        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }
}