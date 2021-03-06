import Backbone from 'backbone';
import { View } from 'common';
import { appendStyles } from 'utils/mixins';

const $ = Backbone.$;

export default class EditorView extends View {
  initialize() {
    const { model } = this;
    model.view = this;
    this.conf = model.config;
    this.pn = model.get('Panels');
    this.cv = model.get('Canvas');
    model.once('change:ready', () => {
      this.pn.active();
      this.pn.disableButtons();
      setTimeout(() => {
        model.trigger('load', model.get('Editor'));
        model.set('changesCount', 0);
      });
    });
  }

  render() {
    const { $el, conf, model } = this;
    const pfx = conf.stylePrefix;
    const contEl = $(conf.el || `body ${conf.container}`);
    appendStyles(conf.cssIcons, { unique: 1, prepand: 1 });
    $el.empty();

    if (conf.width) contEl.css('width', conf.width);
    if (conf.height) contEl.css('height', conf.height);

    $el.append(this.cv.render());
    $el.append(this.pn.render());

    // Load shallow editor
    const shallow = model.get('shallow');
    const shallowCanvasEl = shallow.get('Canvas').render();
    shallowCanvasEl.style.display = 'none';
    $el.append(shallowCanvasEl);

    $el.attr('class', `${pfx}editor ${pfx}one-bg ${pfx}two-color`);
    contEl.addClass(`${pfx}editor-cont`).empty().append($el);

    return this;
  }
}
