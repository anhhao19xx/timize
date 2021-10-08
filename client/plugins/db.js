import Dexie from 'dexie';
import IDBExportImport from 'indexeddb-export-import';

const extractControls = (doc, controlNames) => {
  const controls = {};
  const newDoc = {};

  for (let key in doc){
    if (controlNames.indexOf(key) !== -1){
      controls[key] = doc[key];
      continue;
    }

    newDoc[key] = doc[key];
  }

  return {
    controls, 
    doc: newDoc
  };
}

const db = new Dexie("TimizeDB");
db.version(4).stores({
  pieces: '++id,title,content,createdAt,updatedAt',
  tasks: '++id,todo,startAt,endAt,createdAt,piece,index,done,color'
});

export default {
  async importDB(jsonString){
    const idbDatabase = db.backendDB();

    return await new Promise((resolve, reject) => {
      IDBExportImport.clearDatabase(idbDatabase, function(err) {
        if (err){
          reject(err);
          return;
        }

        IDBExportImport.importFromJsonString(idbDatabase, jsonString, function(err) {
          if (err) {
            reject(err);
            return;
          }

          resolve();
        });
      });
    });
  },

  async exportDB(){
    const idbDatabase = db.backendDB();

    return await new Promise((resolve, reject) => {
      IDBExportImport.exportToJsonString(idbDatabase, function(err, jsonString) {
        if (err) {
          reject(err);
        }
      
        resolve(jsonString);
      });
    });
  },

  async get(storeName, id){
    return await db[storeName].get(id);
  },

  async list(storeName, query = {}){
    const { doc, controls } = extractControls(query, ['$limit', '$skip', '$sort'])

    let queryBuilder = db[storeName];

    if (Object.keys(doc).length > 0){
      queryBuilder = queryBuilder.filter(originDoc => {
        for (let key in doc)
          if (originDoc[key] !== doc[key])
            return false;

        return true;
      });
    }

    if (controls.$sort){
      const key = Object.keys(controls.$sort)[0];
      queryBuilder = queryBuilder.orderBy(key);

      if (controls.$sort[key] === -1){
        queryBuilder = queryBuilder.reverse();
      }
    }
  
    if (controls.$skip){
      queryBuilder = queryBuilder.offset(controls.$skip);
    }

    if (controls.$limit !== -1){
      queryBuilder = queryBuilder.limit(controls.$limit);
    }

    return await queryBuilder.toArray()
  },

  async create(storeName, doc){
    return await db[storeName].add(doc);
  },

  async createMany(storeName, docs){
    return await db[storeName].bulkAdd(docs);
  },

  async update(storeName, id, doc){
    return await db[storeName].update(id, doc);
  },

  async remove(storeName, id){
    return await db[storeName].delete(id);
  },

  async removeWhere(storeName, query){
    return await db[storeName].where(query).delete();
  }
}