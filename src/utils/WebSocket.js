import Stomp from 'stompjs';
import SockJS from 'sockjs-client';
import { myEditor } from '../index.js';
import { parse, stringify } from 'flatted';
import CircularJSON from 'circular-json';
import { setComponentIds } from '../dom_components/model/Components';

import {
  applyDeleteComponent,
  applyUpdateTrait,
  applyUpdateContent,
  applyAddSelected,
  applyRemoveSelected,
} from './applyOp.js';

import { TMD, TMM, TMA, TAD, TAM, TAA } from './OT.js';

export var stompClient = null;
var username = '';
var sessionId = '';
export const ClientStateEnum = {
  Synced: 1,
  AwaitingACK: 2,
  AwaitingWithBuffer: 3,
  ApplyingRemoteOp: 4,
  ApplyingLocalOp: 5,
  ApplyingRemoteOpWithoutACK: 6,
  ApplyingBufferedLocalOp: 7,
  CreatingLocalOpFromBuffer: 8,
  ApplyingRemoteOpWithBuffer: 9,
  SendingOpToController: 10,
  EditorInitializing: 11,
};
export var ClientState = ClientStateEnum.EditorInitializing;
var localTS = 0;
var localOp = null;
var remoteOp = null;
var remoteTS = 0;
var localOpPrime = null;
var remoteOpPrime = null;
var opBuffer = new Array();
var initBuffer = new Array();

export const connectWebSocket = () => {
  username = makeId(5);
  let socket = new SockJS('http://localhost:8081/websocket');
  stompClient = Stomp.over(socket);
  stompClient.connect({}, onConnected, onError);
};

const onConnected = () => {
  // Subscribe to the Public Topic
  stompClient.subscribe('/topic/public', onMessageReceived);
  //console.log("session id: ", sessionId);
  stompClient.subscribe('/user/' + username + '/msg', onMessageReceived);
  // Tell your username to the server
  stompClient.send('/app/chat.register', {}, JSON.stringify({ sender: username, type: 'JOIN' }));
};

// make random id
const makeId = length => {
  var result = '';
  var characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  var charactersLength = characters.length;
  for (var i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * charactersLength));
  }
  return result;
};

const onError = () => {
  console.log('Error!!');
};

