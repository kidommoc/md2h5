class Reader {
    constructor(s) {
        this._s = s;
        this._pos = 0;
    }
    get now() { return this._s[this._pos]; }
    get end() { return this._pos >= this._s.length; }
    get pos() { return this._pos; }
    next() {
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
            while (reader.next() != ']' && reader.now != '\n')
                name += reader.now;
            if (reader.now == ']' && reader.next() == ':') {
                while (reader.next() == ' ' || reader.now == '\t')
                    ;
                reader.rollback(1);
                while (reader.next() != '\n' && reader.now != ' ' && !reader.end)
                    link += reader.now;
                var title = '';
                if (reader.now == ' ') {
                    while (reader.next() == ' ' || reader.now == '\t')
                        ;
                    if (reader.now == '"')
                        while (reader.next() != '"' && reader.now != '\n' && !reader.end)
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

const isWhitespace = (c) => {
    if (c == ' ' || c == '\t' || c == '\n')
        return true;
    return false;
}

const isNumber = (c) => {
    if (c >= '0' && c <= '9')
        return true;
    return false;
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
    while (!pack.reader.end && c != ';' && c != '\n' && count < 10) {
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

const paragraph = (pack) => {
    var s = '<p class="markdown">', c = pack.reader.now;
    var lineStart = true, lineMerge = false;
    while (!pack.reader.end) {
        if (c == '\n') {
            c = pack.reader.next();
            lineMerge = true;
            lineStart = true;
            if (c == '\n')
                break;
        }
        if (lineStart) {
            while (!pack.reader.end && (c == ' ' || c == '\t'))
                c = pack.reader.next();
            lineStart = false;
        }
        if (lineMerge && s[s.length - 1] != ' ') {
            s += ' ';
            lineMerge = false;
        }
        switch (c) {
            case '*':
                s += boldAndItalic(pack, '\n'); break;
            case '`':
                s += code(pack); break;
            case '[':
                s += link(pack); break;
            case '&':
                s += escape(pack); break;
            case '\\':
                c = pack.reader.next();
            default:
                s += char(c);
                c = pack.reader.next(); break;
        }
        c = pack.reader.now;
    }
    c = pack.reader.next();
    return s + '</p>';
}

const heading = (pack) => {
    var count = 1, c = '';
    while (pack.reader.next() == '#')
        if (count < 3)
            ++count;
    pack.reader.rollback(1);
    while (pack.reader.next() == ' ' || pack.reader.now == '\t')
        ;
    var s = '<h' + count + ' class="markdown">';
    while (!pack.reader.end && pack.reader.now != '\n') {
        if (pack.reader.now == '&')
            s += escape(pack);
        else {
            s += char(pack.reader.now);
            pack.reader.next();
        }
    }
    pack.reader.next();
    return s + '</h' + count + '>';
}

const quote = (pack) => {
}

const uList = (pack) => {
}

const oList = (pack) => {
}

const codeBlock = (pack) => {
}

const image = (pack) => {
    if (pack.reader.next() != '['){
        pack.reader.rollback(1);
        return paragraph(pack);
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
    if (pack.reader.end || pack.reader.now == '\n')
        return '<p class="markdown>![' + alt + '</p>';
    if (pack.reader.next() != '(' && pack.reader.now != '[')
        return '<img class="markdown" alt="' + alt + '" />';
    var link = '', c = pack.reader.now == '[' ? ']' : ')';
    while (pack.reader.next() != c && pack.reader.now != ' '
        && pack.reader.now != '\n' && !pack.reader.end)
        link += pack.reader.now;
    s = '<img class="markdown" src="';
    if (c == ']') {
        pack.reader.rollback(1);
        while (pack.reader.next() != c && pack.reader.now != '\n' && !pack.reader.end)
            ;
        s += pack.links[link].link + '"';
        if (pack.links[link].title != '')
            s += ' title="' + pack.links[link].title + '"';
        s += ' alt="' + alt + '" />';
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
    while (pack.reader.next() != c && pack.reader.now != '\n' && !pack.reader.end)
        ;
    s += link + '"';
    if (title != '')
        s += ' title="' + title + '"';
    s += ' alt="' + alt + '" />';
    pack.reader.next();
    return s;
}

const html = (pack) => {
    var s = '<', tag = '', count = 0;
    while (pack.reader.next() != '>' && pack.reader.now != ' ' && !pack.reader.end)
        tag += pack.reader.now;
    s += tag;
    tag += '>';
    while (!pack.reader.end) {
        s += pack.reader.now;
        if (pack.reader.now == '/') {
            while (count < tag.length && tag[count] == pack.reader.next()) {
                ++count;
                s += pack.reader.now;
            }
            if (count >= tag.length) {
                pack.reader.next();
                return s;
            }
            count = 0;
            s += pack.reader.now;
        }
        pack.reader.next();
    }
    return s;
}

const boldAndItalic = (pack, end) => {
    var count = 1;
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
    while (!pack.reader.end && pack.reader.now != '\n') {
        switch (pack.reader.now) {
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
                        var tag1 = stack[0][0] == 1 ? 'em' : 'strong';
                        var tag2 = stack[1][0] == 1 ? 'em' : 'strong';
                        return '<' + tag1 + ' class="markdown">' + stack[0][1]
                            + '<' + tag2 + ' class="markdown">' + stack[1][1]
                            + '</' + tag2 + '></' + tag1 + '>';
                    }
                    var newItalic = false;
                    if (stack[1][0] != count && stack[0][1] == '')
                        [stack[0][0], stack[1][0]] = [stack[1][0], stack[0][0]];
                    if (count > stack[1][0])
                        newItalic = true;
                    var tag = stack[1][0] == 1 ? 'em' : 'strong';
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
                    var tag = stack[0][0] == 1 ? 'em' : 'strong';
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
    var s = '<codeline class="markdown"><code>';
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

const root = (pack) => {
    var s = '';
    while (!pack.reader.end) {
        while (pack.reader.now == '\n')
            pack.reader.next();
        if (pack.reader.end)
            break;
        if (isNumber(pack.reader.now))
            s += oList(pack);
        switch (pack.reader.now) {
            case '#':
                s += heading(pack); break;
            case '>':
                s += quote(pack); break;
            case '*':
                s += uList(pack); break;
            case ' ':
                var count = 0;
                while (pack.reader.next() == ' ')
                    ++count;
                if (pack.reader.end || pack.reader.now == '\n')
                    break;
                if (count < 4) {
                    s += paragraph(pack);
                    break;
                }
                rollback(count);
            case '\t':
                s += codeBlock(pack); break;
            case '!':
                s += image(pack); break;
            case '<':
                s += html(pack); break;
            default:
                s += paragraph(pack); break;
        }
    }
    return s;
}

/*
//when used in website
const convert = (md) => {
    var reader = new Reader(md);
    const links = genLinks(reader);
    reader.rollback(md.length);
    var html = '', pack = {reader: reader, links: links};
    while (!reader.end) {
        html += root(pack);
    }
    return html;
};
*/

// when used in node
exports.convert = (md) => {
    var reader = new Reader(md);
    const links = genLinks(reader);
    reader.rollback(md.length);
    var pack = {reader: reader, links: links};
    return root(pack);
};