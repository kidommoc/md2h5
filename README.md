# Md2h5

[1]: https://www.markdownguide.com/
[2]: https://www.markdown.com.cn/

Md2h5 is a single-file js library to convert markdown to html. Support used in both node.js and website front-end script.<br />
Md2h5是一个用于将markdown转换成html的单文件js库，支持在node.js环境中与作为网页脚本使用。

Markdown syntax can be checked [here][1], and [this][2] is a Chinese version.<br />
Markdown语法可以在[这里][1]查阅。[中文版本][2]

## Usage 使用

Call function `convert(md) : html` where `md` is markdown text and the returning value `html` is html translation.<br />
调用函数`convert(md): html`, 其中`md`是markdown文本，`html`是html翻译结果。

When used as web script, please make sure to delete these code on the top of the file:<br />
当用作网页脚本时，请确保删除了文件顶端的这些代码：

```
exports.convert = (md) => {
    return convert(md);
};
```

## Convertion Rules 转换规则

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

Code: `<codeline class="markdown" style="display: inline"><code>...</code></codeline>`

Link:`<a class="markdown" href="...">...</a>`