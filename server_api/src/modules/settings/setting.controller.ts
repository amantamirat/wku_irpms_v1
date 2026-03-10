import { Request, Response } from 'express';
import { SettingService } from './setting.service';
import { SettingKey } from './setting.model';
import { UpdateSettingDto } from './setting.dto';
import { errorResponse, successResponse } from '../../common/helpers/response';


export class SettingController {
    
    constructor(private readonly service: SettingService) { }

    getAllSettings = async (req: Request, res: Response) => {
        try {
            const settings = await this.service.getAllSettings();
            successResponse(res, 200, 'Settings fetched successfully', settings);
        } catch (err: any) {
            errorResponse(res, 400, err.message, err);
        }
    }


    update = async (req: Request, res: Response) => {
        try {
            const { key } = req.params;
            const dto: UpdateSettingDto = req.body;

            // Validate Key
            if (!Object.values(SettingKey).includes(key as SettingKey)) {
                return errorResponse(res, 400, `Invalid setting key: ${key}`);
            }

            const updated = await this.service.update(key as SettingKey, dto);

            successResponse(res, 200, 'Setting updated successfully', updated);
        } catch (err: any) {
            // Catches the business logic errors (like file size out of range)
            errorResponse(res, 400, err.message, err);
        }
    }
}