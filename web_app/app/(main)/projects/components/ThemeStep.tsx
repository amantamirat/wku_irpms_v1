import { InputText } from "primereact/inputtext";
import { InputTextarea } from "primereact/inputtextarea";
import { Project } from "../models/project.model";
import { useEffect, useState } from "react";
import { NodeService } from "./NodeService";
import { Tree } from "primereact/tree";

interface ProjectInfoStepProps {
    project: Project;
    setProject: (project: Project) => void;
}

export default function ThemeStep({ project, setProject }: ProjectInfoStepProps) {
    const [nodes, setNodes] = useState([]);
    const [selectedKeys, setSelectedKeys] = useState(null);
    
    useEffect(() => {
        NodeService.getTreeNodes().then((data) => setNodes(data as any));
    }, []);

    return (
        <div className="card flex justify-content-center">
            <Tree value={nodes} selectionMode="checkbox" selectionKeys={selectedKeys} onSelectionChange={(e) => setSelectedKeys(e.value as any)} className="w-full md:w-30rem" />
        </div>
    )
}