const onMessageReceived = async payload => {
  let StoC_msg = CircularJSON.parse(payload.body);

  if (StoC_msg.type === 'JOIN') {
    if (StoC_msg.sender === username) {
      sessionId = StoC_msg.sessionId;
      let clientNum = parseInt(StoC_msg.op);
      if (clientNum == 1) {
        // set state to Synced
        ClientState = ClientStateEnum.Synced;
      }
      //stompClient.subscribe('/user/' + sessionId + '/msg', onMessageReceived);
    }
    // join msg of other clients
    else {
      console.log('state: EditorInitializing');
      let wrapper = myEditor.getWrapper();
      let components = myEditor.getComponents();
      let style = myEditor.getStyle();
      setComponentIds(components);

      localTS += 1;
      let id = wrapper.get('attributes').id;
      let op = {
        action: 'copy-wrapper',
        opts: {
          components: components,
          style: style,
          id: id,
        },
      };
      let CtoS_Msg = {
        sender: username,
        sessionId: sessionId,
        type: 'COPY',
        ts: localTS,
        op: CircularJSON.stringify(op),
      };
      stompClient.send('/app/chat.send', {}, CircularJSON.stringify(CtoS_Msg));
    }
  } else if (StoC_msg.type === 'COPY') {
    // handle it only when the state is EditorInitializing (newly client)
    if (ClientState == ClientStateEnum.EditorInitializing) {
      let remoteOp = CircularJSON.parse(StoC_msg.op);
      let remoteTS = StoC_msg.ts;
      localTS = remoteTS;
      if (remoteOp.action == 'copy-wrapper') {
        let opts = remoteOp.opts;
        let wrapper = myEditor.getWrapper();

        // init the editor
        wrapper.set('attributes', { id: opts.id });
        myEditor.setComponents(opts.components);
        myEditor.setStyle(opts.style);

        while (initBuffer.length != 0) {
          let msg = initBuffer.shift();
          if (msg.ts > localTS) {
            remoteOp = CircularJSON.parse(msg.op);
            applyOp(remoteOp.action, remoteOp.opts);
          }
        }
        // set state to Synced
        ClientState = ClientStateEnum.Synced;
        console.log('state: Synced');
      }
    }
  } else if (StoC_msg.type === 'LEAVE') {
  } else if (StoC_msg.type === 'ACK') {
    //-------------------------- State: AwaitingACK ------------------------------
    if (ClientState == ClientStateEnum.AwaitingACK) {
      ClientState = ClientStateEnum.Synced;
      console.log('state: Synced');
    }
    //-------------------------- State: AwaitingWithBuffer ------------------------------
    else if (ClientState == ClientStateEnum.AwaitingWithBuffer) {
      /***** CreatingLocalOpFromBuffer *****/
      ClientState = ClientStateEnum.CreatingLocalOpFromBuffer;
      console.log('state: CreatingLocalOpFromBuffer');
      await CreatingLocalOpFromBuffer();
    }
    //-------------------------- State: Others ------------------------------
    else {
      if (
        ClientState != ClientStateEnum.AwaitingACK &&
        ClientState != ClientStateEnum.AwaitingWithBuffer &&
        ClientState != ClientStateEnum.EditorInitializing
      ) {
        onMessageReceived(payload);
      }
    }
  } else if (StoC_msg.type === 'OP') {
    console.log('ClientState: ' + ClientState);
    //--------------------------- State: Synced -----------------------------
    if (ClientState == ClientStateEnum.Synced) {
      /***** ApplyRemoteOp *****/
      ClientState = ClientStateEnum.ApplyingRemoteOp;
      console.log('state: ApplyingRemoteOp');
      await ApplyingRemoteOp(StoC_msg);
    }
    //-------------------------- State: AwaitingACK ------------------------------
    else if (ClientState == ClientStateEnum.AwaitingACK) {
      /***** ApplyingRemoteOpWithoutACK *****/
      ClientState = ClientStateEnum.ApplyingRemoteOpWithoutACK;
      console.log('state: ApplyingRemoteOpWithoutACK');
      await ApplyingRemoteOpWithoutACK(StoC_msg);
    }
    //-------------------------- State: AwaitingWithBuffer ------------------------------
    else if (ClientState == ClientStateEnum.AwaitingWithBuffer) {
      /***** ApplyingRemoteOpWithBuffer *****/
      ClientState = ClientStateEnum.ApplyingRemoteOpWithBuffer;
      console.log('state: ApplyingRemoteOpWithBuffer');
      await ApplyingRemoteOpWithBuffer(StoC_msg);
    }
    //-------------------------- State: EditorInitializing ------------------------------
    else if (ClientState == ClientStateEnum.EditorInitializing) {
      initBuffer.push(StoC_msg);
    }
    //-------------------------- State: Others ------------------------------
    else {
      if (
        ClientState != ClientStateEnum.Synced &&
        ClientState != ClientStateEnum.AwaitingACK &&
        ClientState != ClientStateEnum.AwaitingWithBuffer &&
        ClientState != ClientStateEnum.EditorInitializing
      ) {
        onMessageReceived(payload);
      }
    }
  }
};

