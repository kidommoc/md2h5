let reader, links;

// please remove this line when not used in nodejs
module.exports = (md) => convert(md)

const convert = (md) => {
    md = removeTab(md);
    reader = new Reader(md);
    reader.rollback(md.length * 5);
    genLinks();
    reader.rollback(md.length);
    let s = '';
    jumpEmptyLines('');
    while (!reader.end)
        s += block('');
    return s;
}

class Reader {
    constructor(s) {
        this._s = s;
        this._pos = 0;
    }
    get now() { return this._s[this._pos]; }
    get end() { return this._pos >= this._s.length; }
    get pos() { return this._pos; }
    get position() {
        let line = 1, column = 0;
        for (let i = 0; i < this._pos; ++i) {
            ++column;
            if (this._s[i] == '\n') {
                ++line;
                column = 0;
            }
        }
        return { line: line, column: column };
    }
    next() {
        if (!this.end)
            ++this._pos;
        return this._s[this._pos];
    }
    goahead(n) {
        this._pos += n;
        this._pos = this.end ? s.length : this._pos;
    }
    rollback(n) {
        this._pos -= n;
        this._pos = this._pos < 0 ? 0 : this._pos;
    }
    del(s, e) {
        if (this._pos - s > 0)
            this._pos -= (this._pos > e ? e : this._pos) - s;
        this._s = this._s.substr(0, s) + this._s.substr(e);
    }
}

const removeTab = (s) => {
    let count = 0;
    for (let i = 0; i < s.length; ++i) {
        if (s[i] == '\n')
            count = 0;
        else {
            ++count;
            if (s[i] == '\t') {
                let temp = ' ';
                while (count % 4 != 0) {
                    ++count;
                    temp += ' ';
                }
                s = s.slice(0, i) + temp + s.slice(i + 1);
                i += temp.length - 1;
            }
        }
    }
    return s;
}

const isNumber = (c) => {
    if (c >= '0' && c <= '9')
        return true;
    return false;
}

const isEmpty = (c) => {
    return c && c == ' ';
}

const char = (c) => {
    switch (c) {
        case '<':
            return '&lt;';
        case '>':
            return  '&gt;';
        case '\'':
            return  '&apos;';
        case '"':
            return '&quotl;';
        case '&':
            return '&amp;'
        default:
            return c;
    }
}

const jumpEmpty = () => {
    let s = '';
    while (isEmpty(reader.now)) {
        s += reader.now;
        reader.next();
    }
    return s;
}

// '>': quote
// '-': list
// ' ': codeblock
const jumpPrefix = (prefix, empty = false) => {
    if (reader.end)
        return 0;
    while (reader.pos) {
        reader.rollback(1);
        if (reader.now == '\n') {
            reader.next();
            break;
        }
    }
    let position = reader.position
    let e = -1, count = 0;
    for (let i = prefix.length - 1; i >= 0; --i)
        if (prefix[i] == '>') {
            e = i;
            break;
        }

    for (let i = 0; i <= e; ++i) {
        let temp = 0;
        switch (prefix[i]) {
            case '>':
                while (temp < 4 && isEmpty(reader.now)) {
                    ++temp;
                    reader.next();
                }
                if (temp < 4 && !reader.end && reader.now == '>') {
                    reader.next();
                    count += temp + 1;
                }
                else {
                    reader.rollback(count + temp);
                    return false;
                }
                break;
            case '-':
            case ' ':
                while (temp < 4 && !reader.end && reader.now == ' ') {
                    ++temp;
                    reader.next();
                }
                if (temp < 4) {
                    reader.rollback(count + temp);
                    return false;
                }
                else
                    count += temp;
                break;
        }
    }

    if (empty) {
        let temp = 0;
        while (!reader.end && isEmpty(reader.now)) {
            ++temp;
            reader.next();
        }
        if (reader.end || reader.now == '\n') {
            return count + temp;
        }
        else
            reader.rollback(temp);
    }

    for (let i = e + 1; i < prefix.length; ++i) {
        let temp = 0;
        while (temp < 4 && !reader.end && reader.now == ' ') {
            ++temp;
            reader.next();
        }
        if (temp < 4) {
            reader.rollback(count + temp);
            return false;
        }
        else
            count += temp;
    }
    return count;
}

