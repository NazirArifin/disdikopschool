import Api from "./api";

export default class Session {
  private static api: Api;

  private static init() {
    if ( ! Session.api) {
      Session.api = new Api();
    }
  }

  public static login(user: any): Promise<any> {
    return new Promise((resolve, reject) => {
      Session.init();
      Session.api.postResource('/login', user).then(data => {
        const token = data.token;
        localStorage.setItem('token', token);
        Session.api.getResource('/saya').then(data => {
          resolve(data);
        }).catch(err => reject(err));
      }).catch(err => reject(err));
    });
  }

  public static logout() {
    localStorage.removeItem('token');
    localStorage.clear();
  }

  public static getMe(): Promise<any> {
    return new Promise((resolve, reject) => {
      Session.init();
      Session.api.getResource('/saya').then(data => {
        resolve(data);
      }).catch(err => reject(err));
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