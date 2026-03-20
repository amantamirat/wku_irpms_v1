import { ThemeLevel } from "./thematic.enum";
import { ThematicStatus } from "./thematic.state-machine";

export interface CreateThematicDTO {
    title: string;
    level: ThemeLevel;
    description?: string;
}

export interface UpdateThematicDTO {
    id: string;
    data: Partial<{
        title: string;
        description: string;
        status: ThematicStatus;
    }>;
    userId?: string;
}

export interface GetThematicsDTO {
    status: ThematicStatus;
}
