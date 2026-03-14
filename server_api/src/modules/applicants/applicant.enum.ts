import { Unit } from "../../common/constants/enums";


export enum Gender {
  Male = 'Male',
  Female = 'Female'
}

export const applicantUnits = [Unit.department, Unit.external]

export enum Accessibility {
  Visual = 'Visual',
  Hearing = 'Hearing',
  Mobility = 'Mobility',
  Speech = 'Speech',
  Cognitive = 'Cognitive',
  Other = 'Other',
  //Any = '*'
}