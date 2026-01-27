const { createServer } = require('http')
const { parse } = require('url')
const next = require('next')

// Detect if we're in production (bundled in Electron)
const isProduction = process.env.NODE_ENV === 'production'
const dev = !isProduction

// Initialize Next.js app
const app = next({ dev, dir: '.' })
const handle = app.getRequestHandler()

app.prepare().then(() => {
  createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url, true)
      await handle(req, res, parsedUrl)
    } catch (err) {
      console.error('Error occurred handling', req.url, err)
      res.statusCode = 500
      res.end('internal server error')
    }
  })
    .listen(1998, () => {
      console.log(`> Ready on http://localhost:1998`)
    })
})
