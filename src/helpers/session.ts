import Api from "./api";

export default class Session {
  private static api: Api;

  private static init() {
    if ( ! Session.api) {
      Session.api = new Api();
    }
  }

  private static fetchSaya(token: string): Promise<any> {
    return new Promise((resolve, reject) => {
      const url = Session.api.url + '/saya';
      fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      }).then(async response => {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.indexOf('application/json') !== -1) {
          const data = await response.json();
          resolve(data);
        } else {
          const text = await response.text();
          reject(text);
        }
      });
    });
  }

  public static login(user: any): Promise<any> {
    return new Promise((resolve, reject) => {
      Session.init();

      fetch(Session.api.url + '/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: Session.api.bodyParam(user)
      }).then(resp => {
        if ( ! resp.ok) {
          throw new Error('USERNAME DAN ATAU PASSWORD INVALID');
        }
        return resp.json();   
      }).then(data => {
        const token = data.token;
        localStorage.setItem('token', token);
        this.fetchSaya(token).then(data => {
          
          resolve(data);
        }).catch(text => {
          reject(text);
        });
      }).catch(err => {
        reject(err);
      });
    });
  }

  public static logout() {
    localStorage.removeItem('token');
  }

  // kita coba 3 kali
  public static getMe(): Promise<any> {
    return new Promise((resolve, reject) => {
      Session.init();
      const token = localStorage.getItem('token') || '';
      this.fetchSaya(token).then(data => {
        resolve(data);
      }).catch(text => {
        // remove token
        localStorage.removeItem('token');
        reject(text);
      });
    });
  }

  public static getToken() {
    let token: string|undefined = '';
    if (localStorage.getItem('token')) {
      token = localStorage.getItem('token') || undefined;
    }
    return token;
  }
}