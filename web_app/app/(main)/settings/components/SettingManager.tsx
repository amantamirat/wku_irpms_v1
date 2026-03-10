import { createEntityManager } from "@/components/createEntityManager";
import { Setting, SettingKey } from "../models/setting.model";
import SaveSetting from "./SaveSetting";
import { SettingApi } from "../api/setting.api";
import { Tag } from "primereact/tag";

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

export default createEntityManager<Setting>({
    title: "System Configurations",
    itemName: "Setting",
    api: SettingApi as any, // Cast to any if EntityApi expects 'create'
    columns: [
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
    ],
    // createNew is omitted because settings are pre-seeded
    SaveDialog: SaveSetting,
    permissionPrefix: "setting"
});