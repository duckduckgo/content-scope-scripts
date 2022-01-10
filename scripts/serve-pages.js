import createFastify from 'fastify'
import fastifyStatic from 'fastify-static'
import { join } from 'node:path'

const thisdir = new URL('.', import.meta.url)
const cwd = join(thisdir.pathname, '..')

const fastify = createFastify()

fastify.register(fastifyStatic, {
    root: join(cwd, 'integration-test/pages'),
    prefix: '/'
})

fastify.register(fastifyStatic, {
    root: join(cwd, 'build'),
    prefix: '/build/',
    decorateReply: false // the reply decorator has been added by the first plugin registration
})

// Run the server!
fastify.listen(process.env.PORT, (err, address) => {
    if (err) throw err
    process.send?.({ kind: 'server-listening', address })
    if (process.env.DEBUG) {
        console.log(`Server is now listening on ${address}`)
    }
})
