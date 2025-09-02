import { useEffect, useState } from "react";
import { Tree } from "primereact/tree";
import { Theme, ThemeType } from "@/app/(main)/themes/models/theme.model";
import { Call } from "@/app/(main)/calls/models/call.model";
import { Grant } from "@/app/(main)/grants/models/grant.model";
import { ThemeApi } from "@/app/(main)/themes/api/theme.api";
import { ProjectTheme, Project, Collaborator } from "../../models/project.model";
import { Toolbar } from "primereact/toolbar";
import { Button } from "primereact/button";
import AddThemeDialog from "./AddThemeDialog";
import { Column } from "primereact/column";
import { DataTable } from "primereact/datatable";


type Node = {
    key?: string;
    label: string;
    data?: any;
    icon?: string;
    children?: Node[];
};


interface ProjectInfoStepProps {
    project: Project;
    setProject: (project: Project) => void;
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
                key:t._id,
                label: t.title,
                data: t,
                ...(children.length > 0
                    ? { children, selectable: false }
                    : { selectable: true }   )
            };
        });
}

export default function ThemeManager({ project, setProject }: ProjectInfoStepProps) {

    const emptyProjectTheme: ProjectTheme = {
        theme: ""
    };
    const [projectTheme, setProjectTheme] = useState<ProjectTheme>(emptyProjectTheme);
    const [showAddDialog, setShowAddDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);
    const [nodes, setNodes] = useState([]);
    const [selectedKeys, setSelectedKeys] = useState<{ [key: string]: any }>({});
    //const [themes, setThemes] = useState<Theme[]>([]);



    useEffect(() => {
        const fetchThemes = async () => {
            const data = await ThemeApi.getThemes({
                catalog: (((project.call as Call).grant) as Grant).theme as string
            });      
            console.log(data);      
            const node = buildTree(data);
            setNodes(node as any);
        };
        fetchThemes();
    }, []);





    const addProjectTheme = () => {
        try {
            /**
             * if (!phase.order) {
                throw new Error("Please provide valid order.");
            }
            const exists = project.phases?.some(
                (p) => p.order === phase.order
            );
            if (exists) {
                throw new Error("The order is already added!");
            }
            const updatedPhases = [...(project.phases || []), phase];
            setProject({ ...project, phases: updatedPhases });
             * 
             */

        } catch (err) {
            console.log(err);
            alert(err instanceof Error ? err.message : "Something went wrong");
        } finally {
            hideDialogs();
        }
    };


    const removeProjectTheme = () => {
        try {
            /**
             * 
             *  if (!phase.order) {
                throw new Error("Invalid phase.");
            }
            const updatedPhases = project.phases?.filter(
                (p) => p.order !== phase.order
            ) || [];

            setProject({ ...project, phases: updatedPhases });
             */


        } catch (err) {
            console.log(err);
            alert(err instanceof Error ? err.message : "Something went wrong");
        } finally {
            hideDialogs();
        }
    };


    const hideDialogs = () => {
        setProjectTheme(emptyProjectTheme);
        setShowAddDialog(false);
        setShowDeleteDialog(false);
    }

    const startToolbarTemplate = () => (
        <div className="my-2">
            <Button icon="pi pi-plus" severity="success" className="mr-2" tooltip={"Add Theme"}
                onClick={() => {
                    setProjectTheme(emptyProjectTheme);
                    setShowAddDialog(true);
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
                dataKey="theme._id"
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
                <Column
                    field="theme.title"
                    header="Title"
                    sortable
                    headerStyle={{ minWidth: '15rem' }}
                />
            </DataTable>
            {projectTheme &&
                <AddThemeDialog
                    theme={projectTheme}
                    setTheme={setProjectTheme}
                    visible={showAddDialog}
                    options={nodes}
                    onAdd={addProjectTheme}
                    onHide={hideDialogs}
                />}
        </div>
    )
}
