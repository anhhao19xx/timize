import moment from 'moment';
import objectPath from 'object-path';

import md from './md';
import db from './db';
import createHttpPlugin from './http';
import createApiPlugin from './api';

const R_DATE = /^[0-9]{4}[0-1][0-9][0-3][0-9]$/;
const R_TIMERANGE = /^([0-2]*[0-9]:[0-5]*[0-9])-([0-2]*[0-9]:[0-5]*[0-9])/;
const R_COLOR = /^(red|green|blue|pink|purple|indigo|cyan|teal|lime|yellow|amber|orange|brown|grey)/;
const R_LOCAL_LINK = /^\#\/\?id\=(.*)$/;

function extract(content, r, resPath){
  let res;
  const rel = [];
  while (res = r.exec(content)){
    rel.push(res);
  }

  if (!resPath)
    return rel;

  return objectPath.get(rel, resPath);
}

function stripHtml(html)
{
   let tmp = document.createElement("DIV");
   tmp.innerHTML = html;
   return tmp.textContent || tmp.innerText || "";
}

export default ({ app }, inject) => {
  inject('md', md);
  inject('db', db);

  inject('utils', {
    async updatePieceContent(piece, content){
      // extract title
      const title = extract(content, /<h1>(.*?)<\/h1>/g, '0.1');

      // extract tasks
      const tasks = [];
      let index = 0;
      let rawTaskGroups = extract(content, /<ul data-checked="(.*?)">(.*?)<\/ul>/gm);
      for (let rawTaskGroup of rawTaskGroups){
        let rawTasks = extract(rawTaskGroup[2], /<li>(.*?)<\/li>/gm);
        for (let rawTask of rawTasks){       
          let task = {
            piece: piece.id,
            todo: rawTask[1],
            done: rawTaskGroup[1] === 'true',
            index: index++,
            createdAt: piece.createdAt.toString()
          }

          let rawTimeRange = extract(rawTask[1], /<span class="timerange" data-value="(.*?)">(.*?)<\/span>/g)[0];

          if (rawTimeRange){
            task.todo = task.todo.split(rawTimeRange[0]).join('');
            let timeRange = JSON.parse(stripHtml(rawTimeRange[1]));
            task.startAt = moment(timeRange.from).toDate().toString();
            task.endAt = moment(timeRange.to).toDate().toString();
            task.color = timeRange.color || 'grey';
          }

          task.todo = stripHtml(task.todo).trim();
          tasks.push(task);
        }
      }

      await db.removeWhere('tasks', { piece: piece.id });
      if (tasks.length)
        await db.createMany('tasks', tasks);

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