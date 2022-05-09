import { isArray } from 'underscore';
import {
  ClientState,
  ClientStateEnum,
  setState,
  ApplyingLocalOp,
  ApplyingBufferedLocalOp,
  SendingOpToController,
} from '../../utils/WebSocket';
import CircularJSON from 'circular-json';

export default {
  /* be called by applyOp() or localChange*/
  run(ed, sender, opts = {}, isLocalChange = 1) {
    /******************* apply 'delete-component' operation start ********************/
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
    /******************* apply 'delete-component' operation end ********************/
    if (isLocalChange) {
      let op = {
        action: 'delete-component',
        opts: opts,
      };
      if (ClientState == ClientStateEnum.Synced) {
        // set state to ApplyingLocalOp
        setState(ClientStateEnum.ApplyingLocalOp);
        // increase localTS and set localOp
        ApplyingLocalOp(op);
        // set state to SendingOpToController
        setState(ClientStateEnum.SendingOpToController);
        // send op to controller
        SendingOpToController();
      } else if (ClientState == ClientStateEnum.AwaitingACK || ClientState == ClientStateEnum.AwaitingWithBuffer) {
        // set state to ApplyingBufferedLocalOp
        setState(ClientStateEnum.ApplyingBufferedLocalOp);
        // push the op to buffer
        ApplyingBufferedLocalOp(op);
        // set state to AwaitingWithBuffer
        setState(ClientStateEnum.AwaitingWithBuffer);
      }
    }

    return components;
  },
};

/*
  ComponentDelete.run
  params: components
*/
