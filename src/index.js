const fs = require('fs')
const path = require('path')
const LRU = require('lru-cache')
const handlebars = require('handlebars')

function buildCache (opt) {
  return new LRU({
    max: 100,
    ...opt
  })
}

function cacheTemplates (cache, context) {
  let files
  try {
    files = fs.readdirSync(path.resolve(context.root))
  } catch (e) {
    return
  }
  if (!files) return
  files.forEach(file => {
    compileTemplate(file, cache, context)
  })
}

function compileTemplate (file, cache, context) {
  return new Promise((resolve, reject) => {
    let data
    try {
      data = fs.readFileSync(path.resolve(context.root, file), context.charset)
    } catch (e) {
      reject(e)
    }
    data = context.engine.compile(data)
    if (cache) {
      cache.set(file, data)
    }
    resolve(data)
  })
}

function getTemplate (page, cache, context) {
  return new Promise((resolve, reject) => {
    if (cache) {
      const data = cache.get(page)
      if (data) {
        resolve(data)
      }
    }
    compileTemplate(page, cache, context)
      .then(data => {
        resolve(data)
      })
      .catch(e => {
        reject(e)
      })
  })
}

function renderTemplate (cache, context) {
  return function render (page, data) {
    getTemplate(page, cache, context)
      .then(template => {
        let html = template(data)
        if (typeof context.onProcess === 'function') {
          html = context.onProcess(html)
        }
        if (!this.getHeader('content-type')) {
          this.setHeader('content-type', 'text/html; charset=' + context.charset)
        }
        this.send(html)
      })
      .catch(e => {
        if (typeof context.onError === 'function') {
          context.onError(e, this)
          return
        }
        this.code(500).send(e.message || e)
      })
  }
}

const defaultDecoratorKeys = {
  render: 'render'
}

function plugin (felid, options) {
  const context = {
    charset: 'utf-8',
    initCache: false,
    root: path.resolve('./'),
    production: process.env.NODE_ENV === 'production',
    ...options
  }
  const engine = handlebars.create()
  if (typeof context.onInit === 'function') {
    context.onInit(engine)
  }
  context.engine = engine
  const cache = context.production
    ? buildCache(context.cacheOptions)
    : null
  if (cache && context.initCache) {
    cacheTemplates(cache, context)
  }
  const decoratorKeys = {
    ...defaultDecoratorKeys,
    ...context.decorator
  }
  felid.decorateResponse(decoratorKeys.render, renderTemplate(cache, context))
}

module.exports = plugin
