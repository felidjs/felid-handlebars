# felid-handlebars

[![npm version](https://img.shields.io/npm/v/felid-handlebars.svg)](https://www.npmjs.com/package/felid-handlebars)
![Node.js CI](https://github.com/felidjs/felid-handlebars/workflows/Node.js%20CI/badge.svg)
[![JavaScript Style Guide](https://img.shields.io/badge/code_style-standard-brightgreen.svg)](https://standardjs.com)
[![codecov](https://codecov.io/gh/felidjs/felid-handlebars/branch/master/graph/badge.svg)](https://codecov.io/gh/felidjs/felid-handlebars)

A [Felid](https://github.com/felidjs/felid) plugin for rendering [Handlebars](https://github.com/wycats/handlebars.js) templates.

## Install

```bash
npm install felid-handlebars
```

or

```bash
yarn add felid-handlebars
```

## Usage

```javascript
const Felid = require('felid')
const handlebars = require('felid-handlebars')

const app = new Felid()
app.plugin(handlebars, options)

app.get('/', (req, res) => {
  res.render('index.hbs', { foo: 'bar' })
})
```

## Options

- **root**: *String*: The directory where your template files locates. Default to the directory where node runs.
- **charset**: *String*: The charset your templates use. Default is: `utf-8`.
- **production**: *Boolean*: If `true`, an [LRU](https://github.com/isaacs/node-lru-cache) cache will be used to caching templates. Default is depend on the value of `process.env.NODE_ENV`.
- **initCache**: *Boolean*: Whether to initialize the template caches when the plugin is being loaded. Default is: `false`.
- **cacheOptions**: *Object*: The [options](https://github.com/isaacs/node-lru-cache#options) passed to `lru-cache`. Where `max` has a default value of `100`.
- **decorator** *Object*: Customize the decorator names. Default is:
```js
{
  render: 'render'
}
```
- **onInit** *Function(engine HandlebarsInstance)*: If you need to customize the environment of Handlebars, just do it here! Read [more](https://handlebarsjs.com/api-reference/) about what you can do with Handlebars.
```js
app.plugin(handlebars, {
  onInit (hbs) {
    // hbs.registerPartial(name, partial)
    // hbs.registerHelper(name, helper)
  }
})
```
- **onProcess** *Function(html String) => String*: A function used to process the HTML string before it is sent to the client.
```js
app.plugin(handlebars, {
  onProcess (html) {
    // Do something with html here. For example: minify.
    return html
  }
})
```
- **onError** *Function(error: Error, response: FelidResponse)*: A function invoked when an error occured in `res.render()`.

## API

- **response.render(template: String, context?: Object)**: Render the template using the context.

## License

[MIT](./LICENSE)
