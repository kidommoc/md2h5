# Md2h5

[1]: https://www.markdownguide.com/
[2]: ./examples.md

Md2h5是一个用于将markdown转换成html的单文件js库，支持在node.js环境中与作为网页脚本使用。

Markdown语法可以在[这里][1]查阅。

## 使用

调用函数`convert(md): html`, 其中`md`是markdown文本，`html`是html翻译结果。

当用作网页脚本时，请确保删除了文件顶端的这些代码：

```javascript
module.exports = (md) => convert(md)
```

## 转换规则

段落: `<p class="markdown">...</p>`

> 带换行的段落: `<p class="markdown">...<br />...</p>`

标题: `<hx class="markdown">...</hx>`

> 请注意，`md2h5` 仅支持 `h1` 到 `h3`，更小的标题将会被视作 `h3` 处理。

引用: `<blockquote class="markdown">...</blockquote>`

无序列表: `<ul class="markdown"><li class="markdown">...</li>...</ul>`

有序列表: `<ol class="markdown"><li class="markdown">...</li>...</ol>`

代码块: `<codeblock class="markdown" style="display: block" language="..."><code><pre>...</pre></code></codeblock>`

加粗: `<strong class="markdown">...</strong>`

斜体: `<em class="markdown">...</em>`

行内代码: `<codeline class="markdown" style="display: inline"><code>...</code></codeline>`

链接:`<a class="markdown" href="...">...</a>`

图片: `<img class="markdown" alt="..." src="..." title="..." />`

HTML: **不要用！还没有实现！**

*更多转换示例请查看[这个文档][2]。*