const jumpEmptyLines = (jump) => {
    if (reader.end)
        return 0;
    let start = [reader.now, reader.pos]
    let jumped = 0, count = 0;
    while (!reader.end) {
        count = jumpPrefix(jump, true);
        if (count === false)
            break;
        count += jumpEmpty().length;
        if (reader.end) {
            count = 0;
            ++jumped;
            break;
        }
        if (reader.now != '\n')
            break;
        ++jumped;
        reader.next();
    }
    reader.rollback(count);
    return jumped;
}

const linkContent = (end) => {
    if (reader.end)
        return [undefined, '']
    let s = '', link = '', title = '';
    // <link
    if (reader.now == '<') {
        s = reader.now;
        while (!['>', ' ', end, '\n'].includes(reader.next()) && !reader.end)
            link += char(reader.now);
        s += link;
        // <not-link
        if (reader.end || reader.now != '>')
            return [undefined, s];
        s += reader.now;
        reader.next();
    }
    // link
    else {
        link = reader.now;
        while (![' ', end, '\n'].includes(reader.next()) && !reader.end)
            link += char(reader.now);
        s += link;
    }

    s += jumpEmpty();
    // link or <link>
    if (reader.end || reader.now == end)
        return [link, title, s]
    let c = reader.now;
    // not link or <not> link
    if (!['(', '"', "'"].includes(c))
        return [undefined, s]

    c = c == '(' ? ')' : c;
    while (![c, end, '\n'].includes(reader.next()) && !reader.end)
        title += char(reader.now);
    s += title;
    // link or <link> "title" or 'title' or (title)
    if (reader.now == c) {
        reader.next();
        return [link, title, s + c];
    }
    // not or <not> (link or "link or 'link
    if (reader.end || reader.now == end)
        return [undefined, s];

}

const genLinks = () => {
    links = [];
    while (!reader.end) {
        if (reader.now == '[') {
            let name = '', start = reader.pos;
            while (![']', '\n'].includes(reader.next()) && !reader.end)
                name += reader.now;
            if (reader.end)
                break;
            if (reader.now == ']' && reader.next() == ':') {
                reader.next();
                jumpEmpty();
                let link, title;
                [link, title] = linkContent('\n');
                if (link) {
                    jumpEmpty();
                    if (reader.end || reader.now == '\n') {
                        links[name] = { link: link, title: title };
                        reader.next()
                        reader.del(start, reader.pos)
                        if (reader.now == '[')
                            continue;
                    }
                }
            }
        }
        let count = 1;
        while (!reader.end && count < 2) {
            if (reader.now == '\n') {
                ++count;
                reader.next();
                jumpEmpty();
                reader.rollback(1)
            }
            else
                count = 0;
            reader.next();
        }
    }
}

const escape = () => {
    let c = reader.next(), temp = '', count = 0, isCode = false;
    if (c == '#') {
        c = reader.next();
        ++count;
        isCode = true;
    }
    while (!reader.end && ![';', '\n'].includes(c) && count < 10) {
        if (isCode && !isNumber(c))
            break;
        temp += c;
        c = reader.next();
    }
    if (c != ';')
        return `&amp;${isCode ? '#' : '' + temp}`;
    reader.next();
    if (isCode)
        return String.fromCharCode(Number.parseInt(temp));
    return `&${temp};`;
}

const block = (jump) => {
    if (reader.end)
        return '';
    let count = 0
    if (isNumber(reader.now))
        return oList(jump);
    switch (reader.now) {
        case ' ':
            count = 0;
            while (count < 4 && isEmpty(reader.now)) {
                ++count;
                reader.next();
            }
            if (reader.end)
                return '';
            if (count >= 4)
                return codeBlock1(jump);
            reader.rollback(count);
        case '#':
            return heading(jump);
        case '>':
            return quote(jump);
        case '-':
        case '*':
        case '+':
            return uList(jump);
        /*
        case '<':
            return html();
        */
        case '`':
            count = 1;
            while (reader.next() == '`')
                ++count;
            if (count >= 3)
                return codeBlock2(jump);
            else
                reader.rollback(count);
        default:
            return paragraph(jump);
    }
}

