import { describe, it } from 'node:test'
import { readFileSync } from 'node:fs'
import { deepEqual } from 'node:assert'
import { join } from 'path'
import { cwd } from '../../../../../scripts/script-utils.js'
import {
    getFeaturesResponseSchema,
    getTabsResponseSchema,
    updateResourceParamsSchema
} from './__generated__/schema.parsers.mjs'
import { DebugToolsMessages } from '../src/js/DebugToolsMessages.mjs'
import { Messaging, MessagingContext, TestTransportConfig } from '@duckduckgo/messaging'
const CWD = cwd(import.meta.url)

const getFeaturesJSON = JSON.parse(readFileSync(join(CWD, '__fixtures__/__getFeatures__.json'), 'utf8'))
const getFeatures = getFeaturesResponseSchema.parse(getFeaturesJSON);

const updateResourceDebugToolsJSON = JSON.parse(readFileSync(join(CWD, '__fixtures__/__updateResourceDebugTools__.json'), 'utf8'))
const updateResourceDebugTools = updateResourceParamsSchema.parse(updateResourceDebugToolsJSON);


const updateResourceRemoteJSON = JSON.parse(readFileSync(join(CWD, '__fixtures__/__updateResourceRemote__.json'), 'utf8'))
const _ = updateResourceParamsSchema.parse(updateResourceRemoteJSON);

const getTabsResponse = JSON.parse(readFileSync(join(CWD, '__fixtures__/__getTabs__.json'), 'utf8'))
const _tabs = getTabsResponseSchema.parse(getTabsResponse);

describe('__fixtures__', () => {
    it('works with messaging getFeatures()', async () => {
        const ctx = new MessagingContext({
            env: 'development',
            featureName: 'debug-tools',
            context: 'specialPages'
        });
        const tr = new TestTransportConfig({
            request: async (request) => {
                return getFeaturesJSON
            },
            notify: () => {

            },
            subscribe: () => {
                return () => {}
            }
        })
        const messaging = new Messaging(ctx, tr);
        const message = new DebugToolsMessages(messaging);
        const response = await message.getFeatures();
        deepEqual(response, getFeaturesJSON)
    })
    it('works with messaging updateResource()', async () => {
        const ctx = new MessagingContext({
            env: 'development',
            featureName: 'debug-tools',
            context: 'specialPages'
        });
        const tr = new TestTransportConfig({
            request: async (request) => {
                const content = request.params?.source.debugTools.content;
                if (!content) throw new Error('missing content');
                const clone = JSON.parse(JSON.stringify(getFeatures.features.remoteResources.resources[0]))
                clone.current.contents = content;
                return clone
            },
            notify: () => {

            },
            subscribe: () => {
                return () => {}
            }
        })
        const messaging = new Messaging(ctx, tr);
        const message = new DebugToolsMessages(messaging);
        const response = await message.updateResource(updateResourceDebugTools);
        deepEqual(response, {
            "id": "privacy-configuration",
            "url": "https://staticcdn.duckduckgo.com/trackerblocking/config/v2/macos-config.json",
            "name": "Privacy Config",
            "current": {
                "source": {
                    "remote": {
                        "url": "https://staticcdn.duckduckgo.com/trackerblocking/config/v2/macos-config.json",
                        "fetchedAt": "2023-07-05T12:34:56Z"
                    }
                },
                "contents": "{\n    \"foo\": \"baz\"\n}",
                "contentType": "application/json"
            }
        })
    })
})
