import { isArray } from 'underscore';
import { myEditor } from '..';

// be called when applying remote op
export const applyDeleteComponent = (ed, opts) => {
  const toSelect = [];
  let components = opts.component;
  components = isArray(components) ? [...components] : [components];
  // It's important to deselect components first otherwise,
  // with undo, the component will be set with the wrong `collection`
  ed.select(null);
  let domc = ed.getModel().get('DomComponents');
  components.forEach(component => {
    // convert component model to a component object
    if (opts.component) component = domc.getById(component.attributes.id);
    if (!component || !component.get('removable')) {
      return ed.getModel().logWarning('The element is not removable', {
        component,
      });
    }
    component.remove();
    component.collection && toSelect.push(component);
  });

  toSelect.length && ed.select(toSelect);
  return components;
};

export const applyUpdateTrait = opts => {
  let target = myEditor.getModel().get('DomComponents').getById(opts.id);
  let model = target.getTraits()[opts.traitIndex];
  model.set('value', opts.value);

  const classes = model.get('options').map(opt => opt.value);
  for (let i = 0; i < classes.length; i++) {
    if (classes[i].length > 0) {
      const classes_i_a = classes[i].split(' ');
      for (let j = 0; j < classes_i_a.length; j++) {
        if (classes_i_a[j].length > 0) {
          target.removeClass(classes_i_a[j]);
        }
      }
    }
  }
  const value = model.get('value');
  const elAttributes = target.attributes.attributes;
  delete elAttributes[''];
  if (value.length > 0 && value !== 'text-black') {
    const value_a = value.split(' ');
    for (let i = 0; i < value_a.length; i++) {
      target.addClass(value_a[i]);
    }
  }
  target.em.trigger('component:toggled');
};

export const applyUpdateContent = opts => {
  const model = myEditor.getModel().get('DomComponents').getById(opts.id);
  //console.log("opts: " + CircularJSON.stringify(opts));
  if (!opts.rteEnabled && !opts.opts.force) return;
  const content = opts.content;
  const comps = model.components();
  const contentOpt = { fromDisable: 1, ...opts.opts };
  model.set('content', '', contentOpt);

  // If there is a custom RTE the content is just baked staticly
  // inside 'content'
  if (opts.rteCustomRte) {
    comps.length && comps.reset(null, opts.opts);
    model.set('content', content, contentOpt);
  } else {
    comps.resetFromString(content, opts.opts);
  }
};

export const applySetSelected = opts => {
  let model = myEditor.getModel().get('DomComponents').getById(opts.id);
  model.set('status', 'selected');
};
