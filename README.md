# Md2h5

[1]: https://www.markdownguide.com/
[2]: https://www.markdown.com.cn/

Md2h5 is a single-file js library to convert markdown to html. Support used in both node and website (see the top of `converter.js`)

Markdown syntax can be checked [here][1]. Chinese version [here][2].

## Convertion Rules

Paragraph: `<p class="markdown">...</p>`

Heading: `<hx class="markdown">...<hx>`

> Note that only support `h1` to `h3`. Those smaller will be converted to `h3`

Quote: `<blockquote class="markdown">...<hx>`

Unordered list: `<ul class="markdown"><li class="markdown">...</li>...</ul>`

Ordered list: `<ol class="markdown"><li class="markdown">...</li>...</ol>`

Code block: `<codeblock class="markdown" style="display: block"><code><pre>...</pre></code></codeblock>`

Image: `<img class="markdown" src="..." alt="..." />`

Bold: `<strong class="markdown">...</strong>`

Italic: `<em class="markdown">...</em>`

Code: `<codeline class="markdown"><code>...</code></codeline>`

Link:`<a class="markdown" href="...">...</a>`