'use client';

import { ColumnProps } from 'primereact/column';
import { Tag } from 'primereact/tag';

import { ItemManager } from '@/components/ItemManager';
import { useToast } from '@/contexts/ToastContext';
import { MENU_ICONS } from '@/utils/menu-icons';

import MyBadge from '@/templates/MyBadge';
import { DocumentTemplateApi } from './api/documentTemplate.api';
import DocumentTemplateForm from './components/DocumentTemplateForm';
import { IDocumentTemplate, DocumentTemplateType, TemplateEngine } from './models/documentTemplate.model';

const columns: ColumnProps[] = [
    {
        header: 'Name',
        field: 'name',
        sortable: true
    },
    {
        header: 'Type',
        field: 'type',
        sortable: true,
        body: (template: IDocumentTemplate) => (
            <Tag
                value={
                    template.type === DocumentTemplateType.AGREEMENT
                        ? 'Agreement'
                        : 'Certificate'
                }
                severity={
                    template.type === DocumentTemplateType.AGREEMENT
                        ? 'info'
                        : 'success'
                }
            />
        )
    },
    {
        header: 'Engine',
        field: 'engine',
        sortable: true,
        body: (template: IDocumentTemplate) =>
            template.engine === TemplateEngine.HANDLEBARS
                ? 'Handlebars'
                : template.engine
    },
    {
        header: 'Version',
        field: 'version',
        sortable: true,
        body: (template: IDocumentTemplate) => `v${template.version ?? 1}`
    },
    {
        header: 'Status',
        field: 'status',
        sortable: true,
        body: (template: IDocumentTemplate) => {
            return (<MyBadge
                type="status"
                value={template.status ?? 'Unknown'}
            />)
        }
    },
    {
        header: 'Description',
        field: 'description',
        body: (template: IDocumentTemplate) =>
            template.description || (
                <span className="text-400 italic">No description</span>
            )
    },
    {
        header: 'File',
        field: 'filePath',
        body: (template: IDocumentTemplate) =>
            template.filePath ? (
                <Tag value="Uploaded" severity="success" />
            ) : (
                <Tag value="No file" severity="warning" />
            )
    }
];

export default function DocumentTemplateManager() {
    const toast = useToast();

    return (
        <ItemManager<IDocumentTemplate>
            api={DocumentTemplateApi}
            resource="documentTemplate"
            itemName="Document Template"
            headerTitle="Agreements & Certificates"
            itemIcon={MENU_ICONS.templates}
            columns={columns}
            dialogWidth="800px"
            renderForm={(props) => <DocumentTemplateForm {...props} />}
            onError={(error) => toast.error(error)}
            onSuccess={(operation) =>
                toast.success(
                    operation === 'create'
                        ? 'Document template created successfully'
                        : 'Document template updated successfully'
                )
            }
        />
    );
}