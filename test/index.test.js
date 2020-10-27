const fs = require('fs')
const path = require('path')
const Felid = require('felid')
const hbs = require('handlebars')
const injectar = require('injectar')
const hbsPlugin = require('../src')

describe('render templates', () => {
  const data = {
    text: 'hello world',
    title: 'Test'
  }
  test('Should render templates with given data correctly', (done) => {
    const instance = new Felid()
    instance.plugin(hbsPlugin)
    instance.get('/test', (req, res) => {
      res.render('test/static/index.hbs', data)
    })

    injectar(instance.lookup())
      .get('/test')
      .end((err, res) => {
        expect(err).toBe(null)
        expect(res.statusCode).toBe(200)
        expect(res.headers['content-type']).toBe('text/html; charset=utf-8')
        expect(res.payload).toBe(hbs.compile(fs.readFileSync(path.resolve(__dirname, 'static/index.hbs'), 'utf8'))(data))
        done()
      })
  })

  test('Should render templates without data correctly', (done) => {
    const instance = new Felid()
    instance.plugin(hbsPlugin)
    instance.get('/test', (req, res) => {
      res.render('test/static/index.hbs')
    })

    injectar(instance.lookup())
      .get('/test')
      .end((err, res) => {
        expect(err).toBe(null)
        expect(res.statusCode).toBe(200)
        expect(res.payload).toBe(hbs.compile(fs.readFileSync(path.resolve(__dirname, 'static/index.hbs'), 'utf8'))())
        done()
      })
  })

  test('Should process the html', (done) => {
    const instance = new Felid()
    instance.plugin(hbsPlugin, {
      onProcess (data) {
        return data + 'test'
      }
    })
    instance.get('/test', (req, res) => {
      res.render('test/static/index.hbs', data)
    })

    injectar(instance.lookup())
      .get('/test')
      .end((err, res) => {
        expect(err).toBe(null)
        expect(res.statusCode).toBe(200)
        expect(res.payload).toBe(hbs.compile(fs.readFileSync(path.resolve(__dirname, 'static/index.hbs'), 'utf8'))(data) + 'test')
        done()
      })
  })

  test('Should render templates without extensions', (done) => {
    const instance = new Felid()
    instance.plugin(hbsPlugin)
    instance.get('/test', (req, res) => {
      res.render('test/static/index', data)
    })

    injectar(instance.lookup())
      .get('/test')
      .end((err, res) => {
        expect(err).toBe(null)
        expect(res.statusCode).toBe(200)
        expect(res.headers['content-type']).toBe('text/html; charset=utf-8')
        expect(res.payload).toBe(hbs.compile(fs.readFileSync(path.resolve(__dirname, 'static/index.hbs'), 'utf8'))(data))
        done()
      })
  })

  test('Should not override `Content-Type` header if it has been set', (done) => {
    const instance = new Felid()
    instance.plugin(hbsPlugin)
    instance.get('/test', (req, res) => {
      res.setHeader('content-type', 'text/plain').render('test/static/index.hbs', data)
    })

    injectar(instance.lookup())
      .get('/test')
      .end((err, res) => {
        expect(err).toBe(null)
        expect(res.headers['content-type']).toBe('text/plain')
        done()
      })
  })

  test('Should work in production environment', (done) => {
    const instance = new Felid()
    instance.plugin(hbsPlugin, {
      initCache: true,
      production: true,
      root: path.resolve(__dirname, 'static')
    })
    instance.get('/test', (req, res) => {
      res.render('index.hbs', data)
    })

    injectar(instance.lookup())
      .get('/test')
      .end((err, res) => {
        expect(err).toBe(null)
        expect(res.statusCode).toBe(200)
        expect(res.payload).toBe(hbs.compile(fs.readFileSync(path.resolve(__dirname, 'static/index.hbs'), 'utf8'))(data))
        done()
      })
  })
})

describe('options', () => {
  test('Should set correct options', (done) => {
    const instance = new Felid()
    instance.plugin(hbsPlugin, {
      root: path.resolve(__dirname, 'static')
    })
    instance.get('/test', (req, res) => {
      res.render('index.hbs')
    })

    injectar(instance.lookup())
      .get('/test')
      .end((err, res) => {
        expect(err).toBe(null)
        expect(res.statusCode).toBe(200)
        expect(res.payload).toBe(hbs.compile(fs.readFileSync(path.resolve(__dirname, 'static/index.hbs'), 'utf8'))())
        done()
      })
  })

  test('Should customize handlebars environment', (done) => {
    const data = {
      a: '1',
      b: '1',
      c: '2'
    }
    const instance = new Felid()
    instance.plugin(hbsPlugin, {
      onInit (hbs) {
        hbs.registerHelper('if_eq', (a, b, opts) => {
          if (a === b) return opts.fn(this)
          return opts.inverse(this)
        })
      }
    })
    instance.get('/test', (req, res) => {
      res.render('test/static/helper.hbs', data)
    })

    const engine = hbs.create()
    engine.registerHelper('if_eq', (a, b, opts) => {
      if (a === b) return opts.fn(this)
      return opts.inverse(this)
    })
    injectar(instance.lookup())
      .get('/test')
      .end((err, res) => {
        expect(err).toBe(null)
        expect(res.statusCode).toBe(200)
        expect(res.payload).toBe(engine.compile(fs.readFileSync(path.resolve(__dirname, 'static/helper.hbs'), 'utf8'))(data))
        done()
      })
  })

  test('Should set custom decorator property name', (done) => {
    const instance = new Felid()
    instance.plugin(hbsPlugin, {
      decorator: {
        render: 'hbs'
      }
    })
    instance.get('/test', (req, res) => {
      res.hbs('test/static/index.hbs')
    })

    injectar(instance.lookup())
      .get('/test')
      .end((err, res) => {
        expect(err).toBe(null)
        expect(res.statusCode).toBe(200)
        expect(res.payload).toBe(hbs.compile(fs.readFileSync(path.resolve(__dirname, 'static/index.hbs'), 'utf8'))())
        done()
      })
  })
})

describe('handle error', () => {
  const notFoundErrMsg = `ENOENT: no such file or directory, open '${path.resolve(__dirname, '../404.hbs')}'`
  test('Should respond error message by default', (done) => {
    const instance = new Felid()
    instance.plugin(hbsPlugin)
    instance.get('/test', (req, res) => {
      res.render('404.hbs')
    })

    injectar(instance.lookup())
      .get('/test')
      .end((err, res) => {
        expect(err).toBe(null)
        expect(res.statusCode).toBe(500)
        expect(res.payload).toBe(notFoundErrMsg)
        done()
      })
  })

  test('Should handle error by custom handler', (done) => {
    const instance = new Felid()
    instance.plugin(hbsPlugin, {
      onError (err, res) {
        res.code(501).send(err.message + 'test')
      }
    })
    instance.get('/test', (req, res) => {
      res.render('404.hbs')
    })

    injectar(instance.lookup())
      .get('/test')
      .end((err, res) => {
        expect(err).toBe(null)
        expect(res.statusCode).toBe(501)
        expect(res.payload).toBe(notFoundErrMsg + 'test')
        done()
      })
  })
})
