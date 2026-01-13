'use client';

import PhaseManager from "./components/PhaseManager";
import { PhaseType } from "./models/phase.model";

const PhasePage = () => {
    return (
        <PhaseManager phaseType={PhaseType.phase} />
    );
};
export default PhasePage;