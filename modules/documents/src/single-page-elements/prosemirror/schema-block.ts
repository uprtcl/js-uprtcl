import { Schema } from 'prosemirror-model';

const pDOM = ['p', 0],
  blockquoteDOM = ['blockquote', 0],
  hrDOM = ['hr'],
  preDOM = ['pre', ['code', 0]],
  brDOM = ['br'];

// :: Object
// [Specs](#model.NodeSpec) for the nodes defined in this schema.
export const nodes = {
  // :: NodeSpec The top level document node.
  doc: {
    content: 'block+'
  },

  // :: NodeSpec A plain paragraph textblock. Represented in the DOM
  // as a `<p>` element.
  paragraph: {
    content: 'inline*',
    group: 'block',
    attrs: {
      style: {
        default: ''
      }
    },
    toDOM(node) {
      return ['p', { style: node.attrs.style }, 0];
    },
    parseDOM: [
      {
        tag: 'p',
        getAttrs: node => {
          return {
            textAlign: node.attributes ? node.attributes.style : node.attrs.style
          };
        }
      }
    ]
  },

  // :: NodeSpec A horizontal rule (`<hr>`).
  horizontal_rule: {
    group: 'block',
    parseDOM: [{ tag: 'hr' }],
    toDOM() {
      return hrDOM;
    }
  },

  // :: NodeSpec A code listing. Disallows marks or non-text inline
  // nodes by default. Represented as a `<pre>` element with a
  // `<code>` element inside of it.
  code_block: {
    content: 'text*',
    marks: '',
    group: 'block',
    code: true,
    defining: true,
    parseDOM: [{ tag: 'pre', preserveWhitespace: 'full' }],
    toDOM: function toDOM() {
      return ['pre', ['code', 0]];
    }
  },

  // :: NodeSpec The text node.
  text: {
    group: 'inline'
  },

  // :: NodeSpec An inline image (`<img>`) node. Supports `src`,
  // `alt`, `style`, and `href` attributes. The latter two default to the empty
  // string.
  image: {
    inline: true,
    attrs: {
      src: {},
      alt: { default: null },
      title: { default: null },
      style: {}
    },
    group: 'inline',
    draggable: true,
    parseDOM: [
      {
        tag: 'img',
        getAttrs(dom) {
          return {
            src: dom.getAttribute('src'),
            title: dom.getAttribute('title'),
            alt: dom.getAttribute('alt'),
            style: dom.getAttribute('style')
          };
        }
      }
    ],
    toDOM(node) {
      let { src, alt, title, style } = node.attrs;
      return ['img', { src, alt, title, style }];
    }
  },

  // :: NodeSpec An inline image (`<iframe>`) node. Supports `src`,
  //  and `style` attributes.
  iframe: {
    inline: true,
    attrs: {
      src: {},
      style: {}
    },
    group: 'inline',
    parseDOM: [
      {
        tag: 'iframe',
        getAttrs(dom) {
          return {
            src: dom.getAttribute('src'),
            style: dom.getAttribute('style')
          };
        }
      }
    ],
    toDOM(node) {
      let { src, style } = node.attrs;
      return ['iframe', { src, style, class: 'yt-embed' }];
    }
  },

  // :: NodeSpec A hard line break, represented in the DOM as `<br>`.
  hard_break: {
    inline: true,
    group: 'inline',
    selectable: false,
    parseDOM: [{ tag: 'br' }],
    toDOM() {
      return brDOM;
    }
  }
};

const emDOM = ['em', 0],
  strongDOM = ['strong', 0],
  codeDOM = ['code', 0];

// :: Object [Specs](#model.MarkSpec) for the marks in the schema.
export const marks = {
  // :: MarkSpec A link. Has `href` and `title` attributes. `title`
  // defaults to the empty string. Rendered and parsed as an `<a>`
  // element.
  link: {
    attrs: {
      href: {},
      title: { default: null }
    },
    inclusive: false,
    parseDOM: [
      {
        tag: 'a[href]',
        getAttrs(dom) {
          return { href: dom.getAttribute('href'), title: dom.getAttribute('title') };
        }
      }
    ],
    toDOM(node) {
      let { href, title } = node.attrs;
      return ['a', { href, title }, 0];
    }
  },

  // :: MarkSpec An emphasis mark. Rendered as an `<em>` element.
  // Has parse rules that also match `<i>` and `font-style: italic`.
  em: {
    parseDOM: [{ tag: 'i' }, { tag: 'em' }, { style: 'font-style=italic' }],
    toDOM() {
      return emDOM;
    }
  },

  // :: MarkSpec A strong mark. Rendered as `<strong>`, parse rules
  // also match `<b>` and `font-weight: bold`.
  strong: {
    parseDOM: [
      { tag: 'strong' },
      // This works around a Google Docs misbehavior where
      // pasted content will be inexplicably wrapped in `<b>`
      // tags with a font-weight normal.
      { tag: 'b', getAttrs: node => node.style.fontWeight != 'normal' && null },
      {
        style: 'font-weight',
        getAttrs: value => /^(bold(er)?|[5-9]\d{2,})$/.test(value) && null
      }
    ],
    toDOM() {
      return strongDOM;
    }
  },

  // :: MarkSpec Code font mark. Represented as a `<code>` element.
  code: {
    parseDOM: [{ tag: 'code', node: 'code_block', preserveWhitespace: 'full' }],
    toDOM() {
      return codeDOM;
    }
  }
};

// :: Schema
// This schema roughly corresponds to the document schema used by
// [CommonMark](http://commonmark.org/), minus the list elements,
// which are defined in the [`prosemirror-schema-list`](#schema-list)
// module.
//
// To reuse elements from this schema, extend or read from its
// `spec.nodes` and `spec.marks` [properties](#model.Schema.spec).
export const blockSchema = new Schema({ nodes: nodes as any, marks: marks as any });
