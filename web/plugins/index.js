import moment from 'moment';

import md from './md';
import db from './db';
import createHttpPlugin from './http';
import createApiPlugin from './api';

const R_DATE = /^[0-9]{4}[0-1][0-9][0-3][0-9]$/;
const R_TIMERANGE = /^([0-2]*[0-9]:[0-5]*[0-9])-([0-2]*[0-9]:[0-5]*[0-9])/;
const R_COLOR = /^(red|green|blue|pink|purple|indigo|cyan|teal|lime|yellow|amber|orange|brown|grey)/;
const R_LOCAL_LINK = /^\#\/\?id\=(.*)$/;

function extract(tokens, types){
  let ls = [];
  for (let token of tokens){
    if (types.indexOf(token.type) !== -1 ){
      ls.push(token);
      continue;
    }

    if (token.tokens){
      ls = ls.concat(extract(token.tokens, types));
    }

    if (token.items){
      ls = ls.concat(extract(token.items, types));
    }
  }

  return ls;
}

export default ({ app }, inject) => {
  inject('md', md);
  inject('db', db);

  inject('utils', {
    async updatePieceContent(piece, content){
      const tokens = md.lexer(content);
      let currentDate = null;

      const rawLinks = extract(tokens, ['link'])
      const headings = extract(tokens, ['heading'])
      const hashesAndTaskItems = extract(tokens, ['hash', 'taskitem']);

      let title = '';
      const tasks = [];
      const links = [];

      // local links
      for (let link of rawLinks){
        let res = R_LOCAL_LINK.exec(link.href);

        if (!res)
          continue;

        links.push(parseInt(res[1]));
      }

      // heading
      for (let heading of headings)
        if (heading.depth === 1){
          title = heading.text;
          break;
        }

      // hash & taskitem
      let index = 0;
      for (let token of hashesAndTaskItems){
        if (token.type === 'hash' && R_DATE.test(token.text))
          currentDate = token.text;

        if (token.type === 'taskitem'){
          let todo = md.marked.Parser.parseInline(token.tokens);
          let startAt, endAt, color;

          if (token.meta){
            let metaList = token.meta.split('|').filter(i => i);

            for (let meta of metaList){
              // time range meta
              let metaRel = R_TIMERANGE.exec(meta);
              if (metaRel){
                startAt = metaRel[1];
                endAt = metaRel[2];
              }

              // color
              metaRel = R_COLOR.exec(meta);
              if (metaRel){
                color = metaRel[1];
              }
            }
          }

          let task = {
            piece: piece.id,
            todo,
            done: token.checked,
            index: index++,
            createdAt: piece.createdAt.toString()
          }

          if (currentDate){
            if (startAt){
              task.startAt = moment(`${currentDate} ${startAt}:00`, 'YYYYMMDD HH:mm:ss').toDate().toString();
            } else {
              task.startAt = moment(`${currentDate} 00:00:00`, 'YYYYMMDD HH:mm:ss').toDate().toString();
            }

            if (endAt){
              task.endAt = moment(`${currentDate} ${endAt}:00`, 'YYYYMMDD HH:mm:ss').toDate().toString();
            }
          }

          if (color){
            task.color = color;
          }

          tasks.push(task);
        } 
      }

      await db.removeWhere('tasks', { piece: piece.id });

      if (tasks.length)
        await db.createMany('tasks', tasks);

      await db.update('pieces', piece.id, { 
        title: title || piece.title, 
        content: content,
        updatedAt: (new Date()).toString(),
        links
      });

      return true;
    },

    isEquals(val1, val2){
      return JSON.stringify(val1) === JSON.stringify(val2);
    },

    formatCurrency(amount, lang='vi-VN', currency='vnd'){
      const formatter = new Intl.NumberFormat(lang, {
        style: 'currency',
        currency,
        maximumFractionDigits: 0,
      });
      
      return formatter.format(amount);
    }
  });

  const http = createHttpPlugin(app);
  const api = createApiPlugin(app, http);

  inject('http', http);
  inject('api', api);
}