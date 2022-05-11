import { isArray } from 'underscore';
import { sendMessage } from '../../utils/WebSocket';
import CircularJSON from 'circular-json';
import { myEditor } from '../..';

export default {
  run(ed, sender, opts = {}, isLocalChange = 1) {
    console.log('getWrapper: ' + JSON.stringify(myEditor.getWrapper()));
    console.log('command/view/ComponentDelete.js => run start');
    const toSelect = [];
    let components = opts.component || ed.getSelectedAll();
    components = isArray(components) ? [...components] : [components];

    // It's important to deselect components first otherwise,
    // with undo, the component will be set with the wrong `collection`
    ed.select(null);
    let domc = myEditor.getModel().get('DomComponents');
    components.forEach(component => {
      // convert component model to a component object
      if (opts.component) component = domc.getById(component.attributes.id);
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
      opts.component = CircularJSON.parse(CircularJSON.stringify(components));
      let op = {
        action: 'delete-component',
        opts: opts,
      };
      sendMessage(op, null);
    }

    return components;
  },
};

/*
  ComponentDelete.run
  params: components
*/
