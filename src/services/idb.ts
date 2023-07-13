const JsStoreWorker = require('jsstore/dist/jsstore.worker.commonjs2.js');
(window as any).JsStoreWorker = JsStoreWorker;
import * as JsStore from 'jsstore'
import { ITable, DATA_TYPE } from 'jsstore'

export const conn = new JsStore.Connection();

const getDatabase = () => {
  // const tblFp: ITable = {
  //   name: 'FingerPrint',
  //   columns: {
  //     id: {
  //       primaryKey: true,
  //       autoIncrement: true
  //     },
  //     ip: {
  //       notNull: true,
  //       dataType: DATA_TYPE.String,
  //       default: ''
  //     },
  //     keyCom: {
  //       notNull: true,
  //       dataType: DATA_TYPE.String,
  //       default: '0'
  //     },
  //     port: {
  //       notNull: true,
  //       dataType: DATA_TYPE.String,
  //       default: '80'
  //     },
  //     active: {
  //       notNull: true,
  //       dataType: DATA_TYPE.Boolean,
  //       default: false
  //     }
  //   },
  //   version: 1
  // }
  const tblPegawai: ITable = {
    name: 'Pegawai',
    columns: {
      id: {
        primaryKey: true,
        autoIncrement: true
      },
      pin: {
        notNull: true,
        dataType: DATA_TYPE.String,
      },
      nip: {
        notNull: true,
        dataType: DATA_TYPE.String,
      },
      nama: {
        notNull: true,
        dataType: DATA_TYPE.String
      },
      namaSingkat: {
        notNull: true,
        dataType: DATA_TYPE.String
      },
      active: {
        notNull: true,
        dataType: DATA_TYPE.Boolean,
        default: true
      }
    }
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
    }
  }
  const dataBase = {
    name: 'dbApp',
    tables: [tblPegawai, tblSinkron]
  };
  return dataBase;
};

export const initJsStore = async () => {
  return await conn.initDb(getDatabase());
}
