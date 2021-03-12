import axios, { AxiosRequestConfig } from 'axios'
import { ipcRenderer } from 'electron';
declare const $: any;

export default class Api {
  private apiUrl: string = process.env.VUE_APP_APIURL || '';
  
  /**
   * getter apiUrl
   *
   * @readonly
   * @type {string}
   * @memberof Api
   */
  public get url(): string {
    return this.apiUrl;
  }

  constructor() {
    axios.interceptors.request.use(config => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers['Authorization'] = 'Bearer ' + token;
      }
      return config;
    }, (err: any) => Promise.reject(err));
  }

  /**
   * GET resource
   *
   * @param {string} type
   * @param {*} [params=null]
   * @returns {Promise<any>}
   * @memberof Api
   */
  public getResource(type: string, params: any = null): Promise<any> {
    return new Promise((resolve, reject) => {
      axios.get(this.apiUrl + type, { params: params, paramsSerializer: function(params) {
        return $.param(params);
      } }).then(response => {
        resolve(response.data);
      }).catch(error => {
        reject(error.response);
      });
    });
  }

  /**
   * POST / PUT Resource
   *
   * @param {string} type
   * @param {*} data
   * @param {boolean} isNew
   * @param {*} [file]
   * @returns {Promise<any>}
   * @memberof Api
   */
  public postResource(type: string, data: any, isNew: boolean|string = true, file?: any): Promise<any> {
    return new Promise((resolve, reject) => {
      const options: AxiosRequestConfig = {
        params: {}
      };
      
      if (typeof(isNew) == 'boolean') {
        // jika put maka append url dengan  id jika ada
        if ( ! isNew && data.id) {
          type += `/${data.id}`;
        }
      }

      if (file && typeof(file) == 'object') {
        const fd = new FormData();
        for (const key in data) {
          // if (data.hasOwnProperty(key)) {
          if (Object.prototype.hasOwnProperty.call(data, key)) {
            fd.append(key, data[key]);
          }
        }
        // proses file
        // deteksi multiple jika tidak ada type
        if ( ! file.type) {
          for (const key in file) {
            if (Object.prototype.hasOwnProperty.call(file, key)) {
            // if (file.hasOwnProperty(key)) {
              const value: File|null = file[key];
              if (value) {
                let ext = value.type.split('/')[1];
                if (ext == 'jpeg') ext = 'jpg';
                fd.append(`file_${key}`, value);
              }
            }
          }
        } else {
          let ext = file.type.split('/')[1];
          if (ext == 'jpeg') ext = 'jpg';
          fd.append('file', file);
        }
        data = fd;
      } else {
        options.headers = { 'content-type': 'application/x-www-form-urlencoded' };
        data = $.param(data);
      }
      
      if (typeof(isNew) == 'string') {
        if (isNew.toLowerCase() == 'put') {
          axios.put(this.apiUrl + type, data, options).then(response => {
            resolve(response.data);
          }).catch(error => {
            reject(error.response);
          });
        }
      } else {
        if (isNew) {
          axios.post(this.apiUrl + type, data, options).then(response => {
            resolve(response.data);
          }).catch(error => {
            reject(error.response);
          });
        } else {
          axios.put(this.apiUrl + type, data, options).then(response => {
            resolve(response.data);
          }).catch(error => {
            reject(error.response);
          });
        }
      }
    });
  }
  
  /**
   * DELETE Resource
   *
   * @param {string} type
   * @returns {Promise<any>}
   * @memberof Api
   */
  public deleteResource(type: string): Promise<any> {
    return new Promise((resolve, reject) => {
      axios.delete(this.apiUrl + type).then(response => {
        resolve(response.status == 204);
      }).catch(err => {
        reject(err.response);
      });
    });
  }

  public download(url: string, args: any): Promise<any> {
    return new Promise((resolve, reject) => {
      ipcRenderer.send('download-item', { url: this.apiUrl + url + '?' + $.param(args) });
      ipcRenderer.on('download-success', (event, arg) => {
        resolve(args);
      });
    });
  }
}