// block elements
// end at the 1st char, 1st line of the next block

const paragraph = (jump) => {
    let s = '';
    if (reader.now == '!') {
        let temp = text();
        if (temp.startsWith == '<img' && temp.endsWith(' />') && !temp.endsWith('<br />'))
            return temp;
        else {
            s += ` ${temp}`;
            if (jumpEmptyLines(jump) || jumpPrefix(jump) === false)
                return `<p class="markdown">${s.slice(1)}</p>`;
        }
    }
    while (!reader.end) {
        s += `${s.endsWith('<br />') ? '' : ' '}${text()}`;
        if (jumpEmptyLines(jump) || jumpPrefix(jump) === false)
            break;
    }
    return `<p class="markdown">${s.slice(1)}</p>`;
}

const heading = (jump) => {
    let count = 1;
    while (reader.next() == '#')
        ++count;
    if (!isEmpty(reader.now)) {
        reader.rollback(count);
        return paragraph(jump);
    }
    jumpEmpty();
    if (reader.end) {
        reader.rollback(count);
        return paragraph();
    }
    let s = `<h${count > 3 ? 3 : count} class="markdown">`;
    while (!reader.end && reader.now != '\n') {
        if (reader.now == '&')
            s += escape();
        else {
            s += char(reader.now);
            reader.next();
        }
    }
    reader.next();
    jumpEmptyLines(jump);
    return s + `</h${count > 3 ? 3 : count}>`;
}

const quote = (jump) => {
    let s = '';
    while (!reader.end) {
        jumpEmptyLines(jump + '>');
        if (jumpPrefix(jump + '>') === false)
            return '';
        let temp = 0;
        while (temp < 4 && isEmpty(reader.now)) {
            ++temp;
            reader.next();
        }

        if (reader.end)
            break;
        if (temp >= 4)
            s += codeBlock1(jump + '>');
        else
            s += block(jump + '>');

        if (jumpPrefix(jump + '>') === false)
            break;
    }
    jumpEmptyLines(jump);
    return `<blockquote class="markdown">${s}</blockquote>`;
}

const uList = (jump) => {
    let s = '', p = undefined;
    while (!reader.end) {
        if (reader.next() != ' ') {
            reader.rollback(1);
            return paragraph(jump);
        }

        while (isEmpty(reader.next()) && !reader.end)
            ;
        if (!reader.end) {
            let temp;
            [temp, p] = listItem(jump, () => {
                let flag = false;
                if (['*', '-', '+'].includes(reader.now)) {
                    if (isEmpty(reader.next()) && !reader.end)
                        flag = true;
                    reader.rollback(1);
                }
                return flag;
            }, p);
            s += `<li class="markdown">${temp}</li>`;
        }

        if (jumpPrefix(jump) === false)
            break;
        let temp = jumpEmpty();
        if (!['*', '-', '+'].includes(reader.now)) {
            reader.rollback(temp);
            break;
        }
    }
    jumpEmptyLines(jump);
    return `<ul class="markdown">${s}</ul>`;
}

const oList = (jump) => {
    let s = '', p = undefined;
    while (!reader.end) {
        let temp = 0;
        while (!reader.end && isNumber(reader.now)) {
            ++temp;
            reader.next();
        }
        if (reader.now != '.') {
            reader.rollback(temp);
            return paragraph(jump);
        }
        if (reader.next() != ' ') {
            reader.rollback(temp + reader.end ? 0 : 1);
            return paragraph(jump);
        }

        while (isEmpty(reader.next()) && !reader.end)
            ;
        if (!reader.end) {
            let temp;
            [temp, p] = listItem(jump, () => {
                let temp = 0;
                while (!reader.end && isNumber(reader.now)) {
                    ++temp;
                    reader.next();
                }
                if (reader.end || reader.now != '.') {
                    reader.rollback(temp);
                    return false;
                }
                if (reader.next() != ' ') {
                    if (!reader.end)
                        ++temp;
                    reader.rollback(temp);
                    return false;
                }
                reader.rollback(temp);
                return true;
            }, p);
            s += `<li class="markdown">${temp}</li>`;
        }

        if (jumpPrefix(jump) === false)
            break;
        temp = jumpEmpty();
        if (!isNumber(reader.now)) {
            reader.rollback(temp);
            break;
        }
    }
    jumpEmptyLines(jump);
    return `<ol class="markdown">${s}</ol>`;
}

