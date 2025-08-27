import { Project } from "../models/project.model";
import { useEffect, useState } from "react";
import { Tree } from "primereact/tree";
import { ThemeApi } from "../../themes/api/theme.api";
import { Call } from "../../calls/models/call.model";
import { Grant } from "../../grants/models/grant.model";
import { Theme, ThemeType } from "../../themes/models/theme.model";

type TreeNode = {
    key?: string;
    label: string;
    data?: any;
    icon?: string;
    children?: TreeNode[];
};

function buildTree(themes: Theme[]): TreeNode[] {
    return themes
        .filter(t => t.type === ThemeType.broadTheme)
        .map(t => ({
            key: t._id!,
            label: t.title,
            data: t,
            children: buildChildren(themes, t._id!)
        }));
}

function buildChildren(themes: Theme[], parentId: string): TreeNode[] {
    return themes
        .filter(t => (t.parent ?? null) === parentId) // only by parent
        .map(t => ({
            key: t._id!,
            label: t.title,
            data: t,
            children: buildChildren(themes, t._id!)
        }));
}

interface ProjectInfoStepProps {
    project: Project;
    setProject: (project: Project) => void;
}

export default function ThemeStep({ project, setProject }: ProjectInfoStepProps) {
    const [nodes, setNodes] = useState([]);
    const [selectedKeys, setSelectedKeys] = useState(null);
    //const [themes, setThemes] = useState<Theme[]>([]);

    useEffect(() => {
        const fetchThemes = async () => {
            const data = await ThemeApi.getThemes({
                catalog: (((project.call as Call).grant) as Grant).theme as string
            });
            const tree = buildTree(data);
            // console.log(tree);
            setNodes(tree as any);
        };
        fetchThemes();
    }, []);

    return (
        <div className="card p-4 space-y-4">
            <h2 className="text-xl font-semibold">Select Themes</h2>
            <p className="text-gray-600 text-sm">
                Choose the themes relevant to your project.
            </p>
            <Tree value={nodes} selectionMode="checkbox" selectionKeys={selectedKeys} onSelectionChange={(e) => setSelectedKeys(e.value as any)} className="w-full md:w-30rem" />
        </div>
    )
}