const applyOp = (action, opts) => {
  console.log('action:', action);
  const droppable = myEditor.getModel().getCurrentFrame().droppable;
  if (action === 'delete-component') {
    applyDeleteComponent(myEditor.getModel().getEditor(), opts);
  } else if (action === 'add-component') {
    if (!opts.dropContent) return;
    droppable.applyAppendOrMoveComponent(opts);
    let components = myEditor.getComponents();
    setComponentIds(components);
    //sorter.move(opts.dst, opts.src, opts.pos, opts, 0);
  } else if (action === 'move-component') {
    droppable.applyAppendOrMoveComponent(opts);
    //sorter.move(opts.dst, opts.src, opts.pos, opts, 0);
  } else if (action === 'select-component') {
    applyAddSelected(opts);
  } else if (action === 'unselect-component') {
    applyRemoveSelected(opts);
  } else if (action === 'copy-component') {
  } else if (action === 'update-content') {
    applyUpdateContent(opts);
  } else if (action === 'update-trait') {
    applyUpdateTrait(opts);
  } else if (action === 'update-style') {
    myEditor.getModel().get('StyleManager').applyUpdateStyle(opts);
  }
};

// finish
export const setState = state => {
  ClientState = state;
};

// finish
export const SendingOpToController = () => {
  // send Op to controller
  localOp.username = username;
  let CtoS_Msg = {
    sender: username,
    sessionId: sessionId,
    type: 'OP',
    ts: localTS,
    op: CircularJSON.stringify(localOp),
  };
  stompClient.send('/app/chat.send', {}, CircularJSON.stringify(CtoS_Msg));

  // buffer is empty => AwaitingACK state
  if (opBuffer.length <= 0) {
    ClientState = ClientStateEnum.AwaitingACK;
    console.log('state: AwaitingACK');
  }
  // buffer is not empty => AwaitingWithBuffer state
  else {
    ClientState = ClientStateEnum.AwaitingWithBuffer;
    console.log('state: AwaitingWithBuffer');
  }
};

// finish
export const ApplyingLocalOp = op => {
  //console.log("state: ApplyingLocalOp");
  // step 1: set localOp to the Op in the received LocalChange event
  localOp = op;

  // step 2: increment localTS
  localTS += 1;

  /* don't need
    // step 3: call applyOp(localOp) (don't need)
    applyOp(localOp);
  */
  // next state: SendingOpToController
  ClientState = ClientStateEnum.SendingOpToController;
  console.log('state: SendingOpToController');
  SendingOpToController();
};

// finish
export const ApplyingBufferedLocalOp = op => {
  //console.log("state: ApplyingBufferedLocalOp");
  // step 1: add Op from the received LocalChange event to opBuffer
  opBuffer.push(op);

  /* don't need
    // step 2: call applyOp(opBuffer.last)
    applyOp(opBuffer[opBuffer.length-1]);
  */
  // next state: AwaitingWithBuffer
  ClientState = ClientStateEnum.AwaitingWithBuffer;
  console.log('state: AwaitingWithBuffer');
};

const CreatingLocalOpFromBuffer = () => {
  //console.log("state: CreatingLocalOpFromBuffer");
  // step 1: increment localTS
  localTS += 1;

  // step 2: set localOp to opBuffer.first
  localOp = opBuffer[0];

  // step 3: remove opBuffer.first from opBuffer
  opBuffer.shift();

  // next state: SendingOpToController
  ClientState = ClientStateEnum.SendingOpToController;
  console.log('state: SendingOpToController');
  SendingOpToController();
};

// finish
const ApplyingRemoteOp = StoC_msg => {
  //console.log("state: ApplyRemoteOp");
  // step 1: set remoteTS and remoteOp to the values within the received StoC Msg event
  remoteOp = CircularJSON.parse(StoC_msg.op);
  remoteTS = StoC_msg.ts;

  // step 2: set localTS to the value of remoteTS
  localTS = remoteTS;

  // step 3: call applyOp(remoteOp)
  applyOp(remoteOp.action, remoteOp.opts);

  // next state: Synced
  ClientState = ClientStateEnum.Synced;
  console.log('state: Synced');
};

