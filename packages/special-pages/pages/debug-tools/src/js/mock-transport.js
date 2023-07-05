/**
 * @typedef{ import('../../../../../messaging/index.js').MessagingTransport} MessagingTransport
 * @typedef{ import('../../schema/__generated__/schema.types').GetFeaturesResponse} GetFeaturesResponse
 */
import { updateResourceParamsSchema } from '../../schema/__generated__/schema.parsers.mjs'

/**
 * @implements MessagingTransport
 */
export class MockImpl {
    notify (msg) {
        console.log(msg)
    }

    /**
     * @param {import('../../../../../messaging/index.js').RequestMessage} msg
     */
    async request (msg) {
        const now = new Date()
        const formattedDate = now.toISOString()
        switch (msg.method) {
        case 'getFeatures': {
            const remote = await fetch('macos-config.json')
                .then(x => x.text())

            const remote2 = await fetch('minimal-config.json')
                .then(x => x.text())

            /** @type {GetFeaturesResponse} */
            const response = {
                features: {
                    userScripts: {
                        scripts: []
                    },
                    remoteResources: {
                        resources: [
                            {
                                id: 'privacy-configuration',
                                url: '/macos-config.json',
                                name: 'Privacy Config',
                                current: {
                                    source: {
                                        remote: {
                                            url: '/macos-config.json',
                                            fetchedAt: formattedDate
                                        }
                                    },
                                    contents: remote,
                                    contentType: 'application/json'
                                }
                            },
                            {
                                id: 'privacy-configuration-alt',
                                url: '/minimal-config.json',
                                name: 'Privacy Config (alt)',
                                current: {
                                    source: {
                                        remote: {
                                            url: '/minimal-config.json',
                                            fetchedAt: formattedDate
                                        }
                                    },
                                    contents: remote2,
                                    contentType: 'application/json'
                                }
                            }
                        ]
                    }
                }
            }
            return response
        }
        case 'updateResource': {
            const parsed = updateResourceParamsSchema.parse(msg.params)
            /** @type {import('../../schema/__generated__/schema.types').RemoteResource} */
            const next = {
                id: 'privacy-configuration',
                url: '/macos-config.json',
                name: 'Privacy Config',
                current: {
                    source: {
                        debugTools: {
                            modifiedAt: formattedDate
                        }
                    },
                    contents: '',
                    contentType: 'application/json'
                }
            }
            if ('remote' in parsed.source) {
                // await new Promise((resolve) => setTimeout(resolve, 1000))
                const remote = await fetch(parsed.source.remote.url).then(x => x.text())
                next.current.source = {
                    remote: { url: parsed.source.remote.url, fetchedAt: formattedDate }
                }
                next.current.contents = remote
            }
            if ('debugTools' in parsed.source) {
                // await new Promise((resolve) => setTimeout(resolve, 1000))
                // return Promise.reject(new Error('nooooo'))
                next.current.source = {
                    debugTools: { modifiedAt: formattedDate }
                }
                next.current.contents = parsed.source.debugTools.content
            }
            return next
        }
        default:
            throw new Error('unhandled message:' + msg.method)
        }
    }

    subscribe (msg) {
        console.log(msg)
        return () => {
            console.log('teardown')
        }
    }
}
