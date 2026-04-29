'use client';

import React from 'react';
import { createEntityManager } from "@/components/createEntityManager";
import { PublicationApi } from "../api/publication.api";
import { GetPublicationsOptions, Publication } from "../models/publication.model";
import { User } from "../../models/user.model";
import SavePublicationDialog from "./SavePublication";

interface PublicationManagerProps {
    author?: User;
}

const PublicationManager = ({ author }: PublicationManagerProps) => {
    /**
     * Initialize the Entity Manager for Publications.
     * The manager handles the CRUD lifecycle, permissions, and dialog state.
     */
    const Manager = createEntityManager<Publication, GetPublicationsOptions | undefined>({
        title: author ? `Publications for ${author.name}` : "Manage Publications",
        itemName: "Publication",
        api: PublicationApi,

        /** Table Columns configuration */
        columns: [
            {
                header: "Title",
                field: "title",
                sortable: true
            },
            {
                header: "Type",
                field: "type",
                sortable: true,
                body: (p: Publication) => (
                    <span>
                        {p.type?.toUpperCase()}
                    </span>
                )
            },
            {
                header: "Publisher",
                field: "publisher",
                sortable: true
            },
            // Dynamic column: Hide Author name if we are viewing a specific applicant's list
            ...(!author ? [{
                header: "Author",
                field: "author.name",
                sortable: true
            }] : []),
        ],

        /** Default values for new records */
        createNew: () => ({
            author: author, // Automatically link the publication to the current applicant
            title: "",
            type: undefined,
            abstract: "",
        }),

        /** Integration with the Save Dialog and Permission system */
        SaveDialog: SavePublicationDialog,
        permissionPrefix: "publication",
        query: () => ({
            author: author,
            populate: author ? false : true
        }),
    });

    /**
     * Return the Manager component, passing the applicant as context 
     * to trigger the internal filtering and creation logic.
     */
    return <Manager />;
};

export default PublicationManager;