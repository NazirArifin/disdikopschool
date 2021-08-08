/* eslint-disable @typescript-eslint/no-var-requires */

interface ConfigType {
  host: string;
  port: string;
  user: string;
  password: string;
  database: string;
  multipleStatements: boolean;
  connectionLimit: number;
}

class Database {
  private static db: any = null;

  public static query(query: string, param?: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.db.getConnection(function(err: any, conn: any) {
        if (err) {
          if (conn) {
            conn.release(); 
          }
          reject(err);
        }
        if (param == undefined) param = [];
        if (conn) {
          conn.query(query, param, function(err: any, rows: any) {
            conn.release();
            if (err) reject(err);
            resolve(rows);
          });
        }
      });
    });
  }

  public static init(dbConfig: ConfigType) {
    if ( ! Database.db) {
      const mysql = require('mysql2');
      this.db = mysql.createPool(dbConfig);
    }
  }

  public static close(): void {
    if (this.db) this.db.end();
    this.db = null;
  }
}

class FbDb {
  private dbConfig: ConfigType;
  private static instance: FbDb|null = null;
  
  private constructor() {
    const dbSetting = localStorage.getItem('dbSetting');
    if (dbSetting) {
      this.dbConfig = JSON.parse(dbSetting);
    } else {
      this.dbConfig = {
        host: 'localhost',
        port: '3306',
        user: 'root',
        password: '',
        database: '',
        multipleStatements: true,
        connectionLimit: 3000
      }
      localStorage.setItem('dbSetting', JSON.stringify(this.dbConfig));
    }
    Database.init(this.dbConfig);
  }

  public static getInstance() {
    if ( ! this.instance) {
      this.instance = new FbDb();
    }
    return this.instance;
  }

  changeSetting(config: ConfigType) {
    if (JSON.stringify(config) != JSON.stringify(this.dbConfig)) {
      localStorage.removeItem('dbSetting');
      localStorage.setItem('dbSetting', JSON.stringify(config));
      this.dbConfig = config;
      
      Database.close();
      Database.init(this.dbConfig);
    }
  }

  quickCheckConnection(): Promise<any> {
    return new Promise((resolve, reject) => {
      try {
        Database.query(`SHOW VARIABLES LIKE "version"`).then(t => {
          resolve(t);
        });
      } catch(err) {
        reject(err);
      }
    });
  }

  checkConnection(config: ConfigType): Promise<any> {
    return new Promise((resolve, reject) => {
      try {
        Database.close();
        Database.init(config);
        Database.query(`SHOW VARIABLES LIKE "version"`).then(v => {
          const version = v[0].Value;
          Database.query(`SHOW TABLES`).then(t => {
            const tables = t.map((row: any) => {
              return row.Tables_in_fpdb;
            }).filter((row: any) => row == 'att_log' || row == 'pegawai');

            resolve({
              version: version,
              tabelAbsensi: tables.indexOf('att_log'),
              tablePegawai: tables.indexOf('pegawai')
            });
          }).catch(e => {
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
            reject('TIDAK ADA DATA ABSENSI DI DATABASE  UNTUK HARI UNTUK INI');
            return;
          }
          resolve(logs);
        }).catch(e => {
          reject('Query Scanlog gagal')          
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

export { ConfigType, FbDb }