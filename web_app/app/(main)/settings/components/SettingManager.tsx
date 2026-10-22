'use client';

import { ItemManager } from '@/components/ItemManager';
import { useToast } from '@/contexts/ToastContext';
import { ColumnProps } from 'primereact/column';
import { Tag } from 'primereact/tag';
import { SettingApi } from '../api/setting.api';
import { Setting } from '../models/setting.model';
import SettingForm from './SettingForm';
import { MENU_ICONS } from '@/utils/menu-icons';

// Helper to format the value column based on the setting type
const valueTemplate = (s: Setting) => {
    if (s.type === 'boolean') {
        return <Tag severity={s.value ? "success" : "danger"} value={s.value ? "ON" : "OFF"} />;
    }
    if (s.type === 'number') {
        return <span className="font-mono font-bold text-blue-600">{s.value}</span>;
    }
    return <span>{String(s.value)}</span>;
};

const columns: ColumnProps[] = [
    {
        header: "Setting Key",
        field: "key",
        body: (s: Setting) => <b className="text-uppercase">{s.key.replace(/_/g, ' ')}</b>,
        sortable: true
    },
    {
        header: "Current Value",
        body: valueTemplate
    },
    {
        header: "Description",
        field: "description",
        style: { fontSize: '0.85rem', color: '#666' },
        sortable: true
    }
];

export default function SettingManager() {
    const toast = useToast();

    return (
        <ItemManager<Setting>
            api={SettingApi}
            resource="setting"
            itemName="Setting"
            headerTitle="System Configurations"
            itemIcon={MENU_ICONS.settings}
            columns={columns}
            dialogWidth="450px"
            // Settings are pre-seeded/updated only, so we disable creation if desired, or omit createNew
            hideCreateAction
            renderForm={(props) => <SettingForm {...props} />}
            onError={(error) => toast.error(error)}
            onSuccess={() => toast.success("Configuration updated successfully")}
        />
    );
}