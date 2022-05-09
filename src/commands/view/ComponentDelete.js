import { isArray } from 'underscore';
import { sendMessage } from '../../utils/WebSocket';
import CircularJSON from 'circular-json';

export default {
  run(ed, sender, opts = {}, isLocalChange = 1) {
    console.log('command/view/ComponentDelete.js => run start');
    const toSelect = [];
    let components = opts.component || ed.getSelectedAll();
    console.log('component: ' + component.constructor.name);
    opts.component = CircularJSON.parse(CircularJSON.stringify(components));
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
    console.log('command/view/ComponentDelete.js => run end');
    if (isLocalChange) {
      let op = {
        action: 'delete-component',
        opts: opts,
      };
      sendMessage(op);
    }

    return components;
  },
};

/*
  ComponentDelete.run
  params: components
*/
