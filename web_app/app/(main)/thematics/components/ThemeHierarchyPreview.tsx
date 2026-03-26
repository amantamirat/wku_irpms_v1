'use client';
import React, { useEffect, useState } from 'react';
import { Tree } from 'primereact/tree';
import { TreeNode } from 'primereact/treenode';
import { Badge } from 'primereact/badge';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Thematic, themeLevelIndex } from '../models/thematic.model';
import { ThemeApi } from '../themes/api/theme.api';

interface Props {
    thematic: Thematic;
}

const ThemeHierarchyPreview = ({ thematic }: Props) => {
    const [nodes, setNodes] = useState<TreeNode[]>([]);
    const [loading, setLoading] = useState(true);
    const [maxLevelReached, setMaxLevelReached] = useState(0);

    const requiredLevel = themeLevelIndex[thematic.level] || 0;

    useEffect(() => {
        loadHierarchy();
    }, [thematic._id]);

    const loadHierarchy = async () => {
        try {
            setLoading(true);
            // Fetch all themes for this specific thematic area
            const themes = await ThemeApi.getAll({ thematicArea: thematic._id });

            if (themes.length > 0) {
                setMaxLevelReached(Math.max(...themes.map((t: any) => t.level)));
                setNodes(buildTree(themes));
            }
        } finally {
            setLoading(false);
        }
    };

    const buildTree = (themes: any[]): TreeNode[] => {
        const map: Record<string, TreeNode> = {};
        const roots: TreeNode[] = [];

        themes.forEach(t => {
            map[t._id] = {
                key: t._id,
                label: t.title,
                data: t,
                children: [],
                expanded: true // Auto-expand for better visibility
            };
        });

        themes.forEach(t => {
            if (t.parent && map[t.parent]) {
                map[t.parent].children?.push(map[t._id]);
            } else if (t.level === 0) {
                roots.push(map[t._id]);
            }
        });
        return roots;
    };

    /*
    const nodeTemplate = (node: TreeNode) => (
        <div className="flex align-items-center py-1">
            <span className="font-medium mr-2">{node.label}</span>
            <Badge value={`Level ${node.data.level}`} severity="success" />
        </div>
    );
    */

    const levelNames: Record<number, string> = {
        0: "Theme",
        1: "Sub-theme",
        2: "Focus Area",
        3: "Priority Area"
    };

    const levelSeverity: Record<number, "info" | "success" | "warning" | "danger"> = {
        0: "info",
        1: "success",
        2: "warning",
        3: "danger"
    };

    const nodeTemplate = (node: TreeNode) => {
        const levelName = levelNames[node.data.level] || `Level ${node.data.level}`;
        const severity = levelSeverity[node.data.level] || "info";

        return (
            <div className="flex align-items-center py-1">
                {/* Bold level name */}
                <span className="font-bold mr-2">{levelName}:</span>
                <span className="font-medium mr-2">{node.label}</span>

                {/* Show priority if available */}
                {node.data.priority !== undefined && (
                    <Badge value={`Priority: ${node.data.priority}`} severity={severity} />
                )}
            </div>
        );
    };

    if (loading) return <ProgressSpinner style={{ width: '40px' }} />;

    return (
        <div className="p-3">
            <div className="flex justify-content-between align-items-center mb-4">
                <h4 className="m-0 text-900">Structure Preview ({thematic.title})</h4>
                <div className="flex gap-2">
                    <Badge value={`Required: Level ${requiredLevel}`} severity="info" />
                    <Badge
                        value={`Current Max: Level ${maxLevelReached}`}
                        severity={maxLevelReached >= requiredLevel ? "success" : "warning"}
                    />
                </div>
            </div>

            <Tree
                value={nodes}
                nodeTemplate={nodeTemplate}
                className="border-none p-0"
            //emptyMessage="No themes defined for this area yet."
            />

            {maxLevelReached < requiredLevel && (
                <div className="mt-4 p-3 border-round bg-yellow-50 text-yellow-700 border-1 border-yellow-200">
                    <i className="pi pi-exclamation-circle mr-2"></i>
                    Hierarchy incomplete. Please reach <strong>Level {requiredLevel}</strong> to enable publishing.
                </div>
            )}
        </div>
    );
};

export default ThemeHierarchyPreview;