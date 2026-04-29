'use client';

import React from 'react';
import { createEntityManager } from "@/components/createEntityManager";
import { ExperienceApi } from "../api/experience.api";
import { GetExperiencesOptions, Experience } from "../models/experience.model";
import { User } from "../../models/user.model";
import SaveExperience from "./SaveExperience";

interface ExperienceManagerProps {
    user?: User;
}

const ExperienceManager = ({ user: user }: ExperienceManagerProps) => {
    /**
     * Initialize the Entity Manager for Experiences.
     * The manager handles the CRUD lifecycle, permissions, and dialog state.
     */
    const Manager = createEntityManager<Experience, GetExperiencesOptions | undefined>({
        title: user ? `Experiences for ${user.name}` : "Manage Experiences",
        itemName: "Experience",
        api: ExperienceApi,

        /** Table Columns configuration */
        columns: [
            { header: "Organization", field: "organization.name" }, // assumes organization populated
            { header: "Position", field: "position.name" },
            { header: "Start Date", field: "startDate", body: (row: Experience) => new Date(row.startDate!).toLocaleDateString() },
            { header: "End Date", field: "endDate", body: (row: Experience) => row.endDate ? new Date(row.endDate).toLocaleDateString() : "Current" },
            //{ header: "Current", field: "isCurrent", body: currentStatusTemplate },
            { header: "Employment Type", field: "employmentType" },

        ],

        /** Default values for new records */
        createNew: () => ({

        }),

        /** Integration with the Save Dialog and Permission system */
        SaveDialog: SaveExperience,
        permissionPrefix: "experience",
        query() {
            user
        },
    });

    /**
     * Return the Manager component, passing the applicant as context 
     * to trigger the internal filtering and creation logic.
     */
    return <Manager />;
};

export default ExperienceManager;