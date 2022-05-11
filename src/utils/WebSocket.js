import Stomp from 'stompjs';
import SockJS from 'sockjs-client';
import ComponentDelete from '../commands/view/ComponentDelete';
import { myEditor } from '../index.js';
import CircularJSON from 'circular-json';
import { setComponentIds } from '../dom_components/model/Components';

export var stompClient = null;
var localTS = 0;
var username = '';
var sessionId = '';

export const connectWebSocket = () => {
  username = makeId(5);
  let socket = new SockJS('http://localhost:8081/websocket');
  stompClient = Stomp.over(socket);
  stompClient.connect({}, onConnected, onError);
  // let Wrapper=FramesView.getWrapper();
  // console.log('Wrapper:');
  // console.log(Wrapper);
};

const onConnected = () => {
  // Subscribe to the Public Topic
  stompClient.subscribe('/topic/public', onMessageReceived);
  //console.log("session id: ", sessionId);
  stompClient.subscribe('/user/' + username + '/msg', onMessageReceived);

  // Tell your username to the server
  stompClient.send('/app/chat.register', {}, JSON.stringify({ sender: username, type: 'JOIN' }));
};

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

export const sendMessage = op => {
  //console.log("op:" + JSON.stringify(op));
  localTS += 1;
  let CtoS_Msg = {
    sender: username,
    sessionId: sessionId,
    type: 'OP',
    ts: localTS,
    op: CircularJSON.stringify(op),
  };
  stompClient.send('/app/chat.send', {}, CircularJSON.stringify(CtoS_Msg));
};

const onMessageReceived = payload => {
  let StoC_msg = CircularJSON.parse(payload.body);
  if (StoC_msg.type === 'JOIN') {
    localTS += 1;
    if (StoC_msg.sender === username) {
      sessionId = StoC_msg.sessionId;
      //stompClient.subscribe('/user/' + sessionId + '/msg', onMessageReceived);
    } else {
      let wrapper = myEditor.getWrapper();
      let components = myEditor.getComponents();
      //console.log("getComponentIds:" + getComponentIds(components));
      setComponentIds(components);

      let id = wrapper.get('attributes').id;
      let op = {
        action: 'copy-wrapper',
        opts: {
          components: components,
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
    let remoteOp = CircularJSON.parse(StoC_msg.op);
    if (remoteOp.action == 'copy-wrapper') {
      let opts = remoteOp.opts;
      let id = opts.id;
      let components = opts.components;
      //let currentFrame = opts.currentFrame;
      console.log('components:' + components);
      let wrapper = myEditor.getWrapper();
      wrapper.set('attributes', { id: id });
      myEditor.setComponents(components);
      //myEditor.getModel().setCurrentFrame(currentFrame);
    }
  } else if (StoC_msg.type === 'OP') {
    let remoteOp = CircularJSON.parse(StoC_msg.op);
    let opts = remoteOp.opts;
    if (remoteOp.action === 'delete-component') {
      ComponentDelete.run(myEditor.getModel().getEditor(), null, opts, 0);
    }
  }
};
