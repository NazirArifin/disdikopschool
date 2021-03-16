/* eslint-disable */
export default class FPSocket {
  private host = '192.168.1.16';
  private keyCom = '';
  private port = '';

  constructor(host?: string, keyCom?: string, port?: string) {
    if (host) {
      this.host = host;
    }
    if (keyCom) {
      this.keyCom = keyCom;
    }
    if (port) {
      this.port = port;
    }
  }

  public getClock(): Promise<any> {
    return new Promise((resolve, reject) => {
      this.request(`<GetDate><ArgComKey xsi:type="xsd:integer">${this.keyCom}</ArgComKey><Arg></Arg></GetDate>`).then(result => {
        console.log(result);
        resolve(result);
      }).catch(err => {
        console.log(err);
        reject(err);
      });
    });
  }

  public getUser(): Promise<any> {
    return new Promise((resolve, reject) => {
      this.request(`<GetAllUserInfo><ArgComKey xsi:type="xsd:integer">${this.keyCom}</ArgComKey></GetAllUserInfo>`).then(result => {
        resolve(result);
      }).catch(err => reject(err));
    });
  }

  public getLog(): Promise<any> {
    return new Promise((resolve, reject) => {
      this.request(`<GetAttLog><ArgComKey xsi:type="xsd:integer">${this.keyCom}</ArgComKey><Arg><PIN xsi:type="xsd:integer">All</PIN></Arg></GetAttLog>`).then(result => {
        resolve(result);
      }).catch(err => reject(err));
    });
  }
  
  public request(req: string): Promise<any> {
    return new Promise((resolve, reject) => {
      if (this.host.length == 0) {
        reject(`Host can't empty`); return;
      }
      if (this.keyCom.length == 0) {
        this.keyCom = '0';
      }
      if (this.port.length == 0) {
        this.port = '80';
      }

      const net = require('net');
      let output = '';
      
      let http_request = '';
      http_request += "POST /iWsService HTTP/1.1\r\n";
      http_request += "Content-Type: text/xml\r\n";
      http_request += "Content-Length: " + req.length + "\r\n";
      http_request += "\r\n";
      http_request += req + "\r\n";
      // req = "sn=66395016230198";
      // http_request += "POST /scanlog/new HTTP/1.1\r\n";
      // http_request += "cache-control: no-cache\r\n";
      // http_request += "Content-Type: application/x-www-form-urlencoded\r\n";
      // http_request += "Content-Length: " + req.length + "\r\n";
      // http_request += "\r\n";
      // http_request += "sn=66395016230198" + "\r\n";

      const client = net.createConnection(this.port, this.host, function() {
        console.log('connected to server');
        client.end(http_request);
      });
      client.on('error', function(err: any) {
        reject(err);
        client.end();
      });
      client.on('data', function(data: any) {
        console.log(data);
        output += data.toString();
        client.end();
      });
      client.on('end', function() {
        if (output.indexOf('HTTP/1.0 200 OK') == 0) {
          resolve(output.split("\r\n\r\n\r\n")[1]);
        } else {
          resolve(output);
        }
      });
    });
  }
}