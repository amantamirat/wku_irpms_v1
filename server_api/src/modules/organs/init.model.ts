import { College, Directorate, Office, Position, Sector, Specialization } from "./organization.model";
import { Center, Department, Program, Rank, External } from "./child.organization.model";

export function initializeOrganModels() {
  return {
    College,
    Directorate,
    Office,
    Sector,
    Specialization,
    Position, 
    Department,
    Center, 
    Rank,
    Program,
    External
  };
}