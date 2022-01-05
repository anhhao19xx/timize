import moment from 'moment';
import objectPath from 'object-path';

import md from './md';
import db from './db';
import createHttpPlugin from './http';
import createApiPlugin from './api';
import { COLORS } from './constants';
import { makeTimeRangeTag } from './quill';

const R_DATE = /^[0-9]{4}[0-1][0-9][0-3][0-9]$/;
const R_TIMERANGE = /^([0-2]*[0-9]:[0-5]*[0-9])-([0-2]*[0-9]:[0-5]*[0-9])/;
const R_COLOR = /^(red|green|blue|pink|purple|indigo|cyan|teal|lime|yellow|amber|orange|brown|grey)/;
const R_LOCAL_LINK = /^\#\/\?id\=(.*)$/;

const replaceContent = 
  (content, index, length, dst) => 
    content.slice(0, index) + dst + content.slice(index + length);

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

function forEachTask(content, fn){
  let index = 0;
  let rawTaskGroups = extract(content, /<ul data-checked="(.*?)">(.*?)<\/ul>/gm);
  let offsetIndex = 0;

  for (let rawTaskGroup of rawTaskGroups){
    let rawTasks = extract(rawTaskGroup[2], /<li>(.*?)<\/li>/gm);
    let newGroupContent = '';

    for (let rawTask of rawTasks){       
      let task = {
        raw: rawTask[1],
        todo: rawTask[1],
        done: rawTaskGroup[1] === 'true',
        index: index++
      }

      let timeRangeRegex = /<span class="timerange" data-value="(.*?)">(.*?)<\/span>/g;
      let rawTimeRange = extract(task.raw, timeRangeRegex)[0];

      if (rawTimeRange){
        task.todo = stripHtml(task.raw.replace(timeRangeRegex, '')).trim();
        let timeRange = JSON.parse(stripHtml(rawTimeRange[1]));
        task.startAt = moment(timeRange.from).toDate().toString();
        task.endAt = moment(timeRange.to).toDate().toString();
        task.color = timeRange.color || 'grey';
      }

      task = fn(task) || task;

      if (task.startAt){
        let from = moment(task.startAt);
        let to = moment(task.endAt);

        let dataValue = {
          from: from.format('YYYY/MM/DD HH:mm:ss'),
          to: to.format('YYYY/MM/DD HH:mm:ss'),
          color: task.color
        };

        let node = document.createElement('span');
        node.className = 'timerange';

        makeTimeRangeTag(node, JSON.stringify(dataValue));

        task.raw = `${node.outerHTML} ${task.todo}`;
      } else {
        task.raw = task.todo;
      }

      newGroupContent += `<ul data-checked="${task.done}"><li>${task.raw}</li></ul>`;
    }

    content = replaceContent(content, rawTaskGroup.index + offsetIndex, rawTaskGroup[0].length, newGroupContent);
    offsetIndex += newGroupContent.length - rawTaskGroup[0].length;
  }

  return content;
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
      content = forEachTask(content, task => {
        task.piece = piece.id,
        task.createdAt = piece.createdAt.toString();
        tasks.push(task);
      });

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

    async updateTask(task){      
      const piece = await db.get('pieces', task.piece);

      const content = forEachTask(piece.content, oldTask => {
        if (oldTask.index !== task.index)
          return oldTask;
        return task;
      });

      await this.updatePieceContent(piece, content);
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