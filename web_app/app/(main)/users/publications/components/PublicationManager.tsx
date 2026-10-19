'use client';

import { useMemo } from 'react';
import { ColumnProps } from 'primereact/column';

import { ItemManager } from '@/components/ItemManager';
import { useToast } from '@/contexts/ToastContext';

import { User } from '../../models/user.model';

import { PublicationApi } from '../api/publication.api';
import {
    Publication,
    FilterPublications
} from '../models/publication.model';

import PublicationForm from './PublicationForm';
import { PUBLICATION_TRANSITIONS } from '../models/publication.state-machine';

interface PublicationManagerProps {
    author?: User;
}

const columns: ColumnProps[] = [
    {
        header: 'Author',
        field: 'author.name',
        sortable: true,
        body: (publication: Publication) =>
            typeof publication.author === 'object'
                ? publication.author?.name
                : publication.author
    },
    {
        header: 'Title',
        field: 'title',
        sortable: true
    },
    {
        header: 'Type',
        field: 'type',
        sortable: true
    },
    {
        header: 'Date',
        field: 'publishedDate',
        sortable: true,
        body: (publication: Publication) =>
            publication.publishedDate
                ? new Date(publication.publishedDate).toLocaleDateString()
                : ''
    },
    {
        header: 'Publisher / Journal',
        field: 'publisher',
        sortable: true,
        body: (publication: Publication) => publication.publisher || 'N/A'
    },
    {
        header: 'DOI',
        field: 'doi',
        sortable: true,
        body: (publication: Publication) => publication.doi || 'N/A'
    },
    {
        header: 'Publication ID / ISBN',
        field: 'publicationId',
        sortable: true,
        body: (publication: Publication) => publication.publicationId || 'N/A'
    }
];

const defaultHiddenColumns = ["publisher", "doi", "publicationId"];

const PublicationManager = ({ author }: PublicationManagerProps) => {
    const toast = useToast();

    const filter = useMemo<FilterPublications>(
        () => ({ author }),
        [author]
    );

    return (
        <ItemManager<Publication, FilterPublications>
            api={PublicationApi}
            resource="publication"
            itemName="Publication"
            headerTitle={
                author
                    ? `Publications by ${author.name}`
                    : 'Manage Publications'
            }
            columns={
                author
                    ? columns.filter(
                        (column) => column.field !== 'author.name'
                    )
                    : columns
            }
            enableColumnToggle
            defaultHiddenFields={defaultHiddenColumns}
            filter={filter}
            dialogWidth="650px"
            statusField="status"
            transitions={PUBLICATION_TRANSITIONS}
            renderForm={(props) => (
                <PublicationForm
                    {...props}
                    item={{
                        ...props.item,
                        author: author ?? props.item?.author
                    }}
                />
            )}
            onError={(error) => toast.error(error)}
            onSuccess={(operation) =>
                toast.success(
                    operation === 'create'
                        ? 'Publication created successfully'
                        : 'Publication updated successfully'
                )
            }
        />
    );
};

export default PublicationManager;
