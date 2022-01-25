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
      let title = '';

      await db.update('pieces', piece.id, { 
        title: title || piece.title, 
        content: content,
        updatedAt: (new Date()).toString()
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