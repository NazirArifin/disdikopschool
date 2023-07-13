import * as JsStore from 'jsstore';
import { FPType, SyncType, PegawaiType } from '../helpers/types';

export default class MyDb {
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

  insert(value: FPType|SyncType|PegawaiType, withInsertedId = false): Promise<any> {
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

  clear(): Promise<any> {
    return new Promise((resolve, _reject) => {
      this.conn?.clear(this.tableName).then(() => {
        resolve(true);
      });
    });
  }
}
