import { COLLECTIONS } from "../../../../enums/collections.enum";

export enum CollaboratorRole {
  CO_PI = "CO_PI",  
  ASSISTANT = "ASSISTANT",
  //INVESTIGATOR = "INVESTIGATOR",
  //ADVISOR = "ADVISOR",
  //COMMUNITY_PARTNER = "COMMUNITY_PARTNER",
}

export enum AssignmentType {
  THEME = COLLECTIONS.PROJECT_THEMEM,
  PHASE = COLLECTIONS.PHASE
}