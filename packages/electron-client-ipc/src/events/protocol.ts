import type { McpInstallSchema } from '../types';
import type { ProviderImportRequest } from '../types/providerImport';

/**
 * Protocol installation related Broadcast events (main process -> renderer process)
 */
export interface ProtocolBroadcastEvents {
  /**
   * MCP plugin installation request event
   * Sent to frontend after main process parses protocol URL
   */
  mcpInstallRequest: (data: {
    /** Market source ID */
    marketId?: string;
    /** Plugin ID */
    pluginId: string;
    /** MCP Schema object */
    schema: McpInstallSchema;
  }) => void;
  /**
   * Provider import request event.
   * The main process only emits ready payloads after a bounded loopback callback succeeds.
   */
  providerImportRequest: (data: ProviderImportRequest) => void;
}
