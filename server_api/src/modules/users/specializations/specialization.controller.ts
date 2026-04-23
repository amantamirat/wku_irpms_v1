import { Request, Response } from 'express';
import { SpecializationService } from './specialization.service';
import { CreateSpecializationDTO, UpdateSpecializationDTO } from './specialization.dto';
import { errorResponse, successResponse } from '../../../common/helpers/response';

export class SpecializationController {

    private service: SpecializationService;

    constructor(service?: SpecializationService) {
        this.service = service || new SpecializationService();
    }

    create = async (req: Request, res: Response) => {
        try {
            const data: CreateSpecializationDTO = req.body;
            const specialization = await this.service.create(data);
            successResponse(res, 201, "Specialization created successfully", specialization);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }

    get = async (req: Request, res: Response) => {
        try {
            const specializations = await this.service.getAll();
            successResponse(res, 200, 'Specializations fetched successfully', specializations);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }

    update = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const { name, academicLevel } = req.body;

            const dto: UpdateSpecializationDTO = {
                id,
                data: { name, academicLevel },
            };

            const updated = await this.service.update(dto);
            successResponse(res, 200, "Specialization updated successfully", updated);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }

    delete = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;
            const deleted = await this.service.delete(id);
            successResponse(res, 200, "Specialization deleted successfully", deleted);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }
}
