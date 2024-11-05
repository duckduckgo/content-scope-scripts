/**
 * @typedef {import("./json-schema-fs.mjs").createFileList} createFileList
 */

/**
 * @param {ReturnType<createFileList>[number]} file
 */
function title(file) {
    switch (file.kind) {
        case 'request':
        case 'response':
            return file.method + '_' + file.kind;
        case 'subscribe':
            return file.method + '_' + 'subscription';
        case 'notify':
            return file.method + '_' + 'notification';
        default:
            return file.kind;
    }
}

/**
 * @param {ReturnType<createFileList>[number]} file
 */
function description(file) {
    const inputpath = `../messages/${file.relative}`;
    return `Generated from @see ${JSON.stringify(inputpath)}`;
}

/**
 * @param {Record<string, any>} schema
 */
function hasParams(schema) {
    if (!schema) return false;
    if (Object.keys(schema).length === 0) return false;
    if (Object.keys(schema).length === 1) {
        if ('$schema' in schema) return false;
    }
    return true;
}

/**
 * @param {ReturnType<createFileList>[number]} file
 */
function baseSchema(file) {
    return {
        type: 'object',
        title: title(file),
        description: description(file),
        additionalProperties: false,
        required: ['method'],
        properties: {
            method: {
                const: file.method,
            },
        },
    };
}
/**
 * @param {ReturnType<createFileList>[number]} file
 */
function subscribeBaseSchema(file) {
    return {
        type: 'object',
        title: title(file),
        description: description(file),
        additionalProperties: false,
        required: ['subscriptionEvent'],
        properties: {
            subscriptionEvent: {
                const: file.method,
            },
        },
    };
}

/**
 * @param {ReturnType<createFileList>[number]} file
 */
function createNotification(file) {
    if (file.valid === false) throw new Error('unreachable');
    const json = file.json;
    const base = baseSchema(file);
    if (hasParams(json)) {
        base.properties.params = { $ref: './' + file.relative };
        base.required.push('params');
    }
    return base;
}

/**
 * @param {ReturnType<createFileList>[number]} file
 * @param {ReturnType<createFileList>[number]} [response]
 */
function createRequest(file, response) {
    const base = createNotification(file);
    if (response && response.valid) {
        base.properties.result = { $ref: './' + response.relative };
        base.required.push('result');
    }
    return base;
}

/**
 * @param {ReturnType<createFileList>[number]} file
 */
function createSubscription(file) {
    if (file.valid === false) throw new Error('unreachable');
    const json = file.json;
    const base = subscribeBaseSchema(file);
    if (hasParams(json)) {
        base.properties.params = { $ref: './' + file.relative };
        base.required.push('params');
    }
    return base;
}

/**
 * @param {string} featureName
 * @param {ReturnType<createFileList>} fileList
 * @return {import("json-schema-to-typescript").JSONSchema}
 */
export function generateSchema(featureName, fileList) {
    const notifications = [];
    const requests = [];
    const subscriptions = [];

    for (const file of fileList.filter((x) => x.valid)) {
        if (file.valid === false) continue; // ts
        if (file.kind === 'notify') {
            notifications.push(createNotification(file));
        }
        if (file.kind === 'request') {
            const response = fileList.find((x) => x.valid && x.method === file.method && x.kind === 'response');
            requests.push(createRequest(file, response));
        }
        if (file.kind === 'subscribe') {
            subscriptions.push(createSubscription(file));
        }
    }

    const base = {
        $schema: 'http://json-schema.org/draft-07/schema#',
        type: 'object',
        title: featureName + '_messages',
        description: `Requests, Notifications and Subscriptions from the ${featureName} feature`,
        additionalProperties: false,
        properties: {},
        /** @type {string[]} */
        required: [],
    };

    if (notifications.length) {
        base.properties.notifications = { oneOf: notifications };
        base.required.push('notifications');
    }
    if (requests.length) {
        base.properties.requests = { oneOf: requests };
        base.required.push('requests');
    }
    if (subscriptions.length) {
        base.properties.subscriptions = { oneOf: subscriptions };
        base.required.push('subscriptions');
    }
    return /** @type {import("json-schema-to-typescript").JSONSchema} */ (base);
}

/**
 * @param {{topLevelType: string; schema: Record<string, any>}} job
 * @param {object} options
 * @param {string} options.featurePath
 * @param {string} options.className
 * @return {string}
 */
export function createMessagingTypes(job, { featurePath, className }) {
    const json = job.schema;
    const notifications = (json.properties?.notifications?.oneOf?.length ?? 0) > 0;
    const requests = (json.properties?.requests?.oneOf?.length ?? 0) > 0;
    const subscriptions = (json.properties?.subscriptions?.oneOf?.length ?? 0) > 0;
    const lines = [];
    if (notifications) {
        lines.push(`notify: import("@duckduckgo/messaging/lib/shared-types").MessagingBase<${job.topLevelType}>['notify']`);
    }
    if (requests) {
        lines.push(`request: import("@duckduckgo/messaging/lib/shared-types").MessagingBase<${job.topLevelType}>['request']`);
    }
    if (subscriptions) {
        lines.push(`subscribe: import("@duckduckgo/messaging/lib/shared-types").MessagingBase<${job.topLevelType}>['subscribe']`);
    }
    return `
declare module ${JSON.stringify(featurePath)} {
  export interface ${className} {
    ${lines.join(',\n    ')}
  }
}`;
}
