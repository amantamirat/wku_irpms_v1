import { Request, Response } from 'express';
import { errorResponse, successResponse } from '../../common/helpers/response';
import {
    CreateTemplateDTO,
    UpdateTemplateDTO,
} from './template.dto';
import { TemplateService } from './template.service';


export class TemplateController {

    constructor(private service: TemplateService) { }

    create = async (req: Request, res: Response) => {
        try {
            const dto: CreateTemplateDTO = req.body;

            const template = await this.service.create(dto);

            successResponse(
                res,
                201,
                'Template created successfully',
                template
            );
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    };


    getById = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;

            const template = await this.service.findById(id);

            successResponse(
                res,
                200,
                'Template fetched successfully',
                template
            );
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    };


    get = async (req: Request, res: Response) => {
        try {
            const templates = await this.service.findAll();

            successResponse(
                res,
                200,
                'Templates fetched successfully',
                templates
            );
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    };


    update = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;

            const dto: UpdateTemplateDTO = req.body;

            const updated = await this.service.update(id, dto);

            successResponse(
                res,
                200,
                'Template updated successfully',
                updated
            );
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    };


    delete = async (req: Request, res: Response) => {
        try {
            const { id } = req.params;

            const deleted = await this.service.delete(id);

            successResponse(
                res,
                200,
                'Template deleted successfully',
                deleted
            );
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    };

}