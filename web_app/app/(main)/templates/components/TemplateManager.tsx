'use client';

import { createEntityManager } from "@/components/createEntityManager";
import { Template, GetTemplatesOptions, TemplateStatus } from "../models/template.model";
import { TemplateApi } from "../api/template.api";
import SaveTemplate from "./SaveTemplate";
import MyBadge from "@/templates/MyBadge";

/**
 * TemplateManager handles the CRUD lifecycle for form templates.
 * It follows the same pattern as EvaluationManager for consistency.
 */
const TemplateManager = () => {

    const Manager = createEntityManager<Template, GetTemplatesOptions | undefined>({
        title: "Manage Templates",
        itemName: "Template",
        api: TemplateApi,

        columns: [
            { 
                header: "Template Name", 
                field: "name", 
                sortable: true,
                style: { minWidth: '15rem' } 
            },
            { 
                header: "Description", 
                field: "description",
                body: (t: Template) => (
                    <span className="text-gray-600 truncate block" style={{ maxWidth: '250px' }}>
                        {t.description || '--'}
                    </span>
                )
            },
            {
                header: "Structure",
                body: (t: Template) => (
                    <div className="flex gap-2">
                        <span className="text-sm bg-blue-50 text-blue-700 px-2 py-1 border-round">
                            {t.sections?.length || 0} Sections
                        </span>
                        <span className="text-sm bg-gray-50 text-gray-700 px-2 py-1 border-round">
                            {t.sections?.reduce((acc, s) => acc + (s.fields?.length || 0), 0)} Total Fields
                        </span>
                    </div>
                ),
                style: { width: '15%' }
            },
            {
                field: "status",
                header: "Status",
                sortable: true,
                body: (t: Template) => (
                    <MyBadge 
                        type="status" 
                        value={t.status ?? TemplateStatus.draft} 
                    />
                ),
                style: { width: '10%' }
            }
        ],

        createNew: () => ({
            name: "",
            description: "",
            sections: [],
            status: TemplateStatus.draft
        }),

        SaveDialog: SaveTemplate,
        permissionPrefix: "template",

        // If you have a state machine for templates, you can add workflow here
        // workflow: {
        //     statusField: "status",
        //     transitions: TEMPLATE_TRANSITIONS,
        //     statusOrder: TEMPLATE_STATUS_ORDER
        // },

        // You can create a TemplateDetail component to show a preview of the form
        expandable: {
            template: (template) => (
                <div className="p-3 surface-50 border-round">
                    <h5 className="mb-2">Template Preview: {template.name}</h5>
                    <p className="text-sm mb-3">{template.description}</p>
                    <ul className="list-none p-0">
                        {template.sections.map((s, idx) => (
                            <li key={idx} className="mb-2">
                                <strong>{s.title}</strong> ({s.fields.length} fields)
                            </li>
                        ))}
                    </ul>
                </div>
            )
        }
    });

    return <Manager />;
};

export default TemplateManager;