import mongoose from 'mongoose';

import { Phase, PhaseStatus } from './phase/phase.model';
import { Project } from './project.model';
import { PhaseActivity, PhaseActivityStatus } from './phase/activities/phase-activity.model';
import { IPhaseRepository } from './phase/phase.repository';
import { IProjectRepository } from './project.repository';
import { IPhaseActivityRepository } from './phase/activities/phase-activity.repository';
/*
export interface IPhaseProgress {
    phaseId: mongoose.Types.ObjectId;

    order: number;
    title: string;
    status: PhaseStatus;

    activityProgress: number;
    costProgress: number;

    totalActivities: number;
    completedActivities: number;

    totalCost: number;
    completedCost: number;
}
*/
export interface IProjectProgress {
    activityProgress: number;
    costProgress: number;
    phaseProgress: number;

    totalActivities: number;
    completedActivities: number;

    totalPhases: number;
    completedPhases: number;

    totalCost: number;
    completedCost: number;

   // phases?: IPhaseProgress[];
}

export class ProjectProgressService {


    constructor(
        private readonly projectRepo: IProjectRepository,
        private readonly phaseRepo: IPhaseRepository,
        private readonly phaseActivityRepo: IPhaseActivityRepository,
    ) { }

    /**
     * Get the overall progress of a project.
     *
     * Progress is calculated from the project's phases and activities.
     *
     * - activityProgress:
     *      completed activities / total valid activities
     *
     * - costProgress:
     *      completed activity cost / total valid activity cost
     *
     * - phaseProgress:
     *      completed phases / total valid phases
     */
    async getProjectProgress(
        projectId: mongoose.Types.ObjectId
    ): Promise<IProjectProgress> {

        // --------------------------------------------------
        // Validate project
        // --------------------------------------------------

        const projectExists = await this.projectRepo.exists({
            id: projectId,
        });

        if (!projectExists) {
            return this.emptyProgress();
        }

        // --------------------------------------------------
        // Aggregate activities
        // --------------------------------------------------        

        // --------------------------------------------------
        // Aggregate phases
        // --------------------------------------------------       


        const [
            [activityResult],
            [phaseResult],
        ] = await Promise.all([
            this.phaseActivityRepo.getProjectProgressAggregation(projectId),
            this.phaseRepo.getProjectProgressAggregation(projectId),
        ]);


        // --------------------------------------------------
        // Extract values
        // --------------------------------------------------

        const totalActivities =
            activityResult?.total ?? 0;

        const completedActivities =
            activityResult?.completed ?? 0;

        const totalCost =
            activityResult?.totalCost ?? 0;

        const completedCost =
            activityResult?.completedCost ?? 0;

        const totalPhases =
            phaseResult?.total ?? 0;

        const completedPhases =
            phaseResult?.completed ?? 0;

        // --------------------------------------------------
        // Calculate progress
        // --------------------------------------------------

        const activityProgress =
            totalActivities > 0
                ? Math.round(
                    (completedActivities / totalActivities) * 100
                )
                : 0;

        const costProgress =
            totalCost > 0
                ? Math.round(
                    (completedCost / totalCost) * 100
                )
                : 0;

        const phaseProgress =
            totalPhases > 0
                ? Math.round(
                    (completedPhases / totalPhases) * 100
                )
                : 0;

        // --------------------------------------------------
        // Return
        // --------------------------------------------------

        return {
            activityProgress,
            costProgress,
            phaseProgress,

            totalActivities,
            completedActivities,

            totalPhases,
            completedPhases,

            totalCost,
            completedCost,
        };
    }

    /**
     * Empty progress response.
     */
    private emptyProgress(): IProjectProgress {
        return {
            activityProgress: 0,
            costProgress: 0,
            phaseProgress: 0,

            totalActivities: 0,
            completedActivities: 0,

            totalPhases: 0,
            completedPhases: 0,

            totalCost: 0,
            completedCost: 0,
        };
    }
}