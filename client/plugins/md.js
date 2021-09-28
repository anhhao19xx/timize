import marked from "marked";
import { nanoid } from "nanoid";

export default ({ app }, inject) => {
  // tokenizer
const tokenizer = {
  list(src){
    let cap = /^( {0,3}(?:[*+-]|\d{1,9}[.)]))( (?!\[[ xX]\])[^\n]+?)?(?:\n|$)/.exec(src);

    if (cap) {
      let raw, istask, ischecked, indent, i, blankLine, endsWithBlankLine,
        line, lines, itemContents;

      let bull = cap[1].trim();
      const isordered = bull.length > 1;

      const list = {
        type: 'list',
        raw: '',
        ordered: isordered,
        start: isordered ? +bull.slice(0, -1) : '',
        loose: false,
        items: []
      };

      bull = isordered ? `\\d{1,9}\\${bull.slice(-1)}` : `\\${bull}`;

      if (this.options.pedantic) {
        bull = isordered ? bull : '[*+-]';
      }

      // Get next list item
      const itemRegex = new RegExp(`^( {0,3}${bull})((?: [^\\n]*| *)(?:\\n[^\\n]*)*(?:\\n|$))`);

      // Get each top-level item
      while (src) {
        if (this.rules.block.hr.test(src)) { // End list if we encounter an HR (possibly move into itemRegex?)
          break;
        }

        if (!(cap = itemRegex.exec(src))) {
          break;
        }

        lines = cap[2].split('\n');

        if (this.options.pedantic) {
          indent = 2;
          itemContents = lines[0].trimLeft();
        } else {
          indent = cap[2].search(/[^ ]/); // Find first non-space char
          indent = cap[1].length + (indent > 4 ? 1 : indent); // intented code blocks after 4 spaces; indent is always 1
          itemContents = lines[0].slice(indent - cap[1].length);
        }

        blankLine = false;
        raw = cap[0];

        if (!lines[0] && /^ *$/.test(lines[1])) { // items begin with at most one blank line
          raw = cap[1] + lines.slice(0, 2).join('\n') + '\n';
          list.loose = true;
          lines = [];
        }

        const nextBulletRegex = new RegExp(`^ {0,${Math.min(3, indent - 1)}}(?:[*+-]|\\d{1,9}[.)])`);

        for (i = 1; i < lines.length; i++) {
          line = lines[i];

          if (this.options.pedantic) { // Re-align to follow commonmark nesting rules
            line = line.replace(/^ {1,4}(?=( {4})*[^ ])/g, '  ');
          }

          // End list item if found start of new bullet
          if (nextBulletRegex.test(line)) {
            raw = cap[1] + lines.slice(0, i).join('\n') + '\n';
            break;
          }

          // Until we encounter a blank line, item contents do not need indentation
          if (!blankLine) {
            if (!line.trim()) { // Check if current line is empty
              blankLine = true;
            }

            // Dedent if possible
            if (line.search(/[^ ]/) >= indent) {
              itemContents += '\n' + line.slice(indent);
            } else {
              itemContents += '\n' + line;
            }
            continue;
          }

          // Dedent this line
          if (line.search(/[^ ]/) >= indent || !line.trim()) {
            itemContents += '\n' + line.slice(indent);
            continue;
          } else { // Line was not properly indented; end of this item
            raw = cap[1] + lines.slice(0, i).join('\n') + '\n';
            break;
          }
        }

        if (!list.loose) {
          // If the previous item ended with a blank line, the list is loose
          if (endsWithBlankLine) {
            list.loose = true;
          } else if (/\n *\n *$/.test(raw)) {
            endsWithBlankLine = true;
          }
        }

        // Check for task list items
        if (this.options.gfm) {
          istask = /^\[[ xX]\] /.exec(itemContents);
          if (istask) {
            ischecked = istask[0] !== '[ ] ';
            itemContents = itemContents.replace(/^\[[ xX]\] +/, '');
          }
        }

        list.items.push({
          type: 'list_item',
          raw: raw,
          task: !!istask,
          checked: ischecked,
          loose: false,
          text: itemContents
        });

        list.raw += raw;
        src = src.slice(raw.length);
      }

      // Do not consume newlines at end of final item. Alternatively, make itemRegex *start* with any newlines to simplify/speed up endsWithBlankLine logic
      list.items[list.items.length - 1].raw = raw.trimRight();
      list.items[list.items.length - 1].text = itemContents.trimRight();
      list.raw = list.raw.trimRight();

      const l = list.items.length;

      // Item child tokens handled here at end because we needed to have the final item to trim it first
      for (i = 0; i < l; i++) {
        this.lexer.state.top = false;
        list.items[i].tokens = this.lexer.blockTokens(list.items[i].text, []);
        if (list.items[i].tokens.some(t => t.type === 'space')) {
          list.loose = true;
          list.items[i].loose = true;
        }
      }

      return list;
    }
  }
}

marked.use({ tokenizer });
  // renderer
  const renderer = {}

  marked.use({ renderer });

  // walk-token
  const walkTokens = (token) => {};

  marked.use({ walkTokens });

  // extensions
  const taskList = {
    name: 'tasklist',
    level: 'block',
    start(src){ return src.match(/^[*+-]/)?.index },
    tokenizer(src){
      const rule = /^(?:[*+-] \[[ xX]\][^\n]*(?:\n|$))+/;
      const match = rule.exec(src);
      if (!match)
        return;

      const token = {
        type: 'tasklist',
        raw: match[0],
        text: match[0].trim(),
        tokens: []
      }

      this.lexer.inline(token.text, token.tokens);
      return token;
    },
    renderer(token){
      return `<ul class="task-list">${this.parser.parseInline(token.tokens)}\n</ul>\n`;
    }
  }

  const taskItem = {
    name: 'taskitem',
    level: 'inline',
    start(src) { return src.match(/^[*+-]/)?.index; },
    tokenizer(src) {
      const rule = /^[*+-] \[([ xX])\]([^\n]*)(?:\n|$)/;
      const match = rule.exec(src);
      if (!match)
        return;
        
      return {
        type: 'taskitem',
        raw: match[0],
        checked: match[1] !== ' ',
        tokens: this.lexer.inlineTokens(match[2].trim())
      };
    },
    renderer(token) {
      const id = nanoid();
      const checkbox = `<input type="checkbox" id="ti-checkbox-${id}" ${token.checked ? 'checked ' : ''}onclick="return false;"></input>`;
      const label = `<label for="ti-checkbox-${id}">${this.parser.parseInline(token.tokens)}</label>`
      return `\n<li class="task-item">${checkbox}${label}</li>`;
    }
  };

  const hash = {
    name: 'hash',
    level: 'inline',
    start(src){ return src.match(/\#/)?.index },
    tokenizer(src, tokens){
      const rule = /^\#([\w-]+)/;
      const match = rule.exec(src);
      if (!match)
        return;

      return {
        type: 'hash',
        raw: match[0],
        text: match[1]
      }
    },
    renderer(token){
      return `<a class="hash" href="#/hash/${token.text}">${token.text}</a>`;
    }
  }

  marked.use({ extensions: [ taskList, taskItem, hash ]});

  // end extensions

  inject('md', {
    parse(str){
      return marked(str);
    }
  })
}
