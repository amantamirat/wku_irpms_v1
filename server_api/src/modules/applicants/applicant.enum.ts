import { Unit } from "../organization/organization.enum";

export enum Gender {
  Male = 'Male',
  Female = 'Female'
}

/*
//also used by position
export enum Scope {
  academic = 'Academic',
  supportive = 'Supportive',
  external = 'External',
}
*/

export const applicantUnits = [Unit.Department, Unit.External, Unit.Supportive]

export enum Accessibility {
  Visual = 'Visual',
  Hearing = 'Hearing',
  Mobility = 'Mobility',
  Speech = 'Speech',
  Cognitive = 'Cognitive',
  Other = 'Other'
}