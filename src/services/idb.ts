/* eslint-disable */
const JsStoreWorker = require('jsstore/dist/jsstore.worker.commonjs2.js');
(window as any).JsStoreWorker = JsStoreWorker;
// import * as JsStoreWorker from 'jsstore/dist/jsstore.worker.commonjs2'
// window['JsStoreWorker'] = JsStoreWorker
import * as JsStore from 'jsstore'
import { ITable, DATA_TYPE } from 'jsstore'

export const conn = new JsStore.Connection();

const getDatabase = () => {
  const tblFp: ITable = {
    name: 'FingerPrint',
    columns: {
      id: {
        primaryKey: true,
        autoIncrement: true
      },
      ip: {
        notNull: true,
        dataType: DATA_TYPE.String,
        default: ''
      },
      keyCom: {
        notNull: true,
        dataType: DATA_TYPE.String,
        default: '0'
      },
      active: {
        notNull: true,
        dataType: DATA_TYPE.Boolean,
        default: false
      }
    },
    version: 3
  }
  const tblSinkron: ITable = {
    name: 'Sinkron',
    columns: {
      id: {
        primaryKey: true,
        autoIncrement: true
      },
      date: {
        notNull: true,
        dataType: DATA_TYPE.String
      },
      count: {
        dataType: DATA_TYPE.Number
      }
    },
    version: 2
  }
  const dataBase = {
    name: 'dbApp',
    tables: [tblFp, tblSinkron]
  };
  return dataBase;
};

export const initJsStore = async () => {
  return await conn.initDb(getDatabase());
}
