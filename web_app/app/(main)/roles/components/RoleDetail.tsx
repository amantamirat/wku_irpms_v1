import React, { useEffect, useMemo, useRef, useState } from "react";
import { Role } from "../models/role.model";
import { RoleApi } from "../api/role.api";

// PrimeReact
import { Card } from "primereact/card";
import { Tag } from "primereact/tag";
import { Divider } from "primereact/divider";
import { Skeleton } from "primereact/skeleton";
import { Message } from "primereact/message";
import { Button } from "primereact/button";
import { InputText } from "primereact/inputtext";
import { Accordion, AccordionTab } from "primereact/accordion";
import { Toast } from "primereact/toast";

interface RoleDetailProps {
    roleId: string;
    /** Edit callback remains available if you want to trigger edits from within the card header. */
    onEdit?: (role: Role) => void;
}

interface NormalizedPermission {
    key: string;
    name: string;
    description: string;
    category: string;
}

const ALL = "All";

/** Wraps matching text in <mark> so users can see why a row matched. */
const highlight = (text: string, query: string) => {
    if (!query) return text;
    const i = text.toLowerCase().indexOf(query.toLowerCase());
    if (i === -1) return text;
    return (
        <>
            {text.slice(0, i)}
            <mark className="bg-yellow-200 text-900 border-round-sm px-1">
                {text.slice(i, i + query.length)}
            </mark>
            {text.slice(i + query.length)}
        </>
    );
};

