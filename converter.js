// please comment this function when not used in nodejs
exports.convert = (md) => {
    return convert(md);
};

const convert = (md) => {
    var reader = new Reader(md);
    const links = genLinks(reader);
    reader.rollback(md.length);
    var pack = {reader: reader, links: links};
    return root(pack);
};

class Reader {
    constructor(s) {
        this._s = s;
        this._pos = 0;
    }
    get now() { return this._s[this._pos]; }
    get end() { return this._pos >= this._s.length; }
    get pos() { return this._pos; }
    next() {
        if (!this.end)
            ++this._pos;
        return this._s[this._pos];
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

const genLinks = (reader) => {
    var links = [];
    while (!reader.end) {
        while (reader.now == '[') {
            var name = '', link = '', start = reader.pos;
            while (![']', '\n'].includes(reader.next()))
                name += reader.now;
            if (reader.now == ']' && reader.next() == ':') {
                while ([' ', '\t'].includes(reader.next()))
                    ;
                reader.rollback(1);
                while (!['\n', ' '].includes(reader.next()) && !reader.end)
                    link += reader.now;
                var title = '';
                if (reader.now == ' ') {
                    while ([' ', '\t'].includes(reader.next()))
                        ;
                    if (reader.now == '"')
                        while (!['"', '\n'].includes(reader.next()) && !reader.end)
                            title += reader.now;
                }
                links[name] = {link: link, title: title};
                reader.next();
                reader.del(start, reader.pos);
                if (reader.now == '[')
                    continue;
            }
            break;
        }
        var count = 1;
        while (!reader.end && count < 2) {
            if (reader.now == '\n')
                ++count;
            else
                count = 0;
            reader.next();
        }
    }
    return links;
}

const isNumber = (c) => {
    if (c >= '0' && c <= '9')
        return true;
    return false;
}

const jumpEmptyLines = (r) => {
    while (!r.end) {
        var count = 0;
        while (!r.end && [' ', '\t'].includes(r.now)) {
            ++count;
            r.next();
        }
        if (r.end)
            break;
        if (r.now != '\n') {
            r.rollback(count);
            break;
        }
        r.next();
    }
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
            return '&quot';
        case '&':
            return '&amp;'
        default:
            return c;
    }
}

const escape = (pack) => {
    var c = pack.reader.next(), temp = '', count = 0, isCode = false;
    if (c == '#') {
        c = pack.reader.next();
        ++count;
        isCode = true;
    }
    while (!pack.reader.end && ![';', '\n'].includes(c) && count < 10) {
        if (isCode && !isNumber(c))
            break;
        temp += c;
        c = pack.reader.next();
    }
    if (c != ';')
        return '&amp;' + (isCode ? '#' : '') + temp;
    pack.reader.next();
    if (isCode)
        return String.fromCharCode(Number.parseInt(temp));
    return '&' + temp + ';';
}

const root = (pack) => {
    var s = '';
    jumpEmptyLines(pack.reader);
    while (!pack.reader.end)
        s += block(pack, '');
    return s;
}

const block = (pack, jump) => {
    for (var i = 0; i < jump.length; ++i) {
        if (pack.reader.end || pack.reader.now != jump[i]) {
            pack.reader.rollback(i);
            return '';
        }
        pack.reader.next();
    }
    if (isNumber(pack.reader.now))
        return oList(pack, jump);
    switch (pack.reader.now) {
        case '#':
            return heading(pack);
        case '>':
            return quote(pack, jump);
        case '*':
            return uList(pack, jump);
        case '!':
            return image(pack);
        case '<':
            return html(pack);
        case '\t':
            pack.reader.next();
            return codeBlock(pack, jump + '\t');
        case '`':
            var count = 1;
            while (pack.reader.next() == '`' && !pack.reader.end)
                ++count;
            if (count > 2)
                return codeBlock2(pack, jump);
            else
                pack.reader.rollback(count);
        case ' ':
            var count = 1;
            while (pack.reader.next() == ' ' && count < 4 && !pack.reader.end)
                ++count;
            if (pack.reader.end)
                return '';
            if (count > 3)
                return codeBlock(pack, jump + '    ');
            pack.reader.rollback(count);
        default:
            return paragraph(pack);
    }
}

// block elements
// end at the 1st char, 1st line of the next block

const paragraph = (pack) => {
    var s = '<p class="markdown">', c = pack.reader.now;
    var lineStart = false, spaceCount = 0;
    while (!pack.reader.end && [' ', '\t'].includes(c))
        c = pack.reader.next();
    while (!pack.reader.end) {
        if (c == '\n') {
            c = pack.reader.next();
            lineStart = true;
            if (c == '\n')
                break;
        }
        if (lineStart) {
            if (spaceCount >= 2) {
                s = s.substr(0, s.length - spaceCount);
                s += '<br />';
            }
            else
                if (s[s.length - 1] != ' ')
                    s += ' ';
            while (!pack.reader.end && [' ', '\t'].includes(c))
                c = pack.reader.next();
            lineStart = false;
            spaceCount = 0;
        }
        if (c == ' ')
            ++spaceCount;
        else
            spaceCount = 0;
        switch (c) {
            case '*':
                s += boldAndItalic(pack, '\n'); break;
            case '`':
                s += code(pack); break;
            case '[':
                s += link(pack); break;
            case '&':
                s += escape(pack); break;
            case '<':
                s += br(pack); break;
            case '\\':
                c = pack.reader.next();
            default:
                s += char(c);
                c = pack.reader.next(); break;
        }
        c = pack.reader.now;
    }
    jumpEmptyLines(pack.reader);
    return s + '</p>';
}

const heading = (pack) => {
    var count = 1, c = '';
    while (pack.reader.next() == '#')
        ++count;
    pack.reader.rollback(1);
    while ([' ', '\t'].includes(pack.reader.next()) && !pack.reader.end)
        ;
    if (pack.reader.end) {
        pack.reader.rollback(count);
        return paragraph(pack);
    }
    var s = '<h' + (count > 3 ? 3 : count) + ' class="markdown">';
    while (!pack.reader.end && pack.reader.now != '\n') {
        if (pack.reader.now == '&')
            s += escape(pack);
        else {
            s += char(pack.reader.now);
            pack.reader.next();
        }
    }
    jumpEmptyLines(pack.reader);
    return s + '</h' + (count > 3 ? 3 : count) + '>';
}

const quote = (pack, jump) => {
    var s = '<blockquote class="markdown">';
    while (pack.reader.now == '>') {
        if (pack.reader.next() != ' ') {
            pack.reader.rollback(1);
            return paragraph(pack);
        }
        while ([' ', '\t'].includes(pack.reader.next()) && !pack.reader.end)
            ;
        if (!pack.reader.end)
            s += listItem(pack, jump);
        for (var i = 0; i < jump.length; ++i) {
            if (pack.reader.end || pack.reader.now != jump[i]) {
                pack.reader.rollback(i);
                return s + '</blockquote>';
            }
            pack.reader.next();
        }
    }
    return s + '</blockquote>';
}

const uList = (pack, jump) => {
    var s = '<ul class="markdown">';
    while (pack.reader.now == '*') {
        if (pack.reader.next() != ' ') {
            pack.reader.rollback(1);
            return paragraph(pack);
        }
        while ([' ', '\t'].includes(pack.reader.next()) && !pack.reader.end)
            ;
        if (!pack.reader.end)
            s += '<li class="markdown">' + listItem(pack, jump) + '</li>';
        for (var i = 0; i < jump.length; ++i) {
            if (pack.reader.end || pack.reader.now != jump[i]) {
                pack.reader.rollback(i);
                return s + '</ul>';
            }
            pack.reader.next();
        }
    }
    return s + '</ul>';
}

const oList = (pack, jump) => {
    var s = '<ol class="markdown">';
    while (isNumber(pack.reader.now)) {
        while (isNumber(pack.reader.next()))
            ;
        if (pack.reader.now != '.') {
            pack.reader.rollback(1);
            return paragraph(pack);
        }
        if (pack.reader.next() != ' ') {
            pack.reader.rollback(2);
            return paragraph(pack);
        }
        while ([' ', '\t'].includes(pack.reader.next()) && !pack.reader.end)
            ;
        if (!pack.reader.end)
            s += '<li class="markdown">' + listItem(pack, jump) + '</li>';
        for (var i = 0; i < jump.length; ++i) {
            if (pack.reader.end || pack.reader.now != jump[i]) {
                pack.reader.rollback(i);
                return s + '</ol>';
            }
            pack.reader.next();
        }
    }
    return s + '</ol>';
}

const listItem = (pack, jump) => {
    var s =  paragraph(pack);
    jumpEmptyLines(pack.reader);
    while ([' ', '\t'].includes(pack.reader.now)) {
        for (var i = 0; i < jump.length; ++i) {
            if (pack.reader.end || pack.reader.now != jump[i]) {
                pack.reader.rollback(i);
                return s;
            }
            pack.reader.next();
        }
        var temp = '';
        if (pack.reader.now == ' ') {
            var count = 1;
            temp += ' ';
            while (pack.reader.next() == ' ' && count < 4 && !pack.reader.end) {
                ++count;
                temp += ' ';
            }
            if (count < 4) {
                pack.reader.rollback(count);
                return s;
            }
            pack.reader.rollback(count);
        }
        else if (pack.reader.now == '\t')
            temp = '\t';
        pack.reader.rollback(jump.length);
        s += block(pack, jump + temp);
    }
    return s;
}

// starts with 4 spaces or 1 tab
const codeBlock = (pack, jump) => {
    var s = '<codeblock class="markdown" style="display: block"><code><pre>';
    while (!pack.reader.end) {
        while (!pack.reader.end && pack.reader.now != '\n') {
            s += char(pack.reader.now);
            pack.reader.next();
        }
        if (pack.reader.end)
            break;
        var count = 0, temp = '';
        while (pack.reader.now == '\n') {
            count = 0;
            temp += '\n';
            while ([' ', '\t'].includes(pack.reader.next()))
                ++count;
        }
        pack.reader.rollback(count);
        for (var i = 0; i < jump.length; ++i) {
            if (pack.reader.end || pack.reader.now != jump[i]) {
                pack.reader.rollback(i);
                jumpEmptyLines(pack.reader);
                return s + '</pre></code></codeblock>';
            }
            pack.reader.next();
        }
        s += temp;
    }
    jumpEmptyLines(pack.reader);
    return s + '</pre></code></codeblock>';
}

// starts with ```
const codeBlock2 = (pack, jump) => {
    var s = '<codeblock class="markdown" style="display: block"><code><pre>';
    while (!pack.reader.end && pack.reader.now != '\n')
        pack.reader.next();
    pack.reader.next();
    while (!pack.reader.end) {
        while (pack.reader.now != '\n' && !pack.reader.end) {
            s += char(pack.reader.now);
            pack.reader.next();
        }
        if (pack.reader.end)
            break;
        for (var i = 0; i < jump.length; ++i) {
            if (pack.reader.next() == '\n')
                break;
            if (pack.reader.end || pack.reader.now != jump[i]) {
                pack.reader.rollback(i + 1);
                jumpEmptyLines(pack.reader);
                return s + '</pre></code></codeblock>';
            }
        }
        if (pack.reader.next() == '`') {
            var count = 1;
            while (pack.reader.next() == '`' && count < 3 && !pack.reader.end)
                ++count;
            if (count > 2) {
                while (!pack.reader.end && pack.reader.now != '\n')
                    pack.reader.next();
                jumpEmptyLines(pack.reader);
                return s + '</pre></code></codeblock>';
            }
            pack.reader.rollback(count);
        }
        s += '\n';
    }
    jumpEmptyLines(pack.reader);
    return s + '</pre></code></codeblock>';
}

const image = (pack) => {
    if (pack.reader.next() != '['){
        pack.reader.rollback(1);
        return paragraph(pack, 0);
    }
    var alt = '', n = 1;
    pack.reader.next();
    while (!pack.reader.end && pack.reader.now != ']' && pack.reader.now != '\n') {
        switch (pack.reader.now) {
            case '`':
                alt += code(pack); break;
            case '*':
                alt += boldAndItalic(pack, ']'); break;
            case '&':
                alt += escape(pack); break;
            default:
                alt += char(pack.reader.now);
                pack.reader.next(); break;
        }
        ++n;
    }

    // ![not a image
    if (pack.reader.end || pack.reader.now == '\n') {
        jumpEmptyLines(pack.reader);
        return '<p class="markdown>![' + alt + '</p>';
    }
    // ![image with only alt]
    if (pack.reader.next() != '(' && pack.reader.now != '[') {
        while (!pack.reader.end && pack.reader.now != '\n')
            pack.reader.next();
        jumpEmptyLines(pack.reader);
        return '<img class="markdown" alt="' + alt + '" />';
    }

    var link = '', c = pack.reader.now == '[' ? ']' : ')';
    while (pack.reader.next() != c && pack.reader.now != ' '
        && pack.reader.now != '\n' && !pack.reader.end)
        link += pack.reader.now;
    s = '<img class="markdown" src="';

    // ![img alt][1]
    if (c == ']') {
        pack.reader.rollback(1);
        while (pack.reader.next() != '\n' && !pack.reader.end)
            ;
        s += pack.links[link].link + '"';
        if (pack.links[link].title != '')
            s += ' title="' + pack.links[link].title + '"';
        s += ' alt="' + alt + '" />';
        jumpEmptyLines(pack.reader);
        return s;
    }

    // ![image alt](link
    var title = '';
    if (pack.reader.now == ' ') {
        while (pack.reader.next() == ' ' || pack.reader.now == '\t')
            ;
        // ![image alt](link "title
        if (pack.reader.now == '"')
            while (pack.reader.next() != '"' && pack.reader.now != '\n' && !pack.reader.end)
                title += pack.reader.now;
    }
    while (pack.reader.next() != '\n' && !pack.reader.end)
        ;
    s += link + '"';
    if (title != '')
        s += ' title="' + title + '"';
    s += ' alt="' + alt + '" />';
    jumpEmptyLines(pack.reader);
    return s;
}

const html = (pack) => {
    var s = '<', tag = '';
    while (pack.reader.next() != '>' && pack.reader.now != ' ' && !pack.reader.end)
        tag += pack.reader.now;
    s += tag;
    while (!pack.reader.end) {
        s += pack.reader.now;
        if (pack.reader.now == '/') {
            var count = 0;
            while (count < tag.length && tag[count] == pack.reader.next()) {
                ++count;
                s += pack.reader.now;
            }
            if (count >= tag.length && [' ', '>'].includes(pack.reader.next())) {
                while (!pack.reader.end && !['>', '\n'].includes(pack.reader.now)) {
                    s += pack.reader.now;
                    pack.reader.next();
                }
                if (pack.reader.now == '>') {
                    while (pack.reader.next() != '\n' && !pack.reader.end)
                        ;
                    jumpEmptyLines(pack.reader);
                    return s + '>';
                }
            }
            s += pack.reader.now;
        }
        pack.reader.next();
    }
    return s;
}

// inline elements
// end at the next char

const boldAndItalic = (pack, end) => {
    var count = 1;
    if (typeof boldAndItalic.map != undefined)
        boldAndItalic.map = ['', 'em', 'strong'];
    while (pack.reader.next() == '*' && !pack.reader.end) {
        ++count;
        if (count == 4) {
            pack.reader.next();
            return '';
        }
    }
    var s1 = '', s2 = '', stack = [], top = 0;
    if (count == 3) {
        stack[0] = [1, ''];
        stack[1] = [2, ''];
        top = 1;
    }
    else
        stack[0] = [count, ''];
    while (!pack.reader.end) {
        switch (pack.reader.now) {
            case '\n':
            case end:
                break;
            case '[':
                stack[top][1] += link(pack); break;
            case '`':
                stack[top][1] += code(pack); break;
            case '&':
                stack[top][1] += escape(pack); break;
            case '*':
                var count = 1;
                while (pack.reader.next() == '*' && !pack.reader.end) {
                    ++count;
                    if (count == 4)
                        break;
                }
                if (top == 1) {
                    if (count >= 3) {
                        var tag1 = boldAndItalic.map[stack[0][0]],
                            tag2 = boldAndItalic.map[stack[1][0]];
                        return '<' + tag1 + ' class="markdown">' + stack[0][1]
                            + '<' + tag2 + ' class="markdown">' + stack[1][1]
                            + '</' + tag2 + '></' + tag1 + '>';
                    }
                    var newItalic = false;
                    if (stack[1][0] != count && stack[0][1] == '')
                        [stack[0][0], stack[1][0]] = [stack[1][0], stack[0][0]];
                    if (count > stack[1][0])
                        newItalic = true;
                    var tag = boldAndItalic.map[stack[1][0]];
                    stack[0][1] += '<' + tag + ' class="markdown">'
                        + stack[1][1] + '</' + tag + '>';
                    if (newItalic)
                        stack[1] = [1, ''];
                    else {
                        stack[1] = undefined;
                        top = 0;
                    }
                }
                else {
                    var tag = boldAndItalic.map[stack[0][0]];
                    switch (count) {
                        case 4:
                            break;
                        case 3:
                            pack.reader.rollback(count - stack[0][0]);
                            return '<' + tag + ' class="markdown">'
                                + stack[0][1] + '</' + tag + '>';
                        default:
                            if (count == stack[0][0])
                                return '<' + tag + ' class="markdown">'
                                    + stack[0][1] + '</' + tag + '>';
                            stack[1] = [count, '']
                            top = 1;
                            break;
                    }
                }
                break;
            default:
                stack[top][1] += char(pack.reader.now);
                pack.reader.next(); break;
        }
    }
}

const code = (pack) => {
    var s = '<codeline class="markdown" style="display: inline"><code>';
    while (pack.reader.next() != '`' && pack.reader.now != '\n' && !pack.reader.end) {
        s += char(pack.reader.now);
    }
    pack.reader.next();
    return s + '</code></codeline>';
}

const link = (pack) => {
    var text = '';
    pack.reader.next();
    while (!pack.reader.end && pack.reader.now != ']' && pack.reader.now != '\n') {
        switch (pack.reader.now) {
            case '`':
                text += code(pack); break;
            case '*':
                text += boldAndItalic(pack, ']'); break;
            case '&':
                text += escape(pack); break;
            default:
                text += char(pack.reader.now);
                pack.reader.next(); break;
        }
    }
    if (pack.reader.end || pack.reader.now == '\n')
        return '[' + text;
    if (pack.reader.next() != '[' && pack.reader.now !='(')
        return '[' + text + ']';
    var link = '', c = pack.reader.now == '[' ? ']' : ')';
    while (pack.reader.next() != c && pack.reader.now != ' '
        && pack.reader.now != '\n' && !pack.reader.end)
        link += pack.reader.now;
    s = '<a class="markdown" href="';
    if (c == ']') {
        pack.reader.rollback(1);
        while (pack.reader.next() != c && pack.reader.now != '\n' && !pack.reader.end)
            ;
        s += pack.links[link].link + '"';
        if (pack.links[link].title != '')
            s += ' title="' + pack.links[link].title + '"';
        s += '>' + text + '</a>';
        pack.reader.next();
        return s;
    }
    var title = '';
    if (pack.reader.now == ' ') {
        while (pack.reader.next() == ' ' || pack.reader.now == '\t')
            ;
        if (pack.reader.now == '"')
            while (pack.reader.next() != '"' && pack.reader.now != '\n' && !pack.reader.end)
                title += pack.reader.now;
    }
    pack.reader.rollback(1);
    while (pack.reader.next() != c && pack.reader.now != '\n' && !pack.reader.end)
        ;
    s += link + '"';
    if (title != '')
        s += ' title="' + title + '"';
    s += '>' + text + '</a>';
    pack.reader.next();
    return s;
}

const br = (pack) => {
    var s = pack.reader.next();
    if (s != 'b') {
        pack.reader.rollback(1);
        return '&lt';
    }
    s += pack.reader.next();
    if (s != 'br') {
        pack.reader.rollback(2);
        return '&lt';
    }
    pack.reader.next();
    while (!pack.reader.end && pack.reader.now == ' ') {
        s += ' ';
        pack.reader.next();
    }
    if (pack.reader.end || (pack.reader.now != '/' && pack.reader.now != '>'))
        return '&lt;' + s;
    s += pack.reader.now;
    pack.reader.next();
    if (s[s.length - 1] == '>')
        return '<br />';
    if (pack.reader.now == '>') {
        pack.reader.next();
        return '<br />';
    }
    return '&lt;' + s;
}