const listItem = (jump, liStart, p) => {
    let s = '';
    while (!reader.end) {
        s += ' ' + text();
        if (jumpEmptyLines(jump)) {
            if (p === undefined)
                p = true;
            if (p)
                s = ` <p class="markdown">${s.slice(1)}</p>`;
            if (jumpPrefix(jump) === false)
                return [s.slice(1), p];
            let count = 0;
            while (count < 4 && !reader.end && reader.now == ' ') {
                ++count;
                reader.next();
            }
            if (reader.end)
                return [s.slice(1), p];
            if (count < 4) {
                reader.rollback(count);
                return [s.slice(1), p];
            }
            break;
        }
        else
            if (reader.end || jumpPrefix(jump) === false || liStart()) {
                if (p === undefined)
                    p = false;
                return [s.slice(1), p];
            }
    }

    s = s.slice(1);
    while (!reader.end) {
        s += block(jump + '-');
        if (jumpPrefix(jump + '-') === false)
            break;
    }
    return [s, p];
}

// starts with 4 spaces or 1 tab
const codeBlock1 = (jump) => {
    let s = '<codeblock class="markdown" style="display: block"><code><pre>';
    while (!reader.end) {
        while (!reader.end && reader.now != '\n') {
            s += char(reader.now);
            reader.next();
        }
        if (reader.end)
            break;
        s += '\n'
        reader.next();
        let count = jumpEmptyLines(jump + ' ');
        if (jumpPrefix(jump + ' ') === false)
            break;
        for (let i = 0; i < count; ++i)
            s += '\n';
    }
    return `${s}</pre></code></codeblock>`;
}

// starts with ```
const codeBlock2 = (jump) => {
    let language = '';
    while (!reader.end && reader.now != '\n') {
        language += reader.now;
        reader.next();
    }
    let s = '<codeblock class="markdown" style="display: block"'
    s += `${language == '' ? '' : ` language="${language}"`}><code><pre>`;
    reader.next();
    while (!reader.end) {
        while (reader.now != '\n' && !reader.end) {
            s += char(reader.now);
            reader.next();
        }
        if (reader.end)
            break;
        s += '\n'
        reader.next();
        let count = jumpEmptyLines(jump);
        if (jumpPrefix(jump) === false)
            break;
        if (reader.now == '`') {
            let count = 1;
            while (reader.next() == '`' && count < 3 && !reader.end)
                ++count;
            if (count >= 3) {
                while (!reader.end && reader.now != '\n')
                    reader.next();
                reader.next();
                jumpEmptyLines(jump);
                break;
            }
            reader.rollback(count);
        }
        for (let i = 0; i < count; ++i)
            s += '\n';
    }
    return `${s}</pre></code></codeblock>`;
}

/*
const html = () => {
    let s = '<', tag = '';
    while (reader.next() != '>' && reader.now != ' ' && !reader.end)
        tag += reader.now;
    s += tag;
    while (!reader.end) {
        s += reader.now;
        if (reader.now == '/') {
            let count = 0;
            while (count < tag.length && tag[count] == reader.next()) {
                ++count;
                s += reader.now;
            }
            if (count >= tag.length && [' ', '>'].includes(reader.next())) {
                while (!reader.end && !['>', '\n'].includes(reader.now)) {
                    s += reader.now;
                    reader.next();
                }
                if (reader.now == '>') {
                    while (reader.next() != '\n' && !reader.end)
                        ;
                    jumpEmptyLines('');
                    return s + '>';
                }
            }
            s += reader.now;
        }
        reader.next();
    }
    return s;
}
*/

