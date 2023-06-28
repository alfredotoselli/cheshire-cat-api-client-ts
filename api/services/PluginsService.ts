/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
import type { BodyUploadPlugin } from '../models/BodyUploadPlugin';
import type { DeleteResponse } from '../models/DeleteResponse';
import type { Plugin } from '../models/Plugin';
import type { PluginResponse } from '../models/PluginResponse';
import type { PluginsList } from '../models/PluginsList';

import type { CancelablePromise } from '../core/CancelablePromise';
import type { BaseHttpRequest } from '../core/BaseHttpRequest';

export class PluginsService {

    constructor(public readonly httpRequest: BaseHttpRequest) {}

    /**
     * List Available Plugins
     * List available plugins
     * @returns PluginsList Successful Response
     * @throws ApiError
     */
    public listAvailablePlugins(): CancelablePromise<PluginsList> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/plugins/',
        });
    }

    /**
     * Upload Plugin
     * Install a new plugin from a zip file
     * @param formData 
     * @returns PluginResponse Successful Response
     * @throws ApiError
     */
    public uploadPlugin(
formData: BodyUploadPlugin,
): CancelablePromise<PluginResponse> {
        return this.httpRequest.request({
            method: 'POST',
            url: '/plugins/upload/',
            formData: formData,
            mediaType: 'multipart/form-data',
            errors: {
                422: `Validation Error`,
            },
        });
    }

    /**
     * Toggle Plugin
     * Enable or disable a single plugin
     * @param pluginId 
     * @returns any Successful Response
     * @throws ApiError
     */
    public togglePlugin(
pluginId: string,
): CancelablePromise<Record<string, any>> {
        return this.httpRequest.request({
            method: 'PUT',
            url: '/plugins/toggle/{plugin_id}',
            path: {
                'plugin_id': pluginId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }

    /**
     * Get Plugin Details
     * Returns information on a single plugin
     * @param pluginId 
     * @returns any Successful Response
     * @throws ApiError
     */
    public getPluginDetails(
pluginId: string,
): CancelablePromise<{
status: string;
data: Plugin;
}> {
        return this.httpRequest.request({
            method: 'GET',
            url: '/plugins/{plugin_id}',
            path: {
                'plugin_id': pluginId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }

    /**
     * Delete Plugin
     * Physically remove a plugin
     * @param pluginId 
     * @returns DeleteResponse Successful Response
     * @throws ApiError
     */
    public deletePlugin(
pluginId: string,
): CancelablePromise<DeleteResponse> {
        return this.httpRequest.request({
            method: 'DELETE',
            url: '/plugins/{plugin_id}',
            path: {
                'plugin_id': pluginId,
            },
            errors: {
                422: `Validation Error`,
            },
        });
    }

}
