'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Dropdown } from 'primereact/dropdown';
import { Button } from 'primereact/button';

import { useAuth } from '@/contexts/auth-context';

import { VerificationConfiguration } from './verification-conf/models/verification-conf.model';
import { VerificationConfigurationApi } from './verification-conf/api/verification-conf.api';
import VerificationManager from './components/VerificationManager';

const VerificationPage = () => {
    const router = useRouter();
    const { hasPermission } = useAuth();

    const canReadConfs = hasPermission('verification-conf:read');

    const [configurations, setConfigurations] = useState<
        VerificationConfiguration[]
    >([]);
    const [selectedConfig, setSelectedConfig] =
        useState<VerificationConfiguration | null>(null);
    const [loadingConfigs, setLoadingConfigs] = useState<boolean>(true);
    const [configError, setConfigError] = useState<string | null>(null);

    useEffect(() => {
        let cancelled = false;

        const fetchConfigurations = async () => {
            setLoadingConfigs(true);
            setConfigError(null);

            try {
                const data = await VerificationConfigurationApi.lookup!();
                const configList = Array.isArray(data) ? data : [];

                if (cancelled) return;

                setConfigurations(configList);
                setSelectedConfig((previous) => {
                    if (!previous) return configList[0] ?? null;

                    return (
                        configList.find(
                            (config) => config._id === previous._id
                        ) ?? configList[0] ?? null
                    );
                });
            } catch (error) {
                if (cancelled) return;

                console.error(
                    'Failed to fetch verification configurations:',
                    error
                );

                setConfigurations([]);
                setSelectedConfig(null);
                setConfigError('Failed to load verification configurations.');
            } finally {
                if (!cancelled) {
                    setLoadingConfigs(false);
                }
            }
        };

        fetchConfigurations();

        return () => {
            cancelled = true;
        };
    }, []);

    const getConfigurationLabel = (
        configuration: VerificationConfiguration
    ): string => {
        const grant = configuration.grant;

        if (typeof grant === 'object' && grant !== null) {
            return grant.title ?? configuration._id ?? 'Untitled configuration';
        }

        return configuration._id ?? 'Untitled configuration';
    };

    return (
        <div className="p-4 md:p-5 surface-ground min-h-screen">
            {/* Header */}
            <div className="mb-4 flex flex-column md:flex-row md:align-items-center justify-content-between gap-3">
                <div className="flex flex-column gap-1">
                    <h2 className="text-2xl font-bold text-900 m-0">
                        Verification Management
                    </h2>

                    <span className="text-600 text-sm">
                        Select a verification configuration to review and
                        manage submitted verifications.
                    </span>
                </div>

                {canReadConfs && (
                    <Button
                        label="Manage Configurations"
                        icon="pi pi-cog"
                        className="p-button-outlined p-button-secondary w-full md:w-auto"
                        onClick={() =>
                            router.push('/verifications/verification-conf')
                        }
                    />
                )}
            </div>

            {/* Configuration Selector */}
            <div className="border-round-xl surface-card shadow-1 p-4 mb-4 flex flex-column md:flex-row md:align-items-end md:justify-content-between gap-4">
                <div className="flex flex-column gap-2 w-full md:w-auto">
                    <label
                        htmlFor="verification-configuration"
                        className="text-700 font-medium text-sm"
                    >
                        Select Verification Configuration
                    </label>

                    <Dropdown
                        inputId="verification-configuration"
                        value={selectedConfig}
                        options={configurations}
                        onChange={(event) =>
                            setSelectedConfig(
                                event.value as VerificationConfiguration | null
                            )
                        }
                        optionLabel="_id"
                        dataKey="_id"
                        itemTemplate={(
                            option: VerificationConfiguration
                        ) => (
                            <span>{getConfigurationLabel(option)}</span>
                        )}
                        valueTemplate={(
                            option: VerificationConfiguration | null
                        ) =>
                            option ? (
                                <span>{getConfigurationLabel(option)}</span>
                            ) : (
                                <span className="text-500">
                                    Choose configuration...
                                </span>
                            )
                        }
                        placeholder={
                            loadingConfigs
                                ? 'Loading configurations...'
                                : 'Choose configuration...'
                        }
                        className="w-full md:w-20rem"
                        showClear
                        disabled={loadingConfigs}
                    />

                    {configError && (
                        <small className="text-red-500">
                            {configError}
                        </small>
                    )}
                </div>

                {selectedConfig && (
                    <div className="text-left md:text-right">
                        <div className="text-900 font-semibold">
                            {getConfigurationLabel(selectedConfig)}
                        </div>

                        <div className="text-500 text-sm">
                            Active Configuration Filter
                        </div>
                    </div>
                )}
            </div>

            {/* Verification List */}
            <div className="border-round-xl surface-card shadow-1 p-4 md:p-5">
                {loadingConfigs ? (
                    <div className="flex flex-column align-items-center justify-content-center py-6">
                        <i className="pi pi-spin pi-spinner text-3xl text-primary mb-3" />
                        <span className="text-600">
                            Loading verification configurations...
                        </span>
                    </div>
                ) : configError ? (
                    <div className="flex flex-column align-items-center justify-content-center py-6 text-center">
                        <i className="pi pi-exclamation-circle text-4xl text-red-400 mb-3" />

                        <h3 className="text-900 m-0 font-medium">
                            Unable to Load Configurations
                        </h3>

                        <p className="text-500 mt-2 text-sm">
                            Please try again later or contact your system
                            administrator.
                        </p>

                        <Button
                            label="Retry"
                            icon="pi pi-refresh"
                            outlined
                            onClick={() => {
                                setConfigError(null);
                                setLoadingConfigs(true);

                                VerificationConfigurationApi.lookup!()
                                    .then((data) => {
                                        const list = Array.isArray(data)
                                            ? data
                                            : [];

                                        setConfigurations(list);
                                        setSelectedConfig(
                                            list[0] ?? null
                                        );
                                    })
                                    .catch((error) => {
                                        console.error(
                                            'Failed to fetch verification configurations:',
                                            error
                                        );
                                        setConfigError(
                                            'Failed to load verification configurations.'
                                        );
                                    })
                                    .finally(() => setLoadingConfigs(false));
                            }}
                        />
                    </div>
                ) : selectedConfig ? (
                    <VerificationManager
                        key={selectedConfig._id}
                        configuration={selectedConfig}
                    />
                ) : (
                    <div className="flex flex-column align-items-center justify-content-center py-8 text-center">
                        <i className="pi pi-shield text-4xl text-300 mb-3" />

                        <h3 className="text-900 m-0 font-medium">
                            No Configuration Selected
                        </h3>

                        <p className="text-500 mt-2 text-sm mb-4">
                            {configurations.length === 0
                                ? 'No verification configurations are available.'
                                : 'Please select a verification configuration above to view its associated submissions.'}
                        </p>

                        {configurations.length > 0 && (
                            <Button
                                label="Select Configuration"
                                icon="pi pi-list"
                                outlined
                                onClick={() =>
                                    setSelectedConfig(configurations[0])
                                }
                            />
                        )}
                    </div>
                )}
            </div>
        </div>
    );
};

export default VerificationPage;