// inline elements
// end at the next char

const text = () => {
    jumpEmpty();
    let s = '', c = reader.now, spaceCount = 0;
    while (!reader.end) {
        if (c == '\n') {
            c = reader.next();
            if (spaceCount)
                s = s.slice(0, -spaceCount);
            if (spaceCount >= 2)
                s += '<br />';
            break;
        }
        if (c == ' ')
            ++spaceCount;
        else
            spaceCount = 0;
        switch (c) {
            case '*':
                s += boldAndItalic('\n'); break;
            case '`':
                s += code(); break;
            case '[':
                s += link(); break;
            case '!':
                c = reader.next();
                if (c == '[')
                    s += image();
                else
                    s += '!'
                break;
            case '&':
                s += escape(); break;
            case '<':
                s += br(); break;
            case '\\':
                c = reader.next();
            default:
                s += char(c);
                reader.next(); break;
        }
        c = reader.now;
    }
    return s;
}

const boldAndItalic = (end) => {
    let count = 1;
    if (typeof boldAndItalic.map != undefined)
        boldAndItalic.map = ['', 'em', 'strong'];
    while (reader.next() == '*' && !reader.end) {
        ++count;
        if (count == 4) {
            reader.next();
            return '';
        }
    }
    let s1 = '', s2 = '', stack = [], top = 0;
    if (count == 3) {
        stack[0] = [1, ''];
        stack[1] = [2, ''];
        top = 1;
    }
    else
        stack[0] = [count, ''];
    while (!reader.end) {
        switch (reader.now) {
            case '\n':
            case end:
                let s = '';
                for (let i = top; i >= 0; --i) {
                    s = stack[i][1] + s;
                    for (let j = 0; j < stack[i][0]; ++j)
                        s = '*' + s;
                }
                return s;
            case '[':
                stack[top][1] += link(); break;
            case '`':
                stack[top][1] += code(); break;
            case '&':
                stack[top][1] += escape(); break;
            case '*':
                let count = 1;
                while (reader.next() == '*' && !reader.end) {
                    ++count;
                    if (count == 4)
                        break;
                }
                if (top == 1) {
                    if (count >= 3) {
                        let tag1 = boldAndItalic.map[stack[0][0]],
                            tag2 = boldAndItalic.map[stack[1][0]];
                        return `<${tag1} class="markdown">${stack[0][1]}`
                            + `<${tag2} class="markdown">${stack[1][1]}`
                            + `</${tag2}></${tag1}>`;
                    }
                    let newItalic = false;
                    if (stack[1][0] != count && stack[0][1] == '')
                        [stack[0][0], stack[1][0]] = [stack[1][0], stack[0][0]];
                    if (count > stack[1][0])
                        newItalic = true;
                    let tag = boldAndItalic.map[stack[1][0]];
                    stack[0][1] += `<${tag} class="markdown">${stack[1][1]}</${tag}>`;
                    if (newItalic)
                        stack[1] = [1, ''];
                    else {
                        stack[1] = undefined;
                        top = 0;
                    }
                }
                else {
                    let tag = boldAndItalic.map[stack[0][0]];
                    switch (count) {
                        case 4:
                            break;
                        case 3:
                            reader.rollback(count - stack[0][0]);
                            return `<${tag} class="markdown">${stack[0][1]}</${tag}>`;
                        default:
                            if (count == stack[0][0])
                                return `<${tag} class="markdown">${stack[0][1]}</${tag}>`;
                            stack[1] = [count, '']
                            top = 1;
                            break;
                    }
                }
                break;
            default:
                stack[top][1] += char(reader.now);
                reader.next(); break;
        }
    }
}

const code = () => {
    let s = '<codeline class="markdown" style="display: inline"><code>';
    while (reader.next() != '`' && reader.now != '\n' && !reader.end) {
        s += char(reader.now);
    }
    reader.next();
    return `${s}</code></codeline>`;
}

