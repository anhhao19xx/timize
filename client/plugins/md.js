import marked from "marked";
import { nanoid } from "nanoid";

export default ({ app }, inject) => {
  const todoList = {
    name: 'todoList',
    level: 'block',
    start(src) { return src.match(/\[x{0,1}\][^\n]/)?.index; },
    tokenizer(src, tokens) {
      const rule = /^(?:\[x{0,1}\].*(?:\n|$))+/;
      const match = rule.exec(src);
      if (match) {
        const token = {       
          type: 'todoList',
          raw: match[0],
          text: match[0].trim(),
          tokens: []
        };
        this.lexer.inline(token.text, token.tokens);
        return token;
      }
    },
    renderer(token) {
      return `<div class="todo-list">${this.parser.parseInline(token.tokens)}\n</div>`;
    }
  };

  const todo = {
    name: 'todo',
    level: 'inline',
    start(src) { return src.match(/\[\]/)?.index; },
    tokenizer(src, tokens) {
      const rule = /^\[(x{0,1})\](.*)(?:\n|$)/;
      const match = rule.exec(src);
      if (match) {
        return {
          type: 'todo',
          raw: match[0],
          checked: match[1] === 'x',
          task: this.lexer.inlineTokens(match[2].trim())
        };
      }
    },
    renderer(token) {
      const id = nanoid();

      return `
        <div class="todo">
          <input type="checkbox" class="todo-checkbox" id="todo-checkbox-${id}" ${token.checked ? 'checked' : ''} onclick="return false;">
          <label for="todo-checkbox-${id}" class="todo-content">${this.parser.parseInline(token.task)}</label>
        </div>`;
    },
    // childTokens: ['dt', 'dd'],
    walkTokens(token) {
      if (token.type === 'strong') {
        token.text += ' walked';
      }
    }
  };

  marked.use({ extensions: [todoList, todo] })

  inject('md', {
    parse(str){
      return marked(str);
    }
  })
}
