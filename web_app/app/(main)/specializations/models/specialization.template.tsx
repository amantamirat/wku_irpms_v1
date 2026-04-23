import { Specialization } from "./specialization.model";

export const specializationTemplate = (spec?: Specialization) => {
    if (!spec) return null;
    return (
        <span>
            {spec.name} {spec.academicLevel ? `(${spec.academicLevel})` : ""}
        </span>
    );
};