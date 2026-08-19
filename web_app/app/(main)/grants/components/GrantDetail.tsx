'use client';

import React, { useEffect, useState } from "react";
import { Grant } from "../models/grant.model";
import { VerificationConfigurationApi } from "../../verifications/verification-conf/api/verification-conf.api";
import VerificationConfigForm from "../../verifications/verification-conf/components/VerificationConfigForm";
import { VerificationConfiguration } from "../../verifications/verification-conf/models/verification-conf.model";

export default function GrantDetail({ grant }: { grant: Grant }) {
    const [config, setConfig] = useState<VerificationConfiguration | null>(null);
    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);

    const fetchConfig = async () => {
        setLoading(true);
        try {
            const res = await VerificationConfigurationApi.getAll({
                grant: grant._id,
                populate: true,
            } as any);
            // Handle array or single object response
            const items = Array.isArray(res) ? res : (res as any)?.data || [];
            setConfig(items.length > 0 ? items[0] : null);
        } catch (err) {
            console.error("Failed to fetch verification config", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (grant._id) fetchConfig();
    }, [grant._id]);

    return (
        <div className="p-4 bg-gray-50 rounded-lg space-y-4">
            <div className="flex justify-between items-center border-b pb-2">
                <h4 className="font-bold text-gray-700">Verification Configuration</h4>
                {config && !isEditing && (
                    <button
                        onClick={() => setIsEditing(true)}
                        className="text-xs bg-gray-200 hover:bg-gray-300 px-3 py-1 rounded"
                    >
                        Edit Config
                    </button>
                )}
            </div>

            {loading ? (
                <p className="text-sm text-gray-500">Loading configuration...</p>
            ) : isEditing || !config ? (
                <VerificationConfigForm
                    grantId={grant._id!}
                    initialConfig={config}
                    onSaved={(updated) => {
                        setConfig(updated);
                        setIsEditing(false);
                    }}
                />
            ) : (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm bg-white p-3 rounded border">
                    <div>
                        <span className="text-gray-500 block">Min Reviewers</span>
                        <span className="font-medium">{config.minReviewers ?? "N/A"}</span>
                    </div>
                    <div>
                        <span className="text-gray-500 block">Max Reviewers</span>
                        <span className="font-medium">{config.maxReviewers ?? "N/A"}</span>
                    </div>
                    <div>
                        <span className="text-gray-500 block">Max Attempts</span>
                        <span className="font-medium">{config.maxAttempts ?? "N/A"}</span>
                    </div>
                    <div>
                        <span className="text-gray-500 block">Status</span>
                        <span className="font-medium">{config.status ?? "Draft"}</span>
                    </div>
                </div>
            )}
        </div>
    );
}