'use client';

import { ColumnProps } from 'primereact/column';
import { Tag } from 'primereact/tag';

import { ItemManager } from '@/components/ItemManager';
import { useToast } from '@/contexts/ToastContext';

import { TemplateApi } from '../api/template.api';
import TemplateForm from './TemplateForm';
import { Template } from '../models/template.model';
import { MENU_ICONS } from '@/utils/menu-icons';

const columns: ColumnProps[] = [
    { header: 'Name', field: 'name', sortable: true },
    {
        header: 'Description',
        field: 'description',
        body: (template: Template) =>
            template.description || (
                <span className="text-400 italic">No description</span>
            )
    },
    {
        header: 'Total Sections',
        body: (template: Template) => (
            <Tag
                value={`${template.sections?.length ?? 0} Sections`}
                severity="info"
            />
        )
    },
    {
        header: 'Required Sections',
        body: (template: Template) => {
            const requiredCount =
                template.sections?.filter((section) => section.required).length ?? 0;

            return (
                <Tag
                    value={`${requiredCount} Required`}
                    severity={requiredCount > 0 ? 'warning' : 'info'}
                />
            );
        }
    }
];

export default function TemplateManager() {
    const toast = useToast();

    return (
        <ItemManager<Template>
            api={TemplateApi}
            resource="template"
            itemName="Template"
            headerTitle="Manage Templates"
            itemIcon={MENU_ICONS.templates}
            columns={columns}
            dialogWidth="800px"
            renderForm={(props) => <TemplateForm {...props} />}
            onError={(error) => toast.error(error)}
            onSuccess={(operation) =>
                toast.success(
                    operation === 'create'
                        ? 'Template created successfully'
                        : 'Template updated successfully'
                )
            }
        />
    );
}