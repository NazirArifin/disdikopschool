import * as JsStore from 'jsstore';

export interface FPType {
  id?: number;
  ip: string;
  keyCom: string;
  active: boolean;
}

export interface SyncType {
  id?: number;
  date: string;
  count: number;
}

export class MyDb {
  private tableName = 'FingerPrint';
  private conn: JsStore.Connection|null = null;

  constructor(initJsStore: any, conn: JsStore.Connection, tableName: string) {
    initJsStore();
    this.conn = conn;
    this.tableName = tableName;
  }

  getAll(limit = 0): Promise<any> {
    return new Promise((resolve, reject) => {
      const q = { from: this.tableName };
      if (limit > 0) {
        Object.assign(q, { limit: limit });
      }
      this.conn?.select(q).then(result => {
        resolve(result);
      }).catch(err => reject(err));
    });
  }

  insert(value: FPType|SyncType, withInsertedId = false): Promise<any> {
    return new Promise((resolve, reject) => {
      this.conn?.insert({
        into: this.tableName,
        values: [value],
        return: withInsertedId
      }).then((record: any) => {
        if (withInsertedId) {
          resolve(record.id); return;
        }
        resolve(true);
      }).catch(err => reject(err));
    });
  }

  update(setValue: any, whereCond: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.conn?.update({
        in: this.tableName,
        set: setValue,
        where: whereCond
      }).then(() => {
        resolve(true);
      }).catch(err => reject(err));
    });
  }

  delete(whereCond: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.conn?.remove({
        from: this.tableName,
        where: whereCond 
      }).then(() => {
        resolve(true);
      }).catch(err => reject(err));
    });
  }
}
