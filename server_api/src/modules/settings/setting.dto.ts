import { SettingKey } from "./setting.model";

export interface UpdateSettingDto {
    key: SettingKey; 
    value: any;     
    description?: string;
}