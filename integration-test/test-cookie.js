import { setup } from './helpers/harness.js'

describe('Cookie protection tests', () => {
    let browser
    let teardown
    let setupServer

    beforeAll(async () => {
        ({ browser, teardown, setupServer } = await setup())
        setupServer('8080')
    })
    afterAll(async () => {
        await teardown()
    })

    it('should restrict the expiry of first-party cookies', async () => {
        const page = await browser.newPage()
        await page.goto('http://localhost:8080/index.html')

        const result = await page.evaluate(async () => {
            document.cookie = 'test=1; expires=Wed, 21 Aug 2040 20:00:00 UTC;'
            // wait for a tick, as cookie modification happens in a promise
            await new Promise((resolve) => setTimeout(resolve, 1))
            // @ts-expect-error - cookieStore API types are missing here
            // eslint-disable-next-line no-undef
            return cookieStore.get('test')
        })
        expect(result.name).toEqual('test')
        expect(result.value).toEqual('1')
        expect(result.expires).toBeLessThan(Date.now() + 605_000_000)
    })

    it('non-string cookie values do not bypass protection', async () => {
        const page = await browser.newPage()
        await page.goto('http://localhost:8080/index.html')

        const result = await page.evaluate(async () => {
            // @ts-expect-error - Invalid argument to document.cookie on purpose for test
            document.cookie = {
                toString () {
                    const expires = (new Date(+new Date() + 86400 * 1000 * 100)).toUTCString()
                    return 'a=b; expires=' + expires
                }
            }
            // wait for a tick, as cookie modification happens in a promise
            await new Promise((resolve) => setTimeout(resolve, 1))
            // @ts-expect-error - cookieStore API types are missing here
            // eslint-disable-next-line no-undef
            return cookieStore.get('a')
        })
        expect(result.name).toEqual('a')
        expect(result.value).toEqual('b')
        expect(result.expires).toBeLessThan(Date.now() + 605_000_000)
    })

    it('Erroneous values do not throw', async () => {
        const page = await browser.newPage()
        await page.goto('http://localhost:8080/index.html')

        const result = await page.evaluate(async () => {
            // @ts-expect-error - Invalid argument to document.cookie on purpose for test
            document.cookie = null

            // @ts-expect-error - Invalid argument to document.cookie on purpose for test
            document.cookie = undefined

            // wait for a tick, as cookie modification happens in a promise
            await new Promise((resolve) => setTimeout(resolve, 1))
            // @ts-expect-error - cookieStore API types are missing here
            // eslint-disable-next-line no-undef
            return cookieStore.get('a')
        })
        expect(result.name).toEqual('a')
        expect(result.value).toEqual('b')
        expect(result.expires).toBeLessThan(Date.now() + 605_000_000)
    })
})
