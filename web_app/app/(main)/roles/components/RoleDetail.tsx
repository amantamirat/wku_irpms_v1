import React, { useEffect, useState } from "react";
import { Role } from "../models/role.model";
import { RoleApi } from "../api/role.api";

interface RoleDetailProps {
    roleId: string;
}

export default function RoleDetail({ roleId }: RoleDetailProps) {
    const [role, setRole] = useState<Role | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        let isMounted = true;

        const fetchRole = async () => {
            try {
                setLoading(true);
                setError(null);
                // Adjust method name if your API uses a different naming convention (e.g., getById)
                const data = await RoleApi.getById!(roleId);
                if (isMounted) {
                    setRole(data);
                }
            } catch (err) {
                if (isMounted) {
                    setError("Failed to load role details.");
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        if (roleId) {
            fetchRole();
        }

        return () => {
            isMounted = false;
        };
    }, [roleId]);

    if (loading) {
        return (
            <div className="p-6 text-center text-gray-500 animate-pulse">
                Loading role details...
            </div>
        );
    }

    if (error || !role) {
        return (
            <div className="p-6 text-center text-red-500 bg-red-50 rounded-lg border border-red-200">
                {error || "Role not found."}
            </div>
        );
    }

    const permissions = role.permissions || [];

    return (
        <div className="space-y-4 p-6 bg-white rounded-lg shadow-sm border border-gray-200">
            {/* Header Information */}
            <div className="border-b border-gray-100 pb-4">
                <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-gray-900">{role.name}</h3>
                    {role.isDefault && (
                        <span className="px-2.5 py-0.5 text-xs font-semibold bg-blue-50 text-blue-700 rounded-full border border-blue-200">
                            Default Role
                        </span>
                    )}
                </div>
            </div>

            {/* Permissions List Section */}
            <div>
                <h4 className="text-sm font-semibold text-gray-800 mb-3 uppercase tracking-wider">
                    Assigned Permissions ({permissions.length})
                </h4>

                {permissions.length === 0 ? (
                    <p className="text-sm text-gray-400 italic bg-gray-50 p-3 rounded-md text-center">
                        No permissions currently assigned to this role.
                    </p>
                ) : (
                    <div className="flex flex-wrap gap-2">
                        {permissions.map((perm, index) => {
                            // Safely extract name whether `perm` is a string or an object
                            const permName = typeof perm === "string" ? perm : (perm as any).name || (perm as any).key;
                            const permKey = typeof perm === "string" ? perm : (perm as any)._id || index;

                            return (
                                <span
                                    key={permKey}
                                    className="inline-flex items-center px-3 py-1 rounded-md text-xs font-medium bg-gray-100 text-gray-700 border border-gray-200 shadow-2xs"
                                >
                                    {permName}
                                </span>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}