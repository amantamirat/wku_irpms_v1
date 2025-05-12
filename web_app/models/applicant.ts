import { Department } from "./department";
import { Institute } from "./institute";
import { Position } from "./position";
import { Rank } from "./rank";

export enum Gender {
    Male = 'Male',
    Female = 'Female'
}

export type Applicant = {
    first_name: string;
    middle_name?: string;
    last_name: string;
    birth_date: Date;
    gender: Gender;
    department?: string | Department;
    position?: string | Position;
    rank?: string | Rank;
    hire_date?: Date;
    institute?: string | Institute;
    is_external?: boolean;
    createdAt?: Date;
    updatedAt?: Date;
}