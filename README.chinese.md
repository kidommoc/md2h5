# Md2h5

[1]: https://www.markdownguide.com/
[2]: ./examples.md

Md2h5 是一个用于将 markdown 转换成 html 的单文件 javascript 库，支持作为 node.js 模块或网页脚本使用。

Markdown语法可以在[这里][1]查阅。

## 使用

当用作网页脚本时，请确保删除了文件顶端的这些代码：

```javascript
module.exports = (md) => convert(md)
```

在最前端首先导入 `converter.js`：

```html
<script src="/path/to/converter.js"></script>
<script src="/other/scripts"></script>
```

之后便可以调用 `convert(md)` 这个函数，其中 `md` 是 markdown 字符串，函数会返回 `md` 转化成的 html 字符串。

当用作 node 模块时，首先链接本地 node 模块：

```
npm link path/to/md2h5 --save
```

之后导入并使用即可：

```javascript
const md2h5 = require('md2h5')
// or in es6 method
import md2h5 from 'md2h5'

const html = md2h5(markdown)
```

当在 typescript 项目中使用时，可以将模块声明文件 `md2h5.d.ts` 复制并粘贴至项目的 `types` 目录中以支持 typescript 的类型系统。

## 转换规则

段落: `<p class="markdown">...</p>`

> 带换行的段落: `<p class="markdown">...<br />...</p>`

标题: `<hx class="markdown">...</hx>`

> 请注意，`md2h5` 仅支持 `h1` 到 `h3`，更小的标题将会被视作 `h3` 处理。

引用: `<blockquote class="markdown">...</blockquote>`

无序列表: 

```html
<ul class="markdown">
    <li class="markdown">...</li>
    ...
</ul>
```

有序列表: 

```html
<ol class="markdown">
    <li class="markdown">...</li>
    ...
</ol>
```

代码块: `<codeblock class="markdown" style="display: block" language="..."><code><pre>...</pre></code></codeblock>`

加粗: `<strong class="markdown">...</strong>`

斜体: `<em class="markdown">...</em>`

行内代码: `<codeline class="markdown" style="display: inline"><code>...</code></codeline>`

链接:`<a class="markdown" href="...">...</a>`

图片: `<img class="markdown" alt="..." src="..." title="..." />`

HTML: **不要用！还没有实现！**

*更多转换示例请查看[这个文档][2]。*