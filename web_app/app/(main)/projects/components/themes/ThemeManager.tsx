import { useEffect, useState } from "react";
import { Tree } from "primereact/tree";
import { Theme, ThemeType } from "@/app/(main)/themes/models/theme.model";
import { Call } from "@/app/(main)/calls/models/call.model";
import { Grant } from "@/app/(main)/grants/models/grant.model";
import { ThemeApi } from "@/app/(main)/themes/api/theme.api";
import { ProjectTheme, Project } from "../../models/project.model";
import { Toolbar } from "primereact/toolbar";
import { Button } from "primereact/button";
import AddThemeDialog from "./AddThemeDialog";


type TreeNode = {
    key?: string;
    label: string;
    data?: any;
    icon?: string;
    children?: TreeNode[];
};


interface ProjectInfoStepProps {
    project: Project;
    setProject: (project: Project) => void;
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
            {projectTheme &&
                <AddThemeDialog
                    theme={projectTheme}
                    setTheme={setProjectTheme}
                    visible={showAddDialog}
                    onAdd={addProjectTheme}
                    onHide={hideDialogs}
                />}
        </div>
    )
}
