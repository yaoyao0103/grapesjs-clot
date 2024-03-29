import Backbone from 'backbone';
import { isUndefined } from 'underscore';
import { myEditor } from '../..';
import {
  ClientState,
  ClientStateEnum,
  setState,
  ApplyingLocalOp,
  ApplyingBufferedLocalOp,
} from '../../utils/WebSocket';

export default Backbone.Model.extend({
  defaults: {
    type: 'text', // text, number, range, select
    label: '',
    name: '',
    min: '',
    max: '',
    unit: '',
    step: 1,
    value: '',
    target: '',
    default: '',
    placeholder: '',
    changeProp: 0,
    options: [],
  },

  initialize() {
    const target = this.get('target');
    const name = this.get('name');
    const changeProp = this.get('changeProp');
    !this.get('id') && this.set('id', name);

    if (target) {
      this.target = target;
      this.unset('target');
      const targetEvent = changeProp ? `change:${name}` : `change:attributes:${name}`;
      this.listenTo(target, targetEvent, this.targetUpdated);
    }
  },

  /**
   * Return all the propeties
   * @returns {Object}
   */
  props() {
    return this.attributes;
  },

  targetUpdated() {
    const value = this.getTargetValue();
    this.set({ value }, { fromTarget: 1 });
  },

  getValue() {
    return this.getTargetValue();
  },

  getTargetValue() {
    const name = this.get('name');
    const target = this.target;
    let value;

    if (this.get('changeProp')) {
      value = target.get(name);
    } else {
      value = target.getAttributes()[name];
    }

    return !isUndefined(value) ? value : '';
  },

  /*
  applyUpdateTrait(opts){  
    const name = opts.name
    if (isUndefined(opts.value)) return;
    let valueToSet = opts.value;

    if (opts.value === 'false') {
      valueToSet = false;
    } else if (opts.value === 'true') {
      valueToSet = true;
    }

    let target = myEditor.getModel().get('DomComponents').getById(opts.id);

    if (opts.changeProp) {
      target.set(name, valueToSet, opts.opts);
    } else {
      const attrs = { ...target.get('attributes') };
      attrs[name] = valueToSet;
      target.set('attributes', attrs, opts.opts);
    }
  },*/

  setTargetValue(value, opts = {}) {
    //console.log('trait_manager/model/Trait.js => setTargetValue start');
    const target = this.target;

    const name = this.get('name');
    if (isUndefined(value)) return;
    let valueToSet = value;

    if (value === 'false') {
      valueToSet = false;
    } else if (value === 'true') {
      valueToSet = true;
    }

    if (this.get('changeProp')) {
      target.set(name, valueToSet, opts);
    } else {
      const attrs = { ...target.get('attributes') };
      attrs[name] = valueToSet;
      target.set('attributes', attrs, opts);
    }
    //console.log('trait_manager/model/Trait.js => setTargetValue end');
  },

  setValueFromInput(value, final = 1, opts = {}) {
    const toSet = { value };
    this.set(toSet, { ...opts, avoidStore: 1 });

    // Have to trigger the change
    if (final) {
      this.set('value', '', opts);
      this.set(toSet, opts);
    }
  },

  /**
   * Get the initial value of the trait
   * @return {string}
   */
  getInitValue() {
    const target = this.target;
    const name = this.get('name');
    let value;

    if (target) {
      const attrs = target.get('attributes');
      value = this.get('changeProp') ? target.get(name) : attrs[name];
    }

    return value || this.get('value') || this.get('default');
  },
});
