import Backbone from 'backbone';
import fetch from 'utils/fetch';
import { isUndefined, isFunction } from 'underscore';
import axios from 'axios';
import Cookie from '../../utils/Cookie';

export default Backbone.Model.extend({
  fetch,

  defaults: {
    urlStore: '',
    urlLoad: '',
    params: {},
    beforeSend() {},
    onComplete() {},
    contentTypeJson: false,
    credentials: 'include',
    fetchOptions: '',
  },

  /**
   * Triggered before the request is started
   * @private
   */
  onStart() {
    const em = this.get('em');
    const before = this.get('beforeSend');
    before && before();
  },

  /**
   * Triggered on request error
   * @param  {Object} err Error
   * @param  {Function} [clbErr] Error callback
   * @private
   */
  onError(err, clbErr) {
    if (clbErr) {
      clbErr(err);
    } else {
      const em = this.get('em');
      console.error(err);
      em && em.trigger('storage:error', err);
    }
  },

  /**
   * Triggered on request response
   * @param  {string} text Response text
   * @private
   */
  onResponse(text, clb) {
    const em = this.get('em');
    const complete = this.get('onComplete');
    const typeJson = this.get('contentTypeJson');
    const parsable = text && typeof text === 'string';
    const res = typeJson && parsable ? JSON.parse(text) : text;
    complete && complete(res);
    clb && clb(res);
    em && em.trigger('storage:response', res);
  },

  store(data, clb, clbErr) {
    const body = {};

    for (let key in data) {
      body[key] = data[key];
    }

    this.request(this.get('urlStore'), { body }, clb, clbErr);
  },

  storeVersion(data, version, clb, clbErr) {
    const body = {};
    for (let key in data) {
      body[key] = data[key];
    }

    this.request(this.get('urlStore'), { body, version }, clb, clbErr);
  },

  load(keys, clb, clbErr) {
    //console.log("RemoteStorage => load");
    this.request(this.get('urlLoad'), { method: 'get' }, clb, clbErr);
  },

  /**
   * Execute remote request
   * @param  {string} url Url
   * @param  {Object} [opts={}] Options
   * @param  {Function} [clb=null] Callback
   * @param  {Function} [clbErr=null] Error callback
   * @private
   */
  request(url, opts = {}, clb = null, clbErr = null) {
    //http://localhost:8080/pages/${pageId}/content
    /*if (url.substring(28).split('/')[0] == '6262b61b3beec065d67999d0') {
      console.log('6262b61b3beec065d67999d0');
      const noteTextJson = require('./noteTestJson.json');
      const content = noteTextJson.version[0].content;
      const text = JSON.stringify(content);
      this.onResponse(text, clb);
      return;
    } else if (url.substring(28).split('/')[0] == '6262b61b3beec065d67999d1') {
      console.log('6262b61b3beec065d67999d1');
      const noteTextJson = require('./noteTestJson.json');
      const content = noteTextJson.version[1].content;
      const text = JSON.stringify(content);
      this.onResponse(text, clb);
      return;
    } else if (url.substring(28).split('/')[0] == '6262b61b3beec065d67999d2') {
      console.log('6262b61b3beec065d67999d2');
      const noteTextJson = require('./noteTestJson.json');
      const content = noteTextJson.version[2].content;
      const text = JSON.stringify(content);
      this.onResponse(text, clb);
      return;
    } else if (url.substring(28).split('/')[0] == '6262b61b3beec065d67999d3') {
      console.log('6262b61b3beec065d67999d3');
      const noteTextJson = require('./noteTestJson.json');
      const content = noteTextJson.version[3].content;
      const text = JSON.stringify(content);
      this.onResponse(text, clb);
      return;
    }*/

    /*axios.get(url)
      .then(res => {
          const content = res.content[0]
          const text = JSON.stringify(content);
          this.onResponse(text, clb);
          return;
      })
      .error(err => {
          console.log(err)
      })*/
    const bodyObj = opts.body || {};
    //console.log("bodyObj",bodyObj)
    const method = opts.method || 'put';
    //console.log("method",method)
    const versionNum = opts.version ? opts.version.toString() : '0';
    const cookieParser = new Cookie(document.cookie);
    console.log('token', cookieParser.getCookieByName('token'));

    //console.log("versionNum", versionNum)
    this.onStart();
    if (method == 'get') {
      this.fetch(url, {
        method: method,
        headers: {
          Authorization: 'Bearer ' + cookieParser.getCookieByName('token'),
        },
      })
        .then(res => (((res.status / 200) | 0) == 1 ? res.text() : res.text().then(text => Promise.reject(text))))
        .then(version => {
          const temp = JSON.parse(version);
          const content = temp.res.content[0];
          const text = JSON.stringify(content);
          this.onResponse(text, clb);
        })
        .catch(err => {
          console.log('error!!!!', err);
        });
    } else if (method == 'put') {
      axios
        .get(url + `/${versionNum}`, {
          headers: {
            Authorization: 'Bearer ' + cookieParser.getCookieByName('token'),
          },
        })
        .then(res => {
          //console.log(version)
          const version = res.data.res;
          version.content = [bodyObj];
          //console.log("version",version)
          axios
            .put(url + `/${versionNum}`, version, {
              headers: {
                Authorization: 'Bearer ' + cookieParser.getCookieByName('token'),
              },
            })
            .then(res => {
              console.log(res);
            })
            .catch(err => {
              console.log('error!!!!', err);
            });
        })
        .catch(err => {
          console.log('error!!!!', err);
        });
    }
    /*
    const typeJson = this.get('contentTypeJson');
    const headers = this.get('headers') || {};
    const params = this.get('params');
    const reqHead = 'X-Requested-With';
    const typeHead = 'Content-Type';
    const bodyObj = opts.body || {};
    let fetchOptions;
    let body;

    for (let param in params) {
      bodyObj[param] = params[param];
    }

    if (isUndefined(headers[reqHead])) {
      headers[reqHead] = 'XMLHttpRequest';
    }

    // With `fetch`, have to send FormData without any 'Content-Type'
    // https://stackoverflow.com/questions/39280438/fetch-missing-boundary-in-multipart-form-data-post

    if (isUndefined(headers[typeHead]) && typeJson) {
      headers[typeHead] = 'application/json; charset=utf-8';
    }

    if (typeJson) {
      body = JSON.stringify(bodyObj);
    } else {
      body = new FormData();

      for (let bodyKey in bodyObj) {
        body.append(bodyKey, bodyObj[bodyKey]);
      }
    }
    fetchOptions = {
      method: opts.method || 'post',
      credentials: this.get('credentials'),
      headers,
    };

    // Body should only be included on POST method
    if (fetchOptions.method === 'post') {
      fetchOptions.body = body;
    }

    const fetchOpts = this.get('fetchOptions') || {};
    const addOpts = isFunction(fetchOpts) ? fetchOpts(fetchOptions) : fetchOptions;

    this.onStart();
    this.fetch(url, {
      ...fetchOptions,
      ...(addOpts || {}),
    })
      .then(res => (((res.status / 200) | 0) == 1 ? res.text() : res.text().then(text => Promise.reject(text))))
      .then(text => {
        // rename 'text' to 'note'
        
        //const content = JSON.parse(note).version[0].content;
        //const text = JSON.stringify(content);
        
        this.onResponse(text, clb);
      })
      .catch(err => this.onError(err, clbErr));*/
  },
});
