# block elements

## paragraph

- markdown

    ```markdown
    first line.
    second line.

    with linebreak:

    first line.<br />
    second line.

    first line.  # <- 2 spaces here
    second line.
    ```

- html

    ```html
    <p>first line. second line</p>
    <p>first line.<br />second line.</p>
    <p>first line.<br />second line.</p>
    ```

## block quote

- markdown

    ```markdown
    > quote
    >
    >> nested quote
    >>
    > > also nested
    >>
    >   >   most 3 spaces
    >
    >    4 spaces means codeblock
    >
    > - nested list
    > - not paragraph
    >
    > - nested list
    >
    > - with paragraph
    ```

- html

    ```html
    <blockquote>
        <p>quote</p>
        <blockquote>
            <p>nested quote</p>
            <p>also nested</p>
            <p>most 3 spaces</p>
        </blockquote>
        <codeblock><code><pre>4 spaces means codeblock</pre></code></codeblock>
        <ul>
            <li>nested list</li>
            <li>not paragraph</li>
        </ul>
        <ul>
            <li><p>nested list</p></li>
            <li><p>with paragraph</p></li>
        </ul>
    </blockquote>
    ```

## lists

- markdown

    ```markdown
    - list without
    - paragraph

    1. list with

    2. paragraph

    - this
    - property

    - is still effective here

    1. of course

    2. vice
    3. versa

    - the first block of a list
        - is always a paragraph
            > or just text.
        
        other blocks should be nested here
    
    1. another example
        here.
    2.        there must be at least 1 space after `.`,
              but no limitation.

        > nest a blockquote

            nest a codeblock
    ```

- html

    ```html
    <ul>
        <li>list without</li>
        <li>paragraph</li>
    </ul>
    <ol>
        <li><p>list with</p></li>
        <li><p>paragraph</p></li>
    </ol>
    <ul>
        <li>this</li>
        <li>property</li>
        <li>is still effective here</li>
    </ul>
    <ol>
        <li><p>of course</p></li>
        <li><p>vice</p></li>
        <li><p>versa</p></li>
    </ol>
    <ul>
        <li>
            <p>the first block of a list - is always a paragraph &gt; or just text.</p>
            <p>other blocks should be nested here</p>
        <li>
    </ul>
    <ol>
        <li>another example here.</li>
        <li>there must be at least 1 space after <code>.</code>, but no limitation.
            <blockquote><p>nest a blockquote</p></blockquote>
            <codeblock><code><pre>nest a codeblock</pre></code></codeblock>
        </li>
    </ol>
    ```
# inline elements

## bold and italic

- markdown

    ```markdown
    **4 continuous *asterisks means ****nothing***
    ```

- html

    ```html
    <strong>4 continuous <em>asterisks means nothing</em></strong>
    ```

## link and image

- markdown

    ```markdown
    [text]("link.com")
    [text](<"link.com">) # same

    [text]("link.com" "example title")
    [text]("link.com" 'example title')
    [text]("link.com" (example title)) # same

    ![alt]("image.com")
    ![alt](<"image.com">) # same

    ![alt]("image.com" "example title")
    ![alt]("image.com" 'example title')
    ![alt]("image.com" (example title)) # same

    [![image]("as.link" "content")]("link.com")
    ```

- html

    ```html
    <a href="link.com">text</a>

    <a href="link.com" title="example title">
    
    <img alt="alt" src="image.com" />
    
    <img alt="alt" src="image.com" title="example title" />

    <a href="link.com"><img alt="image" src="as.link" title="content" /></a>
    ```