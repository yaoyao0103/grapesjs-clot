import { isArray } from 'underscore';
import {
  ClientState,
  ClientStateEnum,
  setState,
  ApplyingLocalOp,
  ApplyingBufferedLocalOp,
} from '../../utils/WebSocket';

export default {
  run(ed, sender, opts = {}) {
    //console.log('command/view/ComponentDelete.js => run start');
    const toSelect = [];
    let components = opts.component || ed.getSelectedAll();
    components = isArray(components) ? [...components] : [components];

    // It's important to deselect components first otherwise,
    // with undo, the component will be set with the wrong `collection`
    ed.select(null);
    components.forEach(component => {
      let id = component.getId();
      let index = component.collection.indexOf(component);
      let parentId = component.parent().getId();

      if (!component || !component.get('removable')) {
        return this.em.logWarning('The element is not removable', {
          component,
        });
      }
      component.remove();
      component.collection && toSelect.push(component);
      if (id) {
        let opOpts = {
          id: id,
          index: index,
          parentId: parentId,
        };
        let op = {
          action: 'delete-component',
          opts: opOpts,
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
    });

    toSelect.length && ed.select(toSelect);
    //console.log('command/view/ComponentDelete.js => run end');
    return components;
  },
};