export default function RoleDetail({ roleId, onEdit }: RoleDetailProps) {
    const [role, setRole] = useState<Role | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    // Find / filter state
    const [query, setQuery] = useState("");
    const [activeCategory, setActiveCategory] = useState<string>(ALL);
    const [openTabs, setOpenTabs] = useState<number[]>([]);

    const toast = useRef<Toast>(null);

    const fetchRole = async (isMounted: () => boolean = () => true) => {
        try {
            setLoading(true);
            setError(null);
            const data = await RoleApi.getById!(roleId);
            if (isMounted()) setRole(data);
        } catch {
            if (isMounted()) setError("We couldn't load this role. Check your connection and try again.");
        } finally {
            if (isMounted()) setLoading(false);
        }
    };

    useEffect(() => {
        let mounted = true;
        if (roleId) fetchRole(() => mounted);
        return () => {
            mounted = false;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [roleId]);

    // Normalise string / object permissions into one shape
    const permissions: NormalizedPermission[] = useMemo(() => {
        return (role?.permissions || []).map((perm: any, index: number) =>
            typeof perm === "string"
                ? { key: perm, name: perm, description: "", category: "General" }
                : {
                    key: perm._id || `${perm.name}-${index}`,
                    name: perm.name,
                    description: perm.description || "",
                    category: perm.category || "General",
                }
        );
    }, [role]);

    const categories = useMemo(() => {
        const counts: Record<string, number> = {};
        permissions.forEach((p) => (counts[p.category] = (counts[p.category] || 0) + 1));
        return counts;
    }, [permissions]);

    // Apply search + category filter, then group
    const grouped = useMemo(() => {
        const q = query.trim().toLowerCase();
        const result: Record<string, NormalizedPermission[]> = {};
        permissions.forEach((p) => {
            if (activeCategory !== ALL && p.category !== activeCategory) return;
            if (q && !p.name.toLowerCase().includes(q) && !p.description.toLowerCase().includes(q)) return;
            (result[p.category] ||= []).push(p);
        });
        return Object.entries(result);
    }, [permissions, query, activeCategory]);

    const visibleCount = grouped.reduce((n, [, list]) => n + list.length, 0);

    // Open every group while searching so matches are never hidden
    useEffect(() => {
        if (query.trim()) setOpenTabs(grouped.map((_, i) => i));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [query, activeCategory]);

    // Start with everything expanded when data arrives
    useEffect(() => {
        setOpenTabs(grouped.map((_, i) => i));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [role]);

    const copyName = async (name: string) => {
        try {
            await navigator.clipboard.writeText(name);
            toast.current?.show({ severity: "success", summary: "Copied", detail: name, life: 1500 });
        } catch {
            toast.current?.show({ severity: "warn", summary: "Copy failed", detail: "Clipboard not available.", life: 2000 });
        }
    };

    const clearFilters = () => {
        setQuery("");
        setActiveCategory(ALL);
    };

    /* ---------- Loading ---------- */
    if (loading) {
        return (
            <Card className="shadow-2 border-round-xl p-3">
                <div className="flex flex-column gap-3">
                    <Skeleton width="40%" height="2rem" />
                    <Skeleton width="60%" height="1rem" />
                    <Divider />
                    <Skeleton height="2.5rem" />
                    <div className="grid">
                        <div className="col-12 md:col-6"><Skeleton height="4rem" /></div>
                        <div className="col-12 md:col-6"><Skeleton height="4rem" /></div>
                    </div>
                </div>
            </Card>
        );
    }

    /* ---------- Error / not found ---------- */
    if (error || !role) {
        return (
            <div className="flex flex-column gap-3 align-items-start">
                <Message
                    severity="error"
                    text={error || "This role doesn't exist or was deleted."}
                    className="w-full justify-content-start p-3 border-round-lg"
                />
                {error && <Button label="Try again" icon="pi pi-refresh" onClick={() => fetchRole()} />}
            </div>
        );
    }

    /* ---------- Header ---------- */
    const headerTemplate = (
        <div className="flex flex-column md:flex-row md:align-items-start justify-content-between p-4 pb-2 gap-3">
            <div>
                <div className="flex align-items-center gap-2 flex-wrap">
                    <h2 className="m-0 text-900 text-xl font-bold">{role.name}</h2>
                    {role.isDefault && <Tag severity="info" value="Default role" rounded className="text-xs" />}
                </div>
                {role.description && <p className="m-0 text-600 text-sm mt-1">{role.description}</p>}
            </div>
            <div className="flex align-items-center gap-2">
                <div className="surface-100 px-3 py-2 border-round-lg flex align-items-center gap-2">
                    <i className="pi pi-shield text-primary" />
                    <span className="text-xs font-semibold text-700">
                        {permissions.length} permission{permissions.length === 1 ? "" : "s"}
                    </span>
                </div>
                {onEdit && <Button label="Edit role" icon="pi pi-pencil" size="small" onClick={() => onEdit(role)} />}
            </div>
        </div>
    );

    const filtersActive = query.trim() !== "" || activeCategory !== ALL;

    return (
        <div>
            <Toast ref={toast} position="bottom-right" />

            <Card header={headerTemplate} className="shadow-1 border-round-xl surface-card">
                <Divider className="my-2" />

                <div className="p-3">
                    {permissions.length === 0 ? (
                        <div className="text-center p-5 surface-ground border-round-lg border-1 surface-border">
                            <i className="pi pi-info-circle text-4xl text-400 mb-2" />
                            <p className="text-sm text-600 m-0 mb-3">No permissions are assigned to this role yet.</p>
                            {onEdit && (
                                <Button label="Assign permissions" icon="pi pi-plus" size="small" onClick={() => onEdit(role)} />
                            )}
                        </div>
                    ) : (
                        <>
                            {/* Find toolbar */}
                            <div className="flex flex-column gap-3 mb-4">
                                <div className="flex flex-column md:flex-row gap-2 md:align-items-center justify-content-between">
                                    <div className="p-input-icon-left w-full md:w-20rem">
                                        <i className="pi pi-search" />
                                        <InputText
                                            value={query}
                                            onChange={(e) => setQuery(e.target.value)}
                                            placeholder="Search permissions"
                                            aria-label="Search permissions"
                                            className="w-full"
                                        />
                                    </div>
                                    <div className="flex align-items-center gap-2">
                                        <span className="text-sm text-600" aria-live="polite">
                                            {visibleCount} of {permissions.length} shown
                                        </span>
                                        <Button
                                            label="Expand all"
                                            text
                                            size="small"
                                            onClick={() => setOpenTabs(grouped.map((_, i) => i))}
                                        />
                                        <Button label="Collapse all" text size="small" onClick={() => setOpenTabs([])} />
                                    </div>
                                </div>

                                {/* Category chips */}
                                <div className="flex flex-wrap gap-2" role="group" aria-label="Filter by category">
                                    {[ALL, ...Object.keys(categories)].map((cat) => {
                                        const selected = activeCategory === cat;
                                        const count = cat === ALL ? permissions.length : categories[cat];
                                        return (
                                            <Button
                                                key={cat}
                                                label={`${cat} (${count})`}
                                                size="small"
                                                rounded
                                                outlined={!selected}
                                                severity={selected ? undefined : "secondary"}
                                                aria-pressed={selected}
                                                onClick={() => setActiveCategory(cat)}
                                            />
                                        );
                                    })}
                                </div>
                            </div>

                            {/* Results */}
                            {grouped.length === 0 ? (
                                <div className="text-center p-5 surface-ground border-round-lg border-1 surface-border">
                                    <i className="pi pi-search text-4xl text-400 mb-2" />
                                    <p className="text-sm text-600 m-0 mb-3">
                                        No permissions match {query ? <>“{query}”</> : "this filter"}.
                                    </p>
                                    {filtersActive && (
                                        <Button label="Clear filters" size="small" outlined onClick={clearFilters} />
                                    )}
                                </div>
                            ) : (
                                <Accordion
                                    multiple
                                    activeIndex={openTabs}
                                    onTabChange={(e) => setOpenTabs(e.index as number[])}
                                >
                                    {grouped.map(([category, perms]) => (
                                        <AccordionTab
                                            key={category}
                                            header={
                                                <span className="flex align-items-center gap-2">
                                                    <span className="font-semibold">{category}</span>
                                                    <Tag value={perms.length} rounded severity="info" />
                                                </span>
                                            }
                                        >
                                            <div className="grid">
                                                {perms.map((perm) => (
                                                    <div key={perm.key} className="col-12 md:col-6">
                                                        <div className="p-3 surface-ground border-1 surface-border border-round-lg h-full flex flex-column gap-2">
                                                            <div className="flex align-items-center justify-content-between gap-2">
                                                                <span className="text-sm font-semibold text-900">
                                                                    {highlight(perm.name, query.trim())}
                                                                </span>
                                                                <Button
                                                                    icon="pi pi-copy"
                                                                    rounded
                                                                    text
                                                                    size="small"
                                                                    severity="secondary"
                                                                    aria-label={`Copy ${perm.name}`}
                                                                    tooltip="Copy name"
                                                                    tooltipOptions={{ position: "left" }}
                                                                    onClick={() => copyName(perm.name)}
                                                                />
                                                            </div>
                                                            {perm.description && (
                                                                <p className="text-xs text-600 m-0 line-height-3">
                                                                    {highlight(perm.description, query.trim())}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                        </AccordionTab>
                                    ))}
                                </Accordion>
                            )}
                        </>
                    )}
                </div>
            </Card>
        </div>
    );
}