const link = () => {
    let text = '';
    reader.next();
    while (!reader.end && reader.now != ']' && reader.now != '\n') {
        switch (reader.now) {
            case '`':
                text += code(); break;
            case '*':
                text += boldAndItalic(']'); break;
            case '!':
                c = reader.next();
                if (c == '[')
                    text += image();
                else
                    text += '!'
                break;
            case '&':
                text += escape(); break;
            default:
                text += char(reader.now);
                reader.next(); break;
        }
    }

    // [not a link
    if (reader.end || reader.now == '\n')
        return `[${text}`;
    // [not a link]
    if (reader.next() != '[' && reader.now !='(')
        return `[${text}]`;

    let s = '<a class="markdown" href="';
    // [text][
    if (reader.now == '[') {
        let link = '';
        while (/[A-Za-z0-9\-]/.test(reader.next()) && !reader.end)
            link += reader.now;
        // [not][link
        if (reader.end || reader.now != ']')
            return `[${text}][${link}`;
        // [text][link-name]
        s += `${links[link].link}"`;
        if (links[link].title)
            s += ` title="${links[link].title}"`;
        s += `>${text}</a>`;
        reader.next();
        return s;
    }
    // [text](
    else {
        reader.next()
        let [link, title, temp] = linkContent(')')
        if (link) {
            reader.rollback(1);
            while (isEmpty(reader.next()))
                temp += reader.now;
            // [not](link
            if (reader.end || reader.now != ')')
                return `[${text}](${temp}`;

            // [text](link "title")
            reader.next();
            s += `${link}"${title == '' ? '' : ` title="${title}"`}>${text}</a>`;
            return s;
        }
        // [not](link
        return `[${text}](${title}`;
    }
}

const image = () => {
    let alt = '', count = 0;
    reader.next();
    while (!reader.end && reader.now != ']' && reader.now != '\n') {
        if (reader.now == '"')
            alt += '\\"';
        else
            alt += char(reader.now);
        ++count;
        reader.next();
    }

    // ![not img
    if (reader.end || reader.now == '\n') {
        reader.rollback(count);
        return '![' + text();
    }
    reader.next();
    // ![image with only alt]
    if (reader.end || !['(', '['].includes(reader.now)) {
        if (alt.length)
            return `<img class="markdown" alt="${alt}" />`;
        // ![]
        else
            return '![]';
    }

    let s = `<img class="markdown" ${alt.length ? `alt="${alt}" ` : ''}src="`;
    // ![alt][
    if (reader.now == '[') {
        let link = '';
        while (/[A-Za-z0-9\-]/.test(reader.next()) && !reader.end)
            link += reader.now;
        // ![not][img
        if (reader.end || reader.now != ']') {
            reader.rollback(count + link.length + 2);
            return '![' + text();
        }
        // ![alt][link-name]
        s += `${links[link].link}"`;
        if (links[link].title)
            s += ` title="${links[link].title}"`
        s += ' />';
        reader.next();
        return s;
    }
    // ![alt](
    else {
        reader.next()
        let [link, title, temp] = linkContent(')')
        if (link) {
            reader.rollback(1);
            while (isEmpty(reader.next()))
                temp += reader.now;
            // ![not](img
            if (reader.end || reader.now != ')'){
                reader.rollback(count + temp.length + 2);
                return '![' + text();
            }

            // ![alt](link "title")
            reader.next();
            s += `${link}" ${title.length ? `title="${title}" ` : ''}/>`;
            return s;
        }
        // ![not](img
        reader.rollback(count + title.length + 2);
        return '![' + text();
    }
}

const br = () => {
    let s = reader.next();
    if (s != 'b') {
        reader.rollback(1);
        return '&lt';
    }
    s += reader.next();
    if (s != 'br') {
        reader.rollback(2);
        return '&lt';
    }
    reader.next();
    while (!reader.end && reader.now == ' ') {
        s += ' ';
        reader.next();
    }
    if (reader.end || (reader.now != '/' && reader.now != '>'))
        return '&lt;' + s;
    s += reader.now;
    reader.next();
    if (s[s.length - 1] == '>')
        return '<br />';
    if (reader.now == '>') {
        reader.next();
        return '<br />';
    }
    return '&lt;' + s;
}