import { isElement, isFunction } from 'underscore';
import $ from 'utils/cash-dom';
import Editor from './editor';
import polyfills from 'utils/polyfills';
import { getGlobal } from 'utils/mixins';
import PluginManager from './plugin_manager';
import { stompClient, connectWebSocket } from 'utils/WebSocket';
import CircularJSON from 'circular-json';
import { isConnected } from './utils/WebSocket';

polyfills();

export var myEditor = null;
export var myCurrentFrame = null;
const plugins = new PluginManager();
const editors = [];
const defaultConfig = {
  // If true renders editor on init
  autorender: 1,

  // Array of plugins to init
  plugins: [],

  // Custom options for plugins
  pluginsOpts: {},
};

export default {
  $,

  editors,

  plugins,

  // Will be replaced on build
  version: __GJS_VERSION__,

  /**
   * Initialize the editor with passed options
   * @param {Object} config Configuration object
   * @param {string|HTMLElement} config.container Selector which indicates where render the editor
   * @param {Boolean} [config.autorender=true] If true, auto-render the content
   * @param {Array} [config.plugins=[]] Array of plugins to execute on start
   * @param {Object} [config.pluginsOpts={}] Custom options for plugins
   * @param {Boolean} [config.headless=false] Init headless editor
   * @return {Editor} Editor instance
   * @example
   * var editor = grapesjs.init({
   *   container: '#myeditor',
   *   components: '<article class="hello">Hello world</article>',
   *   style: '.hello{color: red}',
   * })
   */
  init(config = {}) {
    //console.log('index.js/init()--start');
    console.log('isConnected: ', isConnected);
    if (!isConnected && config.isCollab && config.noteId && config.email && config.username) {
      console.log('is going to connect!!');
      connectWebSocket(config.noteId, config.email, config.username, config.setQueue);
    }
    const { headless } = config;
    const els = config.container;
    if (!els && !headless) throw new Error("'container' is required");
    config = { ...defaultConfig, ...config, grapesjs: this };
    config.el = !headless && (isElement(els) ? els : document.querySelector(els));
    const editor = new Editor(config, { $ }).init();
    const em = editor.getModel();

    // Load plugins
    config.plugins.forEach(pluginId => {
      let plugin = isFunction(pluginId) ? pluginId : plugins.get(pluginId);
      const plgOptions = config.pluginsOpts[pluginId] || {};

      // Try to search in global context
      if (!plugin) {
        const wplg = getGlobal()[pluginId];
        plugin = wplg?.default || wplg;
      }

      if (plugin) {
        plugin(editor, plgOptions);
      } else if (isFunction(pluginId)) {
        pluginId(editor, plgOptions);
      } else {
        em.logWarning(`Plugin ${pluginId} not found`, {
          context: 'plugins',
          plugin: pluginId,
        });
      }
    });

    // Execute `onLoad` on modules once all plugins are initialized.
    // A plugin might have extended/added some custom type so this
    // is a good point to load stuff like components, css rules, etc.
    em.loadOnStart();
    config.autorender && !headless && editor.render();
    editors.push(editor);
    //let cmp =editor.Components;
    let wrapper = editor.getWrapper();
    wrapper.set('attributes', { id: 'Hello!' });
    myEditor = editor;
    myCurrentFrame = myEditor.getModel().getCurrentFrame();
    return editor;
  },
};
