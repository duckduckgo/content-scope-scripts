/** @type {Record<string, { name: string, data: import('../../../../types/special-error').InitialSetupResponse['errorData']}>} */
export const sampleData = {
    phishing: {
        name: 'Phishing',
        data: {
            kind: 'phishing',
        },
    },
    'ssl.expired': {
        name: 'Expired',
        data: {
            kind: 'ssl',
            errorType: 'expired',
            domain: 'example.com',
        },
    },
    'ssl.invalid': {
        name: 'Invalid',
        data: {
            kind: 'ssl',
            errorType: 'invalid',
            domain: 'example.com',
        },
    },
    'ssl.selfSigned': {
        name: 'Self-signed',
        data: {
            kind: 'ssl',
            errorType: 'selfSigned',
            domain: 'example.com',
        },
    },
    'ssl.wrongHost': {
        name: 'Wrong Host',
        data: {
            kind: 'ssl',
            errorType: 'wrongHost',
            domain: 'example.com',
            eTldPlus1: 'anothersite.com',
        },
    },
};
