import { ApiClient } from "@/api/ApiClient";
import { EntityApi } from "@/api/EntityApi";
import { Setting, sanitizeSetting } from "../models/setting.model";

export const SettingApi: Pick<EntityApi<Setting>, 'getAll' | 'update'> = {
    
    /**
     * GET /api/settings/
     * Fetches the full list of system configurations.
     */
    async getAll() {
        return ApiClient.get('/settings/');
    },

    /**
     * PATCH /api/settings/:key
     * Note: We use 'PATCH' and the unique 'key' to update settings.
     */
    async update(setting: Setting) {
        if (!setting.key) throw new Error("Setting key is required for updates");
        const sanitized = sanitizeSetting(setting);
        // Using the key in the URL as per our backend route: router.patch("/:key", ...)
        return ApiClient.patch(`/settings/${setting.key}`, sanitized);
    }
};