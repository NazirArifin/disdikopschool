/* eslint-disable */
export interface ConfigType {
  host: string;
  port: string;
  user: string;
  password: string;
  database: string;
  multipleStatements: boolean;
  connectionLimit: number;
}

export class Database {
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
      // const mysql = require('mysql');
      this.db = mysql.createPool(dbConfig);
    }
  }

  public static close(): void {
    if (this.db) this.db.end();
    this.db = null;
  }
}
