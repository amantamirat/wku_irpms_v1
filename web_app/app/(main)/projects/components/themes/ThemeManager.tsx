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
import { Project, ProjectTheme } from "../../models/project.model";
import AddThemeDialog from "./AddThemeDialog";
import CoPIDialog from "./CoPIDialog";


type Node = {
    key?: string;
    label: string;
    value?: any;
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
                key: t._id,
                label: t.title,
                value: t,
                ...(children.length > 0
                    ? { children, selectable: false }
                    : { selectable: true })
            };
        });
}

export default function ThemeManager({ project, setProject }: ProjectInfoStepProps) {

    const emptyProjectTheme: ProjectTheme = {
        theme: ""
    };
    const [themes, setThemes] = useState<Theme[]>([]);
    const [nodes, setNodes] = useState([]);
    const [selectedNode, setSelectedNode] = useState<string>("");
    const [projectTheme, setProjectTheme] = useState<ProjectTheme>(emptyProjectTheme);

    const [showAddDialog, setShowAddDialog] = useState(false);
    const [showCoPIDialog, setShowCoPIDialog] = useState(false);
    const [showDeleteDialog, setShowDeleteDialog] = useState(false);

    useEffect(() => {
        const fetchThemes = async () => {
            const data = await ThemeApi.getThemes({
                catalog: (((project.call as Call).grant) as Grant).theme as string
            });
            setThemes(data);
            const node = buildTree(data);
            setNodes(node as any);
        };
        fetchThemes();
    }, []);


    const addProjectTheme = () => {
        try {
            if (!selectedNode || selectedNode.trim() === "") {
                throw new Error("Please provide valid theme.");
            }
            const theme = themes.find((thm) => thm._id === selectedNode);
            if (!theme) {
                throw new Error("Theme not found!");
            }
            const exists = project.themes?.some((pt) => {
                if (!pt.theme) return false;
                if (typeof pt.theme === "string") {
                    return pt.theme === selectedNode;
                }
                return pt.theme._id === selectedNode;
            }) ?? false;
            if (exists) {
                throw new Error("The theme is already added!");
            }
            const updatedThemes = [...(project.themes || []), { theme: theme }];
            setProject({ ...project, themes: updatedThemes });

        } catch (err) {
            console.log(err);
            alert(err instanceof Error ? err.message : "Something went wrong");
        } finally {
            hideDialogs();
        }
    };


    const removeProjectTheme = () => {
        try {
            if (!projectTheme.theme) {
                throw new Error("Invalid project theme.");
            }
            const updatedThemes = project.themes?.filter(
                (pt) => (pt.theme as any)._id !== (projectTheme.theme as any)._id
            ) || [];

            setProject({ ...project, themes: updatedThemes });
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
        setShowCoPIDialog(false);
        setShowDeleteDialog(false);
    }

    const actionBodyTemplate = (rowData: ProjectTheme) => (
        <>
            <Button icon="pi pi-user" rounded severity="success" className="p-button-rounded p-button-text"
                style={{ fontSize: '1.2rem' }} onClick={() => {
                    setProjectTheme(rowData);
                    setShowCoPIDialog(true);
                }} />
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
                <Column field="theme.title" header="Theme" sortable headerStyle={{ minWidth: '15rem' }} />
                <Column field="Co_PI.applicant.first_name" header="Co-PI" sortable headerStyle={{ minWidth: '15rem' }} />
                <Column body={actionBodyTemplate} headerStyle={{ minWidth: '10rem' }} />
            </DataTable>
            {projectTheme &&
                <AddThemeDialog
                    selectedNode={selectedNode}
                    setSelectedNode={setSelectedNode}
                    visible={showAddDialog}
                    options={nodes}
                    onAdd={addProjectTheme}
                    onHide={hideDialogs}
                />}

            {projectTheme && (
                <CoPIDialog
                    project={project}
                    projectTheme={projectTheme}
                    setProjectTheme={setProjectTheme}
                    visible={showCoPIDialog}
                    onSet={function (): void {
                        throw new Error("Function not implemented.");
                    }}
                    onHide={hideDialogs}
                />
            )}
            {projectTheme && (
                <DeleteDialog
                    showDeleteDialog={showDeleteDialog}
                    selectedDataInfo={String((projectTheme.theme as any).title)}
                    onDelete={removeProjectTheme}
                    onHide={hideDialogs}
                />
            )}
        </div>
    )
}
