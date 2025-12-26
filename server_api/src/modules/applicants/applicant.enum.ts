import { Unit } from "../organization/organization.type";


export enum Gender {
  Male = 'Male',
  Female = 'Female'
}

export const applicantUnits = [Unit.Department, Unit.External]

export enum Accessibility {
  Visual = 'Visual',
  Hearing = 'Hearing',
  Mobility = 'Mobility',
  Speech = 'Speech',
  Cognitive = 'Cognitive',
  Other = 'Other'
}