import { Call } from "@/app/(main)/calls/models/call.model";
import { Grant } from "@/app/(main)/grants/models/grant.model";
import { ThemeApi } from "@/app/(main)/themes/api/theme.api";
import { Theme, ThemeType } from "@/app/(main)/themes/models/theme.model";
import DeleteDialog from "@/components/DeleteDialog";
import { Button } from "primereact/button";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";
import { Toolbar } from "primereact/toolbar";
import { useEffect, useState } from "react";
import { Project} from "../../models/project.model";
import { ProjectTheme } from "../models/project.theme.model";
import { ProjectThemeApi } from "../api/project.theme.api";
import SaveThemeDialog from "./SaveThemeDialog";




type Node = {
    key?: string;
    label: string;
    value?: any;
    icon?: string;
    children?: Node[];
};

interface ProjectInfoStepProps {
    project: Project;
}


function buildTree(themes: Theme[], parentId?: string): Node[] {
    return themes
        .filter(t => {
            if (parentId) {
                return (t.parent ?? null) === parentId;
            }
            return t.type === ThemeType.broadTheme;
        })
        .map(t => {
            const children = buildTree(themes, t._id!);
            return {
                key: t._id,
                label: t.title,
                value: t,
                ...(children.length > 0
                    ? { children, selectable: false }
                    : { selectable: true })
            };
        });
}

export default function ThemeManager({ project }: ProjectInfoStepProps) {

    const emptyProjectTheme: ProjectTheme = {
        theme: "",
        project: project
    };
    const [themes, setThemes] = useState<Theme[]>([]);
    const [nodes, setNodes] = useState([]);

    const [projectThemes, setProjectThemes] = useState<ProjectTheme[]>([]);
    const [projectTheme, setProjectTheme] = useState<ProjectTheme>(emptyProjectTheme);
    const [showSaveDialog, setShowSaveDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

    useEffect(() => {
        const fetchThemes = async () => {
            const data = await ThemeApi.getThemes({
                catalog: (project.call as Call).theme as string
            });
            setThemes(data);
            const node = buildTree(data);
            setNodes(node as any);
        };
        fetchThemes();
    }, [, [project?.call]]);


    useEffect(() => {
        const fetchProjectThemes = async () => {
            try {
                const data = await ProjectThemeApi.getProjectThemes({ project: project._id });
                setProjectThemes(data);
            } catch (err) {
                console.error("Failed to fetch project themes:", err);
            }
        };
        if (project?._id) {
            fetchProjectThemes();
        }
    }, [project?._id]);


    const saveProjectTheme = async () => {

    };



    const deleteProjectTheme = async () => {

    };


    const hideDialogs = () => {
        setProjectTheme(emptyProjectTheme);
        setShowSaveDialog(false);
        setShowDeleteDialog(false);
    }

    const actionBodyTemplate = (rowData: ProjectTheme) => (
        <>
            <Button icon="pi pi-times" rounded severity="warning" className="p-button-rounded p-button-text"
                style={{ fontSize: '1.2rem' }} onClick={() => {
                    setProjectTheme(rowData);
                    setShowDeleteDialog(true);
                }} />
        </>
    );

    const startToolbarTemplate = () => (
        <div className="my-2">
            <Button icon="pi pi-plus" severity="success" className="mr-2" tooltip={"Add Theme"}
                onClick={() => {
                    setProjectTheme(emptyProjectTheme);
                    setShowSaveDialog(true);
                }}
            />
        </div>
    );

    return (
        <div className="card">
            <Toolbar className="mb-4" start={startToolbarTemplate} />
            <DataTable
                value={project.themes}
                selection={projectTheme}
                onSelectionChange={(e) => setProjectTheme(e.value as ProjectTheme)}
                dataKey="_id"
                paginator
                rows={10}
                rowsPerPageOptions={[5, 10, 25]}
                className="datatable-responsive"
                paginatorTemplate="FirstPageLink PrevPageLink PageLinks NextPageLink LastPageLink CurrentPageReport RowsPerPageDropdown"
                emptyMessage={'No theme found.'}
                scrollable
                tableStyle={{ minWidth: '50rem' }}
            >
                <Column selectionMode="single" headerStyle={{ width: '3em' }}></Column>
                <Column header="#" body={(rowData, options) => options.rowIndex + 1} style={{ width: '50px' }} />
                <Column field="theme.title" header="Theme" sortable headerStyle={{ minWidth: '15rem' }} />
                <Column body={actionBodyTemplate} headerStyle={{ minWidth: '10rem' }} />
            </DataTable>


            {projectTheme && (
                <SaveThemeDialog
                    projectTheme={projectTheme}
                    setProjectTheme={setProjectTheme}
                    visible={showSaveDialog}
                    onAdd={saveProjectTheme}
                    onHide={hideDialogs}
                    themeOptions={nodes} />
            )}
            {projectTheme && (
                <DeleteDialog
                    showDeleteDialog={showDeleteDialog}
                    selectedDataInfo={String((projectTheme.theme as any).title)}
                    onDelete={deleteProjectTheme}
                    onHide={hideDialogs}
                />
            )}
        </div>
    )
}
