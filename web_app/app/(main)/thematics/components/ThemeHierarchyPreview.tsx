'use client';
import React, { useEffect, useState } from 'react';
import { Tree } from 'primereact/tree';
import { TreeNode } from 'primereact/treenode';
import { Badge } from 'primereact/badge';
import { ProgressSpinner } from 'primereact/progressspinner';
import { Thematic, themeLevelIndex } from '../models/thematic.model';
import { ThemeApi } from '../themes/api/theme.api';
import { buildTree, ThemeNode } from '../models/thematic.node';


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

    // Convert your ThemeNode structure to PrimeReact TreeNode structure
    const convertToTreeNodes = (themeNodes: ThemeNode[]): TreeNode[] => {
        return themeNodes.map(node => {
            const treeNode: TreeNode = {
                key: node.key,
                label: node.label,
                data: node.data, // This will be the theme ID
                children: node.children ? convertToTreeNodes(node.children) : undefined,
                selectable: node.selectable,
                expanded: true // Auto-expand for better visibility
            };
            return treeNode;
        });
    };

    // You'll need to fetch the actual theme data for node rendering
    // Since your buildTree only stores the ID in data, you need to map IDs to theme objects
    const [themesMap, setThemesMap] = useState<Map<string, any>>(new Map());

    const loadHierarchy = async () => {
        try {
            setLoading(true);
            const themes = await ThemeApi.getAll({ thematicArea: thematic._id });

            if (themes.length > 0) {
                // Create a map for quick lookups
                const map = new Map<string, any>();
                themes.forEach((theme: any) => {
                    map.set(theme._id, theme);
                });
                setThemesMap(map);

                setMaxLevelReached(Math.max(...themes.map((t: any) => t.level)));
                const themeNodes = buildTree(themes);
                setNodes(convertToTreeNodes(themeNodes));
            }
        } finally {
            setLoading(false);
        }
    };

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
        // Get the full theme object from the map using the ID stored in node.data
        const themeData = themesMap.get(node.data as string);
        if (!themeData) return <div>{node.label}</div>;

        const levelName = levelNames[themeData.level] || `Level ${themeData.level}`;
        const severity = levelSeverity[themeData.level] || "info";

        return (
            <div className="flex align-items-center py-1">
                <span className="font-bold mr-2">{levelName}:</span>
                <span className="font-medium mr-2">{node.label}</span>
                {themeData.priority !== undefined && (
                    <Badge value={`Priority: ${themeData.priority}`} severity={severity} />
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
            />
        </div>
    );
};

export default ThemeHierarchyPreview;