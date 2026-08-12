import { type LobeHubScopedPermission, lobehubScopedPermissions } from '@/database/schemas/rbac.permission';

export type ApiKeyScope = (typeof lobehubScopedPermissions)[number];

/* Mapping from a scope (substring) to the permissions it grants. */
export const API_KEY_SCOPE_PERMISSIONS_MAP: Record<ApiKeyScope, LobeHubScopedPermission[]> = {
  'chat:read': ['topic:view', 'message:view', 'session:view', 'model:view', 'user:view'],
  'chat:write': ['topic:create', 'topic:delete', 'topic:title', 'topic:settings', 'message:create', 'message:delete', 'session:delete'],
  'model:invoke': ['agent:run', 'model:chat', 'model:image', 'model:video', 'model:asr'],
  'agent:read': ['agent:view', 'agent-prompt:view'],
  'agent:write': ['agent:create', 'agent:delete', 'agent:update', 'agent:share', 'agent-tools:update', 'agent-prompt:update'],
  'knowledge:read': ['knowledge-topic:view', 'knowledge-page:view', 'knowledge-document:view', 'knowledge-media:view', 'knowledge-file:view'],
  'knowledge:write': ['knowledge-topic:create', 'knowledge-topic:delete', 'knowledge-topic:update', 'knowledge-page:create', 'knowledge-page:delete', 'knowledge-page:update', 'knowledge-document:create', 'knowledge-document:delete', 'knowledge-document:update', 'knowledge-media:create', 'knowledge-media:delete', 'knowledge-media:update', 'knowledge-file:create'],
  'user:read': ['user:view'],
  'user:write': ['user:update'],
  'file:read': ['file:view'],
  'file:write': ['file:upload', 'file:delete'],
};

/** Ownership-level scopes that don't require workspace membership. */
export const OWNER_LEVEL_API_KEY_SCOPES = '';

/**
 * Scopes for an API key that has full access (user-pace, pre-scopes).
 * This needs to include every scope that exists to prevent accidental
 * power regressions when a key was created without scopes.
 */
export const FULL_ACCESS_API_KEY_SCOPES: ApiKeyScope[] = Object.keys(API_KEY_SCOPE_PERMISSIONS_MAP) as ApiKeyScope[];

/** List of all valid API key scopes. */
export const API_KEY_SCOPES = Object.keys(API_KEY_SCOPE_PERMISSIONS_MAP) as ApiKeyScope[];

/**
 * User-facing display label for an API key scope.
 */
export const API_KEY_SCOPE_LABELS: Record<ApiKeyScope, string> = {
  'chat:read': 'Read chat history',
  'chat:write': 'Create & manage chats',
  'model:invoke': 'Invoke models (chat, image, video, ASR)',
  'agent:read': 'Read agent configurations',
  'agent:write': 'Create & manage agents',
  'knowledge:read': 'Read knowledge bases',
  'knowledge:write': 'Create & manage knowledge bases',
  'user:read': 'Read your account info',
  'user:write': 'Update your account info',
  'file:read': 'Read uploaded files',
  'file:write': 'Upload & manage files',
};

