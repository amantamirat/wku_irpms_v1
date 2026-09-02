'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';
import { VerificationConfiguration } from './verification-conf/models/verification-conf.model';
import { VerificationConfigurationApi } from './verification-conf/api/verification-conf.api';
import VerificationManager from './conf/Manager';
import { useAuth } from '@/contexts/auth-context';

const VerificationPage = () => {
    const router = useRouter();
    const { hasPermission } = useAuth();
    const [configurations, setConfigurations] = useState<VerificationConfiguration[]>([]);
    const [selectedConfig, setSelectedConfig] = useState<VerificationConfiguration | null>(null);
    const [loadingConfigs, setLoadingConfigs] = useState<boolean>(false);

    // Fetch available Verification Configurations on load
    useEffect(() => {
        const fetchConfigurations = async () => {
            setLoadingConfigs(true);
            try {
                const data = await VerificationConfigurationApi.getAll();
                const configList = Array.isArray(data) ? data : [];
                setConfigurations(configList);
                if (configList.length > 0) {
                    setSelectedConfig(configList[0]);
                }
            } catch (error) {
                console.error('Failed to fetch verification configurations:', error);
            } finally {
                setLoadingConfigs(false);
            }
        };

        fetchConfigurations();
    }, []);

    return (
        <div className="p-4 md:p-5 surface-ground min-h-screen">

            {/* HEADER WITH NAVIGATION BUTTON */}
            <div className="mb-4 flex flex-column md:flex-row md:align-items-center justify-content-between gap-3">
                <div className="flex flex-column gap-1">
                    <h2 className="text-2xl font-bold text-900 m-0">
                        Verification Management
                    </h2>
                    <span className="text-600 text-sm">
                        Select a verification configuration to review and manage submitted verifications
                    </span>
                </div>

                {hasPermission('verification-conf:read') && (
                    <Button
                        label="Manage Configurations"
                        icon="pi pi-cog"
                        className="p-button-outlined p-button-secondary w-full md:w-auto"
                        onClick={() => router.push('verifications/verification-conf')}
                    />
                )}
            </div>

            {/* CONTROL PANEL */}
            <div className="border-round-xl surface-card shadow-1 p-4 mb-4 flex flex-column md:flex-row md:align-items-end md:justify-content-between gap-4">
                <div className="flex flex-column gap-2">
                    <label className="text-700 font-medium text-sm">
                        Select Verification Configuration
                    </label>
                    <Dropdown
                        value={selectedConfig}
                        options={configurations}
                        onChange={(e) => setSelectedConfig(e.value)}
                        optionLabel="grant.title"
                        placeholder={loadingConfigs ? "Loading configurations..." : "Choose configuration..."}
                        className="w-full md:w-20rem"
                        showClear
                        disabled={loadingConfigs}
                    />
                </div>

                {selectedConfig && (
                    <div className="text-right">
                        <div className="text-900 font-semibold">
                            {typeof selectedConfig.grant === 'object'
                                ? selectedConfig.grant?.title
                                : selectedConfig._id}
                        </div>
                        <div className="text-500 text-sm">
                            Active Configuration Filter
                        </div>
                    </div>
                )}
            </div>

            {/* MAIN CONTENT */}
            <div className="border-round-xl surface-card shadow-1 p-4 md:p-5">
                {selectedConfig ? (
                    <VerificationManager configuration={selectedConfig} />
                ) : (
                    <div className="flex flex-column align-items-center justify-content-center py-8 text-center">
                        <i className="pi pi-shield text-4xl text-300 mb-3" />
                        <h3 className="text-900 m-0 font-medium">No Configuration Selected</h3>
                        <p className="text-500 mt-2 text-sm mb-4">
                            Please select a verification configuration above to view associated submissions.
                        </p>
                    </div>
                )}
            </div>

        </div>
    );
};

export default VerificationPage;