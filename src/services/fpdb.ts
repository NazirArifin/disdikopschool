import { BrowserWindow } from 'electron';
import { PoolOptions } from 'mysql2';
import mysql2 from 'mysql2/promise';

class Database {
  private static pool: any = null;

  public static query(query: string, param?: any): Promise<any> {
    return new Promise(async (resolve, reject) => {
      if (param == undefined) param = [];
      try {
        const result = await Database.pool.query(query, param);
        // is array
        if (Array.isArray(result) && result.length === 2) {
          resolve(result[0]);
        }
        // is object
        resolve(result);
      } catch(err) {
        reject(err);
      }
    });
  }

  public static init(dbConfig: PoolOptions) {
    if ( ! Database.pool) {
      Database.pool = mysql2.createPool(dbConfig);
    }
  }

  public static close(): void {
    if (Database.pool) Database.pool.end();
    Database.pool = null;
  }
}

class FbDb {
  private static dbConfig: PoolOptions = {
    host: 'localhost',
    port: 3306,
    user: 'root',
    password: '',
    database: '',
    multipleStatements: true,
    connectionLimit: 10,
    // bigIntAsNumber: true
  };
  private static instance: FbDb|null = null;
  private static mainWindow: BrowserWindow|null = null;
  
  private constructor() {
    // do nothing
  }

  public static async getInstance(win: BrowserWindow|null = null): Promise<FbDb> {
    if (win) {
      this.mainWindow = win;
    }

    if ( ! this.instance) {
      // dapatkan config dari localStorage
      const dbSetting = await FbDb.mainWindow?.webContents.executeJavaScript(`localStorage.getItem('dbSetting')`);
      if (dbSetting) {
        this.dbConfig = JSON.parse(dbSetting);
      } else {
        FbDb.mainWindow?.webContents.executeJavaScript(`localStorage.setItem('dbSetting', '${JSON.stringify(this.dbConfig)}')`);
      }
      Database.init(this.dbConfig);
    }
    this.instance = new FbDb();
    return this.instance;
  }

  public changeSetting(config: PoolOptions) {
    if (JSON.stringify(config) != JSON.stringify(FbDb.dbConfig)) {
      FbDb.mainWindow?.webContents.executeJavaScript(`localStorage.removeItem('dbSetting')`);
      FbDb.mainWindow?.webContents.executeJavaScript(`localStorage.setItem('dbSetting', '${JSON.stringify(config)}')`);

      FbDb.dbConfig = config;
      
      Database.close();
      Database.init(FbDb.dbConfig);
    }
  }

  quickCheckConnection(): Promise<any> {
    return new Promise((resolve, reject) => {
      try {
        // console.log(Database)
        Database.query(`SHOW VARIABLES LIKE "version"`).then(t => {
          resolve(t);
        });
      } catch(err) {
        reject(err);
      }
    });
  }

  checkConnection(config: PoolOptions): Promise<any> {
    return new Promise((resolve, reject) => {
      try {
        Database.close();
        Database.init(config);
        Database.query(`SHOW VARIABLES LIKE "version"`).then(v => {
          
          const version = v[0].Value;
          Database.query(`SHOW TABLES`).then(t => {
            // only if array we map
            let tables: any = [];
            if (Array.isArray(t)) {
              tables = t.map((row: any) => {
                return row.Tables_in_fpdb;
              }).filter((row: any) => row == 'att_log' || row == 'pegawai');
            }

            resolve({
              version: version,
              tabelAbsensi: tables.indexOf('att_log'),
              tabelPegawai: tables.indexOf('pegawai')
            });
          }).catch(_e => {
            reject('KONEKSI GAGAL');
          });
        });
      } catch(err) {
        reject('KONEKSI GAGAL');
      }
    });
  }

  getScanLog(today: string): Promise<any> {
    return new Promise((resolve, reject) => {
      try {
        Database.query(`SELECT scan_date, pin FROM att_log WHERE DATE(scan_date) = ? ORDER BY scan_date`, [today]).then(logs => {
          if (logs.length == 0) {
            reject('TIDAK ADA DATA ABSENSI DI DATABASE HARI INI');
            return;
          }
          resolve(logs);
        }).catch(e => {
          reject(e)
        });
      } catch(err) {
        reject(err);
      }
    });
  }

  getPegawai(): Promise<any> {
    return new Promise((resolve, reject) => {
      try {
        Database.query(`SELECT pegawai_pin, pegawai_nip, pegawai_nama, pegawai_alias FROM pegawai`).then(rows => {
          if (rows.length == 0) {
            reject('Data pegawai kosong, pastikan sudah di unduh dari mesin fingerprint!');
          }
          resolve(rows);
        });
      } catch(err) {
        reject(err);
      }
    });
  }
}

export default FbDb;