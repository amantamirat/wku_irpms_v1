import { AppMenuItem } from '@/types/layout';

export const filterMenuByPermission = (
    items: AppMenuItem[],
    hasPermission: (permission: string) => boolean
): AppMenuItem[] => {
    return items
        .map((item): AppMenuItem | null => {
            const children = item.items
                ? filterMenuByPermission(item.items, hasPermission)
                : undefined;

            const hasAccess =
                !item.permission ||
                (Array.isArray(item.permission)
                    ? item.permission.some(hasPermission)
                    : hasPermission(item.permission));

            const isParentGroup = item.items !== undefined;
            const hasVisibleChildren =
                children !== undefined && children.length > 0;

            if (!hasAccess) return null;

            if (isParentGroup && !hasVisibleChildren) {
                return null;
            }

            return {
                ...item,
                ...(children !== undefined && { items: children }),
            };
        })
        .filter((item): item is AppMenuItem => item !== null);
};

