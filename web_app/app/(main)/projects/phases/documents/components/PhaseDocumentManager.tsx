'use client';

import { ColumnProps } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { useMemo } from 'react';

import { ItemManager } from '@/components/ItemManager';
import { useToast } from '@/contexts/ToastContext';
import { MENU_ICONS } from '@/utils/menu-icons';
import { Project } from '@/app/(main)/projects/models/project.model';

import { PhaseDocumentApi } from '../api/phase.doc.api';
import {
    ProjectDocument,
    FilterPhaseDocumentOptions,
    PhaseDocumentTypeLabels,
    PROJECT_DOCUMENT_TRANSITIONS
} from '../model/phase.doc';

import PhaseDocumentForm from './PhaseDocumentForm';
import { Phase } from '../../models/phase.model';
import MyBadge from '@/templates/MyBadge';
import { BASE_URL } from '@/api/ApiClient';

// Defined outside the component for a stable reference.
const columns: ColumnProps[] = [
    {
        header: 'Type',
        field: 'type',
        sortable: true,
        body: (row: ProjectDocument) => {
            const info = PhaseDocumentTypeLabels[row.type];

            return (
                <Tag
                    value={info?.label || row.type}
                    severity="info"
                    style={{ fontWeight: 500 }}
                />
            );
        }
    },
    {
        header: 'Phase',
        field: 'phase',
        sortable: true,
        body: (row: ProjectDocument) => {
            const phase = row.phase;

            if (!phase || typeof phase !== 'object') {
                return <span className="text-400">—</span>;
            }

            return (
                <span className="font-medium">
                    Phase {phase.order}
                </span>
            );
        }
    },
    {
        header: 'Activity',
        field: 'activity',
        sortable: true,
        body: (row: ProjectDocument) => {
            const activity = row.activity;

            if (!activity || typeof activity !== 'object') {
                return <span className="text-400">—</span>;
            }

            return (
                <span className="font-medium">
                    {activity.title}
                </span>
            );
        }
    },
    {
        header: 'Description',
        field: 'description',
        sortable: true,
        body: (row: ProjectDocument) => (
            <span className="text-600 text-sm">
                {row.description
                    ? row.description.length > 50
                        ? `${row.description.substring(0, 50)}...`
                        : row.description
                    : '—'}
            </span>
        )
    },
    {
        header: 'Document',
        field: 'documentPath',
        sortable: false,
        body: (row: ProjectDocument) => {
            if (!row.documentPath) {
                return (
                    <span className="text-400 text-sm italic">
                        N/A
                    </span>
                );
            }

            const documentPath = row.documentPath.replace(/^\\/, '');
            const documentUrl = `${BASE_URL}/uploads/${documentPath}`;

            return (
                <a
                    href={documentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-800 hover:underline"
                >
                    <i className="pi pi-external-link" />
                    Get Document
                </a>
            );
        }
    },
    {
        header: 'Status',
        field: 'status',
        sortable: true,
        body: (row: ProjectDocument) => (
            <MyBadge
                type="status"
                value={row.status ?? 'Unknown'}
            />
        )
    }
];

const defaultHiddenFields = [
    'description',
    'activity',
    'phase'
];

interface PhaseDocumentManagerProps {
    project?: Project;
    phase?: Phase;
    useLookup?: boolean;
    disableCrud?: boolean;
    disableTransition?: boolean;
}

const PhaseDocumentManager = ({
    project,
    phase,
    useLookup,
    disableCrud = false,
    disableTransition = false
}: PhaseDocumentManagerProps) => {
    const toast = useToast();

    const filter = useMemo<FilterPhaseDocumentOptions>(
        () => ({
            project,
            phase
        }),
        [project, phase]
    );

    return (
        <ItemManager<
            ProjectDocument,
            FilterPhaseDocumentOptions
        >
            api={PhaseDocumentApi}
            useLookup={useLookup}
            resource="phaseDocument"
            itemName="Document"
            itemIcon={MENU_ICONS.documents}
            headerTitle="Manage Documents"
            columns={columns}
            filter={filter}
            dialogWidth="720px"
            enableColumnToggle
            defaultHiddenFields={defaultHiddenFields}
            hideCreateAction={disableCrud}
            hideEditAction={disableCrud || true} // Maintains your previous hideEditAction preference while respecting disableCrud
            hideDeleteAction={disableCrud}
            transitions={
                disableCrud || disableTransition ? undefined : PROJECT_DOCUMENT_TRANSITIONS
            }
            renderForm={
                disableCrud
                    ? undefined
                    : (props) => (
                          <PhaseDocumentForm
                              {...props}
                              project={project}
                              phase={phase}
                          />
                      )
            }
            statusField="status"
            onError={(error) => toast.error(error)}
            onSuccess={(operation) =>
                toast.success(
                    operation === 'create'
                        ? 'Phase document created successfully'
                        : 'Phase document updated successfully'
                )
            }
        />
    );
};

export default PhaseDocumentManager;