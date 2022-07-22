# Md2h5

[1]: https://www.markdownguide.com/
[2]: ./examples.md

Md2h5 is a single-file js library to convert markdown to html. Support used in both node.js and website front-end script.  

Markdown syntax can be checked [here][1]  

## Usage

Call function `convert(md) : html` where `md` is markdown text and the returning value `html` is html translation.  

When used as web script, please make sure to delete these code on the top of the file:  

```javascript
module.exports = (md) => convert(md)
```

## Convertion Rules

Paragraph: `<p class="markdown">...</p>`

> Paragraph with linebreak: `<p class="markdown">...<br />...</p>`

Heading: `<hx class="markdown">...</hx>`

> Note that only `h1` to `h3` are supported. Smaller ones will be treated as `h3`

Quote: `<blockquote class="markdown">...</blockquote>`

Unordered list: `<ul class="markdown"><li class="markdown">...</li>...</ul>`

Ordered list: `<ol class="markdown"><li class="markdown">...</li>...</ol>`

Code block: `<codeblock class="markdown" style="display: block"><code><pre>...</pre></code></codeblock>`

Image: `<img class="markdown" alt="..." src="..." title="..." />`

Bold: `<strong class="markdown">...</strong>`

Italic: `<em class="markdown">...</em>`

Code: `<codeline class="markdown" style="display: inline" language="..."><code>...</code></codeline>`

Link:`<a class="markdown" href="...">...</a>`

HTML: **DON'T USE IT! HAVN'T IMPLEMENTED!**

*Check [this document][2] for more convertion examples.*