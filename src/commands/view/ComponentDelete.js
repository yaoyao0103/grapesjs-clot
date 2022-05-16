import { isArray } from 'underscore';
import {
  ClientState,
  ClientStateEnum,
  setState,
  ApplyingLocalOp,
  ApplyingBufferedLocalOp,
} from '../../utils/WebSocket';
import { myEditor } from '../..';

export default {
  run(ed, sender, opts = {}, isLocalChange = 1) {
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
      opts.component = components;
      let op = {
        action: 'delete-component',
        opts: opts,
      };
      if (ClientState == ClientStateEnum.Synced) {
        // set state to ApplyingLocalOp
        setState(ClientStateEnum.ApplyingLocalOp);
        // increase localTS and set localOp
        ApplyingLocalOp(op);
      } else if (ClientState == ClientStateEnum.AwaitingACK || ClientState == ClientStateEnum.AwaitingWithBuffer) {
        // set state to ApplyingBufferedLocalOp
        setState(ClientStateEnum.ApplyingBufferedLocalOp);
        // push the op to buffer
        ApplyingBufferedLocalOp(op);
      }
    }

    return components;
  },
};
