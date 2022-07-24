# Md2h5

[1]: https://www.markdownguide.com/
[2]: ./examples.md

Md2h5 is a single-file js library to convert markdown to html. Support used as node.js module or website front-end script.  

Markdown syntax can be checked [here][1]  

## Usage

When used as web script, please make sure to delete these code on the top of the file:  

```javascript
module.exports = (md) => convert(md)
```

Import `converter.js` before other scrips like this:

```html
<script src="/path/to/converter.js"></script>
<script src="/other/scripts"></script>
```

Then function `convert(md)` where `md` is markdown text, is available, which will return a string of the html converted from `md`.

When used as node module, first link local node module:

```
npm link path/to/md2h5 --save
```

ThereAfter import and use like this:

```javascript
const md2h5 = require('md2h5')
// or in es6 method
import md2h5 from 'md2h5'

const html = md2h5(markdown)
```

When used with typescript, a module declaration file `md2h5.d.ts` is provided for copying and pasting to `types` directory of the project.

## Convertion Rules

Paragraph: `<p class="markdown">...</p>`

> Paragraph with linebreak: `<p class="markdown">...<br />...</p>`

Heading: `<hx class="markdown">...</hx>`

> Note that only `h1` to `h3` are supported. Smaller ones will be treated as `h3`

Quote: `<blockquote class="markdown">...</blockquote>`

Unordered list:

```html
<ul class="markdown">
    <li class="markdown">...</li>
    ...
</ul>
```

Ordered list:

```html
<ol class="markdown">
    <li class="markdown">...</li>
    ...
</ol>
```

Code block: `<codeblock class="markdown" style="display: block"><code><pre>...</pre></code></codeblock>`

Image: `<img class="markdown" alt="..." src="..." title="..." />`

Bold: `<strong class="markdown">...</strong>`

Italic: `<em class="markdown">...</em>`

Code: `<codeline class="markdown" style="display: inline" language="..."><code>...</code></codeline>`

Link:`<a class="markdown" href="...">...</a>`

HTML: **DON'T USE IT! HAVN'T IMPLEMENTED!**

*Check [this document][2] for more convertion examples.*