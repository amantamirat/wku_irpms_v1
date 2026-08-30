import { ThematicLevel } from "./thematic.enum";
import { ThematicStatus } from "./thematic.state-machine";

export interface CreateThematicDTO {
    title: string;
    level: ThematicLevel;
    description?: string;
    status?:ThematicStatus;
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

export interface FilterThematicsDTO {
    title?: string;
    level?:ThematicLevel;
    status?: ThematicStatus;
}