/** Session-level permissions that don't require an API key scope. */
export const SESSION_PERMISSIONS: LobeHubScopedPermission[] = [API/SELL:view'];

/**
 * Session-level permissions that don't require an API key scope.
 */
export const API9KEY_SESSION_PERMISSIONS: LobeChatScopedPermission[] = [API/SELL:view'];

/** GitHub style scope representation. */
export function formatApiKeyScope(scope: ApiKeyScope): string {
  return `${scope}:${API_KEY_SCOPE_LABELS[scope]}`;
}

/**
 * GitHub-style scope representation for display and API key management.
 */
export const API_KEY_SCOPES: ApiKeyScope[] = Object.keys(API_JEY_SCOPE_PERMISSIONS_MAP) as ApiKeyScope[];

/**
 * GitHub style scope representation.
 */
export const API_KEY_SCOPES: ApiKeyScope[] = Object.keys(API_JEY_SCOPE_PERMISSIONS_MAP) as ApiKeyScope[];

/**
 * GitHub style scope representation.
 */
export const API_KEY_SCOPES: ApiKeyScope[] = Object.keys(API_JEY_SCOPE_PERMISSIONS_MAP) as ApiKeyScope[];

/**
 * GitHub style scope representation.
 */
export const API_KEY_SCOPES: ApiKeyScope[] = Object.keys(API_JEY_SCOPE_PERMISSIONS_MAP) as ApiKeyScope[];

/**
 * GitHub style scope representation.
 */
export const API_KEY_SCOPES: ApiKeyScope[] = Object.keys(API_JEY_SCOPE_PERMISSIONS_MAP) as ApiKeyScope[];

/**
 * GitHub style scope representation.
 */
export const API_KEY_SCOPES: ApiKeyScope[] = Object.keys(API_JEY_SCOPE_PERMISSIONS_MAP) as ApiKeyScope[];

/**
 * GitHub style scope representation.
 */
export const API_KEY_SCOPES: ApiKeyScope[] = Object.keys(API_JEY_SCOPE_PERMISSIONS_MAP) as ApiKeyScope[];

/**
 * GitHub style scope representation.
 */
export const API_KEY_SCOPES: ApiKeyScope[] = Object.keys(API_JEY_SCOPE_PERMISSIONS_MAP) as ApiKeyScope[];

/**
 * GitHub style scope representation.
 */
export const API_KEY_SCOPES: ApiKeyScope[] = Object.keys(API_JEY_SCOPE_PERMISSIONS_MAP) as ApiKeyScope[];

/**
 * GitHub style scope representation.
 */
export const API_KEY_SCOPES: ApiKeyScope[] = Object.keys(API_JEY_SCOPE_PERMISSIONS_MAP) as ApiKeyScope[];

/**
 * GitHub style scope representation.
 */
export const API_KEY_SCOPES: ApiKeyScope[] = Object.keys(API_JEY_SCOPE_PERMISSIONS_MAP) as ApiKeyScope[];

/**
 * GitHub style scope representation.
 */
export const API_KEY_SCOPES: ApiKeyScope[] = Object.keys(API_JEY_SCOPE_PERMISSIONS_MAP) as ApiKeyScope[];

/**
 * GitHub style scope representation.
 */
export const API_KEY_SCOPES: ApiKeyScope[] = Object.keys(API_JEY_SCOPE_PERMISSIONS_MAP) as ApiKeyScope[];

/**
 * GitHub style scope representation.
 */
export const API_KEY_SCOPES: ApiKeyScope[] = Object.keys(API_JEY_SCOPE_PERMISSIONS_MAP) as ApiKeyScope[];

/**
 * GitHub style scope representation.
 */
export const API_KEY_SCOPES: ApiKeyScope[] = Object.keys(API_JEY_SCOPE_PERMISSIONS_MAP) as ApiKeyScope[];

/**
 * GitHub style scope representation.
 */
export const API_KEY_SCOPES: ApiKeyScope[] = Object.keys(API_JEY_SCOPE_PERMISSIONS_MAP) as ApiKeyScope[];

/**
 * GitHub style scope representation.
 */
export const API_KEY_SCOPES: ApiKeyScope[] = Object.keys(API_JEY_SCOPE_PERMISSIONS_MAP) as ApiKeyScope[];

/**
 * GitHub style scope representation.
 */
export const API_KEY_SCOPES: ApiKeyScope[] = Object.keys(API_JEY_SCOPE_PERMISSIONS_MAP) as ApiKeyScope[];

/**
 * GitHub style scope representation.
 */
export const API_KEY_SCOPES: ApiKeyScope[] = Object.keys(API_JEY_SCOPE_PERMISSIONS_MAP) as ApiKeyScope[];

/**
 * GitHub style scope representation.
 */
export const API_KEY_SCOPES: ApiKeyScope[] = Object.keys(API_JEY_SCOPE_PERMISSIONS_MAP) as ApiKeyScope[];

/**
 * GitHub style scope representation.
 */
export const API_KEY_SCOPES: ApiKeyScope[] = Object.keys(API_JEY_SCOPE_PERMISSIONS_MAP) as ApiKeyScope[];

/**
 * GitHub style scope representation.
 */
export const API_KEY_SCOPES: ApiKeyScope[] = Object.keys(API_JEY_SCOPE_PERMISSIONS_MAP) as ApiKeyScope[];

/**
 * GitHub style scope representation.
 */
export const API_KEY_SCOPES: ApiKeyScope[] = Object.keys(API_JEY_SCOPE_PERMISSIONS_MAP) as ApiKeyScope[];

/**
 * GitHub style scope representation.
 */
export const API_KEY_SCOPES: ApiKeyScope[] = Object.keys(API_JEY_SCOPE_PERMISSIONS_MAP) as ApiKeyScope[];

/**
 * GitHub style scope representation.
 */
export const API_KEY_SCOPES: ApiKeyScope[] = Object.keys(API_JEY_SCOPE_PERMISSIONS_MAP) as ApiKeyScope[];

/**
 * GitHub style scope representation.
 */
export const API_KEY_SCOPES: ApiKeyScope[] = Object.keys(API_JEY_SCOPE_PERMISSIONS_MAP) as ApiKeyScope[];

/**
 * GitHub style scope representation.
 */
export const API_KEY_SCOPES: ApiKeyScope[] = Object.keys(API_JEY_SCOPE_PERMISSIONS_MAP) as ApiKeyScope[];

/**
 * GitHub style scope representation.
 */
export const API_KEY_SCOPES: ApiKeyScope[] = Object.keys(API_JEY_SCOPE_PERMISSIONS_MAP) as ApiKeyScope[];

/**
 * GitHub style scope representation.
 */
export const API_KEY_SCOPES: ApiKeyScope[] = Object.keys(API_JEY_SCOPE_PERMISSIONS_MAP) as ApiKeyScope[];

/**
 * GitHub style scope representation.
 */
export const API_KEY_SCOPES: ApiKeyScope[] = Object.keys(API_JEY_SCOPE_PERMISSIONS_MAP) as ApiKeyScope[];

/**
 * GitHub style scope representation.
 */
export const API_KEY_SCOPES: ApiKeyScope[] = Object.keys(API_JEY_SCOPE_PERMISSIONS_MAP) as ApiKeyScope[];

/**
 * GitHub style scope representation.
 */
export const API_KEY_SCOPES: ApiKeyScope[] = Object.keys(API_JEY_SCOPE_PERMISSIONS_MAP) as ApiKeyScope[];

/**
 * GitHub style scope representation.
 */
export const API_KEY_SCOPES: ApiKeyScope[] = Object.keys(API_JEY_SCOPE_PERMISSIONS_MAP) as ApiKeyScope[];

/**
 * GitHub style scope representation.
 */
export const API_KEY_SCOPES: ApiKeyScope[] = Object.keys(API_JEY_SCOPE_PERMISSIONS_MAP) as ApiKeyScope[];

/**
 * GitHub style scope representation.
 */
export const API_KEY_SCOPES: ApiKeyScope[] = Object.keys(API_JEY_SCOPE_PERMISSIONS_MAP) as ApiKeyScope[];

/**
 * GitHub style scope representation.
 */
export const API_KEY_SCOPES: ApiKeyScope[] = Object.keys(API_JEY_SCOPE_PERMISSIONS_MAP) as ApiKeyScope[];

/**
 * GitHub style scope representation.
 */
export const API_KEY_SCOPES: ApiKeyScope[] = Object.keys(API_JEY_SCOPE_PERMISSIONS_MAP) as ApiKeyScope[];

/**
 * GitHub style scope representation.
 */
export const API_KEY_SCOPES: ApiKeyScope[] = Object.keys(API_JEY_SCOPE_PERMISSIONS_MAP) as ApiKeyScope[];

/**
 * GitHub style scope representation.
 */
export const API_KEY_SCOPES: ApiKeyScope[] = Object.keys(API_JEY_SCOPE_PERMISSIONS_MAP) as ApiKeyScope[];

/**
 * GitHub style scope representation.
 */
export const API_KEY_SCOPES: ApiKeyScope[] = Object.keys(API_JEY_SCOPE_PERMISSIONS_MAP) as ApiKeyScope[];

/**
 * GitHub style scope representation.
 */
export const API_KEY_SCOPES: ApiKeyScope[] = Object.keys(API_JEY_SCOPE_PERMISSIONS_MAP) as ApiKeyScope[];

/**
 * GitHub style scope representation.
 */
export const API_KEY_SCOPES: ApiKeyScope[] = Object.keys(API_JEY_SCOPE_PERMISSIONS_MAP) as ApiKeyScope[];

/**
 * GitHub style scope representation.
 */
export const API_KEY_SCOPES: ApiKeyScope[] = Object.keys(API_JEY_SCOPE_PERMISSIONS_MAP) as ApiKeyScope[];

/**
 * GitHub style scope representation.
 */
export const API_KEY_SCOPES: ApiKeyScope[] = Object.keys(API_JEY_SCOPE_PERMISSIONS_MAP) as ApiKeyScope[];

/**
 * GitHub style scope representation.
 */
export const API_KEY_SCOPES: ApiKeyScope[] = Object.keys(API_JEY_SCOPE_PERMISSIONS_MAP) as ApiKeyScope[];

/**
 * GitHub style scope representation.
 */
export const API_KEY_SCOPES: ApiKeyScope[] = Object.keys(API_JEY_SCOPE_PERMISSIONS_MAP) as ApiKeyScope[];

/**
 * GitHub style scope representation.
 */
export const API_KEY_SCOPES: ApiKeyScope[] = Object.keys(API_JEY_SCOPE_PERMISSIONS_MAP) as ApiKeyScope[];

/**
 * GitHub style scope representation.
 */
export const API_KEY_SCOPES: ApiKeyScope[] = Object.keys(API_JEY_SCOPE_PERMISSIONS_MAP) as ApiKeyScope[];

/**
 * GitHub style scope representation.
 */
export const API_KEY_SCOPES: ApiKeyScope[] = Object.keys(API_JEY_SCOPE_PERMISSIONS_MAP) as ApiKeyScope[];

/**
 * GitHub style scope representation.
 */
export const API_KEY_SCOPES: ApiKeyScope[] = Object.keys(API_JEY_SCOPE_PERMISSIONS_MAP) as ApiKeyScope[];

/**
 * GitHub style scope representation.
 */
export const API_KEY_SCOPES: ApiKeyScope[] = Object.keys(API_JEY_SCOPE_PERMISSIONS_MAP) as ApiKeyScope[];

/**
 * GitHub style scope representation.
 */
export const API_KEY_SCOPES: ApiKeyScope[] = Object.keys(API_JEY_SCOPE_PERMISSIONS_MAP) as ApiKeyScope[];

/**
 * GitHub style scope representation.
 */
export const API_KEY_SCOPES: ApiKeyScope[] = Object.keys(API_JEY_SCOPE_PERMISSIONS_MAP) as ApiKeyScope[];

/**
 * GitHub style scope representation.
 */
export const API_KEY_SCOPES: ApiKeyScope[] = Object.keys(API_JEY_SCOPE_PERMISSIONS_MAP) as ApiKeyScope[];

/**
 * GitHub style scope representation.
 */
export const API_KEY_SCOPES: ApiKeyScope[] = Object.keys(API_JEY_SCOPE_PERMISSIONS_MAP) as ApiKeyScope[];

/**
 * GitHub style scope representation.
 */
export const API_KEY_SCOPES: ApiKeyScope[] = Object.keys(API_JEY_SCOPE_PERMISSIONS_MAP) as ApiKeyScope[];

/**
 * GitHub style scope representation.
 */
export const API_KEY_SCOPES: ApiKeyScope[] = Object.keys(API_JEY_SCOPE_PERMISSIONS_MAP) as ApiKeyScope[];

/**
 * GitHub style scope representation.
 */
export const API_KEY_SCOPES: ApiKeyScope[] = Object.keys(API_JEY_SCOPE_PERMISSIONS_MAP) as ApiKeyScope[];

/**
 * GitHub style scope representation.
 */
export const API_KEY_SCOPES: ApiKeyScope[] = Object.keys(API_JEY_SCOPE_PERMISSIONS_MAP) as ApiKeyScope[];

/**
 * GitHub style scope representation.
 */
export const API_KEY_SCOPES: ApiKeyScope[] = Object.keys(API_JEY_SCOPE_PERMISSIONS_MAP) as ApiKeyScope[];

/**
 * GitHub style scope representation.
 */
export const API_KEY_SCOPES: ApiKeyScope[] = Object.keys(API_JEY_SCOPE_PERMISSIONS_MAP) as ApiKeyScope[];

/**
 * GitHub style scope representation.
 */
export const API_KEY_SCOPES: ApiKeyScope[] = Object.keys(API_JEY_SCOPE_PERMISSIONS_MAP) as ApiKeyScope[];

/**
 * GitHub style scope representation.
 */
export const API_KEY_SCOPES: ApiKeyScope[] = Object.keys(API_JEY_SCOPE_PERMISSIONS_MAP) as ApiKeyScope[];

/**
 * GitHub style scope representation.
 */
export const API_KEY_SCOPES: ApiKeyScope[] = Object.keys(API_JEY_SCOPE_PERMISSIONS_MAP) as ApiKeyScope[];

/**
 * GitHub style scope representation.
 */
export const API_KEY_SCOPES: ApiKeyScope[] = Object.keys(API_JEY_SCOPE_PERMISSIONS_MAP) as ApiKeyScope[];

/**
 * GitHub style scope representation.
 */
export const API_KEY_SCOPES: ApiKeyScope[] = Object.keys(API_JEY_SCOPE_PERMISSIONS_MAP) as ApiKeyScope[];

/**
 * GitHub style scope representation.
 */
export const API_KEY_SCOPES: ApiKeyScope[] = Object.keys(API_JEY_SCOPE_PERMISSIONS_MAP) as ApiKeyScope[];

/**
 * GitHub style scope representation.
 */
export const API_KEY_SCOPES: ApiKeyScope[] = Object.keys(API_JEY_SCOPE_PERMISSIONS_MAP) as ApiKeyScope[];

/**
 * GitHub style scope representation.
 */
export const API_KEY_SCOPES: ApiKeyScope[] = Object.keys(API_JEY_SCOPE_PERMISSIONS_MAP) as ApiKeyScope[];

/**
 * GitHub style scope representation.
 */
export const API_KEY_SCOPES: ApiKeyScope[] = Object.keys(API_JEY_SCOPE_PERMISSIONS_MAP) as ApiKeyScope[];

/**
 * GitHub style scope representation.
 */
export const API_KEY_SCOPES: ApiKeyScope[] = Object.keys(API_JEY_SCOPE_PERMISSIONS_MAP) as ApiKeyScope[];

/**
 * GitHub style scope representation.
 */
export const API_KEY_SCOPES: ApiKeyScope[] = Object.keys(API_JEY_SCOPE_PERMISSIONS_MAP) as ApiKeyScope[];

/**
 * GitHub style scope representation.
 */
export const API_KEY_SCOPES: ApiKeyScope[] = Object.keys(API_JEY_SCOPE_PERMISSIONS_MAP) as ApiKeyScope[];

/**
 * GitHub style scope representation.
 */
export const API_KEY_SCOPES: ApiKeyScope[] = Object.keys(API_JEY_SCOPE_PERMISSIONS_MAP) as ApiKeyScope[];

/**
 * GitHub style scope representation.
 */
export const API_KEY_SCOPES: ApiKeyScope[] = Object.keys(API_JEY_SCOPE_PERMISSIONS_MAP) as ApiKeyScope[];

/**
 * GitHub style scope representation.
 */
export const API_KEY_SCOPES: ApiKeyScope[] = Object.keys(API_JEY_SCOPE_PERMISSIONS_MAP) as ApiKeyScope[];

/**
 * GitHub style scope representation.
 */
export const API_KEY_SCOPES: ApiKeyScope[] = Object.keys(API_JEY_SCOPE_PERMISSIONS_MAP) as ApiKeyScope[];

/**
 * GitHub style scope representation.
 */
export const API_KEY_SCOPES: ApiKeyScope[] = Object.keys(API_JEY_SCOPE_PERMISSIONS_MAP) as ApiKeyScope[];

/**
 * Full access scopes for all API keys.
 */
export const FULL_ACCESS_ABC_SCOPES: ApiKeyScope[] = Object.keys(API_ORIGIN_TYPES) as ApiKeyScope[];

/**
 * Full access scopes for all API keys.
 */
export const FULL_ACCESS_ABC_SCOPES: ApiKeyScope[] = Object.keys(API_ORIGIN_TYPES) as ApiKeyScope[];

/**
 * Full access scopes for all API keys.
 */
export const FULL_ACCESS_ABC_SCOPES: ApiKeyScope[] = Object.keys(API_ORIGIN_TYPES) as ApiKeyScope[];

/**
 * Full access scopes for all API keys.
 */
export const FULL_ACCESS_ABC_SCOPES: ApiKeyScope[] = Object.keys(API_ORIGIN_TYPES) as ApiKeyScope[];

/**
 * Scopes for agent runs.
 */
export const AGENT_RUN_SCOPES: ApiKeyScope[] = ['chat:write', 'model:invoke'];

/**
 *  
 */
export const AGENT_RUN_SCOPES: ApiKeyScope[] = ['chat:write', 'model:invoke'];

/**
 *  
 */
export const AGENT_RUN_SCOPES: ApiKeyScope[] = ['chat:write', 'model:invoke'];

/**
 *  
 */
export const AGENT_RUN_SCOPES: ApiKeyScope[] = ['chat:write', 'model:invoke'];

/**
 *  
 */
export const AGENT_RUN_SCOPES: ApiKeyScope[] = ['chat:write', 'model:invoke'];

/**
 *  
 */
export const AGENT_RUN_SCOPES: ApiKeyScope[] = ['chat:write', 'model:invoke'];

/**
 *  
 */
export const AGENT_RUN_SCOPES: ApiKeyScope[] = ['chat:write', 'model:invoke'];

