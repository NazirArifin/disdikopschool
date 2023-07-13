import { SdkConfigType } from '../helpers/types';
import qs from 'qs';

class Sdk {
  private sdkConfig: SdkConfigType;
  private static instance: Sdk|null = null;
  
  private constructor() {
    const ifs = require('os').networkInterfaces();

    const result = Object.keys(ifs)
      .filter(x => x == 'Ethernet')
      .map(x => [x, ifs[x].filter((x: any) => x.family === 'IPv4')[0]])
      .filter(x => x[1])
      .map(x => x[1].address);
    
    const sdkSetting = localStorage.getItem('sdkSetting');
    if (sdkSetting) {
      this.sdkConfig = JSON.parse(sdkSetting);
    } else {
      this.sdkConfig = {
        instpath: "C:\\Program Files (x86)\\EasyLink SDK",
        ipmac: '000.000.000.000',
        portmac: '5005',
        snmac: '',
        passwordmac: '0',
        numbermac: '1',
        activationmac: '',
        iphost: result[0] || '127.0.0.1',
        porthost: '8019'
      }
      localStorage.setItem('sdkSetting', JSON.stringify(this.sdkConfig));
    }
    this.init();
  }

  private host = '';
  private init() {
    this.host = `http://${this.sdkConfig.iphost}:${this.sdkConfig.porthost}`;
  }

  public static getInstance() {
    if ( ! this.instance) {
      this.instance = new Sdk();
    }
    return this.instance;
  }

  public getHost(): string {
    return this.host;
  }

  changeSetting(config: SdkConfigType): Promise<any> {
    return new Promise((_resolve, reject) => {
      if (JSON.stringify(config) != JSON.stringify(this.sdkConfig)) {
        localStorage.removeItem('sdkSetting');
        localStorage.setItem('sdkSetting', JSON.stringify(config));
        this.sdkConfig = config;
        this.init();

        // write to file
        const fs = require('fs');
        fs.writeFile(this.sdkConfig.instpath + '\\Device.ini', `[Mesin 01]
sn=${this.sdkConfig.snmac}
aktivasi=${this.sdkConfig.activationmac}
password=${this.sdkConfig.passwordmac}
number=${this.sdkConfig.numbermac}
ip_address=${this.sdkConfig.ipmac}
ethernet_port=${this.sdkConfig.portmac}
`, (err: any) => {
          if (err) {
            reject(err);
          }
        });
      } else {
        reject('Tidak ada perubahan');
      }
    });
  }

  quickCheckConnection(): Promise<any> {
    return new Promise((resolve, reject) => {
      this.query('/dev/info').then(data => {
        resolve(data);
      }).catch(err => reject(err));
    });
  }

  getPegawai(): Promise<any> {
    return new Promise((resolve, reject) => {
      this.query('/user/all/paging').then(data => {
        resolve(data);
      }).catch(err => reject(err));
    });
  }

  getScanLog(today: string): Promise<any> {
    return new Promise((resolve, reject) => {
      this.query('/scanlog/new').then(data => {
        resolve(data.Data.filter((v: any) => {
          return v.ScanDate.indexOf(today) != -1;
        }).map((v: any) => {
          return { scan_date: v.ScanDate, pin: v.PIN }
        }));
      }).catch(err => reject(err));
    });
  }

  private query(path: string): Promise<any> {
    return new Promise((resolve, reject) => {
      fetch(this.host + path, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: qs.stringify({ sn: this.sdkConfig.snmac })
      })
      .then(response => {
        if (response.ok) {
          return response.json();
        } else {
          reject('Gagal menghubungi mesin!');
        }
      })
      .then(data => {
        if (data.Result) {
          resolve(data);
        } else {
          console.log(data);
          reject('Result False. Tidak ada data!');
        }
      }).catch(err => reject(err));
    });
  }
}

export default Sdk;