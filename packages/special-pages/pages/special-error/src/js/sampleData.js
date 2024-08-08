/** @type {Record<string, { name: string, data: import('../../../../types/special-error').InitialSetupResponse['errorData']}>} */
export const sampleData = {
    phishing: {
        name: 'Phishing',
        data: {
            kind: 'phishing'
        }
    },
    'ssl.expired': {
        name: 'Expired',
        data: {
            kind: 'ssl',
            errorType: 'expired',
            domain: 'example.com'
        }
    }
}