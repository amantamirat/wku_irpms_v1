import { createEntityManager } from '@/components/createEntityManager';
import { createEmptyTemplate, Template } from '../models/template.model';
import SaveTemplate from './SaveTemplate';
import { TemplateApi } from '../api/template.api';
import { Tag } from 'primereact/tag';

export default createEntityManager<Template>({
    title: "Manage Document Templates",
    itemName: "Template",
    api: TemplateApi,
    columns: [
        { header: "Name", field: "name", sortable: true },
        {
            header: "Description",
            field: "description",
            body: (t: Template) => t.description || <span className="text-400 italic">No description</span>
        },
        {
            header: "Total Sections",
            body: (t: Template) => (
                <Tag value={`${t.sections?.length || 0} Sections`} severity="info" />
            )
        },
        {
            header: "Required Sections",
            body: (t: Template) => {
                const reqCount = t.sections?.filter(s => s.required).length || 0;
                return <Tag value={`${reqCount} Required`} severity={reqCount > 0 ? "warning" : "info"} />;
            }
        }
    ],
    createNew: createEmptyTemplate,
    SaveDialog: SaveTemplate,
    permissionPrefix: "template"
});