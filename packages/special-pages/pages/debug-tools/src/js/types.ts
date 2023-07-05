import { RemoteResource, Tab, UpdateResourceParams, GetFeaturesResponse } from '../../schema/__generated__/schema.types'
import { ActorRefFrom } from 'xstate'
import { appMachine } from './app/app.machine-impl'

export type AppEvents =
  | { type: 'routes resolved' }
  | { type: 'nav_internal', match: string, params: Record<string, unknown> | null, search: string }
  | { type: 'nav-default', feature: string }
  | { type: 'tabs loaded', payload: Tab[] }
  | { type: '👆 retry' }
  | { type: 'Event 1' }
  | { type: '👆 save modifications' }
  | { type: '✏️ edits' }
  | { type: 'error' }
  | { type: 'clearErrors' }

export type RemoteResourcesEvents =
  | { type: 'set editor kind', payload: 'diff' | 'inline' }
  | { type: 'error' }
  | { type: 'nav_resource' }
  | { type: 'nav_other' }
  | { type: 'clearErrors' }
  | { type: 'hide url editor' }
  | { type: 'show url editor' }

  // content
  | { type: 'content was reverted' }
  | { type: 'content was edited' }
  | { type: 'content is invalid', markers: import('monaco-editor').editor.IMarker[] }
  | { type: 'content is valid' }

  | { type: 'save new remote', payload: UpdateResourceParams }
  | { type: 'save edited', payload: UpdateResourceParams }

export interface RemoteResourcesCtx {
  messages: import('./DebugToolsMessages.mjs').DebugToolsMessages,
  parent: ActorRefFrom<typeof appMachine>,
  error?: string | null
  editorKind?: 'inline' | 'diff' | 'toggles'
  resourceKey?: number
  resources?: RemoteResource[]
  currentResource?: import('./remote-resources/remote-resources.machine').CurrentResource
  contentMarkers?: import('monaco-editor').editor.IMarker[]
}

export interface RouteDefinition {
  loader: (...args: unknown[]) => unknown;
  title: string;
  feature: string;
}

export interface AppMachineCtx {
  history: import('history').History,
  messages: import('./DebugToolsMessages.mjs').DebugToolsMessages,
  routes: Record<string, RouteDefinition>,
  error: string | null,
  features: GetFeaturesResponse['features'] | null,
  params: Record<string, unknown> | null,
  search: URLSearchParams | null,
  match: string | null,
  page: RouteDefinition['loader'] | null
}
