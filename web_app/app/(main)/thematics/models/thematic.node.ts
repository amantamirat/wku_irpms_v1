import { Theme } from "../themes/models/theme.model";

export type ThemeNode = {
    key?: string;
    label: string;
    data?: string;
    children?: ThemeNode[];
    selectable?: boolean;
};

export const buildTree = (themes: Theme[], parentId?: string): ThemeNode[] => {
    return themes
        .filter(t => {
            const pid = typeof t.parent === "object" ? t.parent?._id : t.parent;
            return parentId ? pid === parentId : !pid;
        })
        .sort((a, b) => (a.priority ?? 0) - (b.priority ?? 0))
        .map(t => {
            const children = buildTree(themes, t._id);
            const node: ThemeNode = {
                key: t._id,
                label: t.title,
                data: t._id,
                selectable: children.length === 0,
            };

            if (children.length > 0) {
                node.children = children;
            }

            return node;
        });
};