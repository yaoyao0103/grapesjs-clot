import { isArray } from 'underscore';

export default {
  run(ed, sender, opts = {}) {
    console.log('command/view/ComponentDelete.js => start');
    const toSelect = [];
    let components = opts.component || ed.getSelectedAll();
    components = isArray(components) ? [...components] : [components];

    // It's important to deselect components first otherwise,
    // with undo, the component will be set with the wrong `collection`
    ed.select(null);
    console.log('command/view/ComponentDelete.js => ------');
    components.forEach(component => {
      if (!component || !component.get('removable')) {
        return this.em.logWarning('The element is not removable', {
          component,
        });
      }
      component.remove();
      component.collection && toSelect.push(component);
    });

    toSelect.length && ed.select(toSelect);
    console.log('command/view/ComponentDelete.js => end');
    return components;
  },
};

/*
  ComponentDelete.run
  params: components
*/