// finish
const ApplyingRemoteOpWithoutACK = StoC_msg => {
  //console.log("state: ApplyingRemoteOpWithoutACK");
  // step 1: set localTS to remoteTS
  localTS = StoC_msg.ts;

  // step 2: increment localTS
  localTS += 1;

  // step 3: set remoteTS and remoteOp to the values within the received StoC Msg event
  remoteTS = StoC_msg.ts;
  remoteOp = CircularJSON.parse(StoC_msg.op);

  // step 4: obtain remoteOpPrime and localOpPrime by evaluating xform(remoteOp, localOp)
  //console.log("local: " + JSON.stringify(localOp));
  //console.log("remote: " + JSON.stringify(remoteOp));
  remoteOpPrime = OT(remoteOp, localOp);
  localOpPrime = OT(localOp, remoteOp);

  console.log(remoteOpPrime.opts);
  console.log(localOpPrime.opts);
  // step 5: call applyOp(remoteOpPrime)
  //console.log(JSON.stringify(remoteOpPrime));
  applyOp(remoteOpPrime.action, remoteOpPrime.opts);

  // step 6: set localOp to the value of localOpPrime
  localOp = localOpPrime;

  // next state: SendingOpToController
  ClientState = ClientStateEnum.SendingOpToController;
  console.log('state: SendingOpToController');
  SendingOpToController();
};

const ApplyingRemoteOpWithBuffer = StoC_msg => {
  remoteOp = CircularJSON.parse(StoC_msg.op);
  remoteTS = StoC_msg.ts;
  let remoteOpPrimeArray = new Array();
  // step 1: set localTS to remoteTS
  localTS = remoteTS;

  // step 2: increment localTS
  localTS += 1;

  // step 3: obtain remoteOpPrime[0] by evaluating xform(remoteOp, localOp)
  remoteOpPrimeArray[0] = OT(remoteOp, localOp);

  // step 4: obtain remoteOpPrime[i+1] by evaluating xform(remoteOpPrime[i], opBuffer[i])
  for (let i = 0; i < opBuffer.length; i++) {
    remoteOpPrimeArray[i + 1] = OT(remoteOpPrimeArray[i], opBuffer[i]);
  }

  // step 5: call applyOp(remoteOpPrime.last)
  applyOp(
    remoteOpPrimeArray[remoteOpPrimeArray.length - 1].action,
    remoteOpPrimeArray[remoteOpPrimeArray.length - 1].opts
  );

  // step 6: obtain localOpPrime by evaluating xform(localOp, remoteOp)
  localOpPrime = OT(localOp, remoteOp);

  // step 7: set localOp to the value of localOpPrime
  localOp = localOpPrime;

  // step 8: obtain opBuffer[i] by evaluating xform(opBuffer[i], remoteOpPrime[i]) & send
  for (let j = 0; j < opBuffer.length; j++) {
    opBuffer[j] = OT(opBuffer[j], remoteOpPrimeArray[j]);
  }

  // next state: SendingOpToController
  ClientState = ClientStateEnum.SendingOpToController;
  console.log('state: SendingOpToController');
  SendingOpToController();
};

const OT = (tarOp, refOp) => {
  let tarAction = tarOp.action;
  let refAction = refOp.action;
  let tarOpPrime;
  if (tarAction === 'add-component') {
    if (refAction === 'delete-component') {
      tarOpPrime = TAD(tarOp, refOp); // get A'
    } else if (refAction === 'move-component') {
      tarOpPrime = TAM(tarOp, refOp); // get A'
    } else if (refAction === 'add-component') {
      tarOpPrime = TAA(tarOp, refOp); // get A'
    } else {
      tarOpPrime = tarOp;
    }
  } else if (tarAction === 'move-component') {
    if (refAction === 'delete-component') {
      tarOpPrime = TMD(tarOp, refOp); // get A'
    } else if (refAction === 'move-component') {
      tarOpPrime = TMM(tarOp, refOp); // get A'
    } else if (refAction === 'add-component') {
      tarOpPrime = TMA(tarOp, refOp); // get A'
    } else {
      tarOpPrime = tarOp;
    }
  } else {
    tarOpPrime = tarOp;
  }
  return tarOpPrime;
};
