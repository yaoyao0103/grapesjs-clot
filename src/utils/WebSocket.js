import Stomp from 'stompjs';
import SockJS from 'sockjs-client';
import ComponentDelete from '../commands/view/ComponentDelete';
import { myEditor } from '../index.js';
import CircularJSON from 'circular-json';

export var stompClient;
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

export const sendMessage = (op, id) => {
  //console.log("op:" + JSON.stringify(op));
  localTS += 1;
  let CtoS_Msg = {
    sender: username,
    sessionId: sessionId,
    type: 'OP',
    ts: localTS,
    op: CircularJSON.stringify(op),
    id: id,
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
      let attr = wrapper.get('attributes');
      let id = attr.id;
      //console.log(canavs);
      //let id= Components.getId();
      let CtoS_Msg = {
        sender: username,
        sessionId: sessionId,
        type: 'COPY',
        ts: localTS,
        op: CircularJSON.stringify(wrapper),
        id: id,
      };
      stompClient.send('/app/chat.send', {}, CircularJSON.stringify(CtoS_Msg));
    }
  } else if (StoC_msg.type === 'COPY') {
    let remoteOp = CircularJSON.parse(StoC_msg.op);
    let wrapper = myEditor.getWrapper();
    wrapper.set('attributes', { id: StoC_msg.id });
    myEditor.setComponents(remoteOp);
  } else if (StoC_msg.type === 'OP') {
    let remoteOp = CircularJSON.parse(StoC_msg.op);
    let opts = remoteOp.opts;
    if (remoteOp.action === 'delete-component') {
      ComponentDelete.run(myEditor.getModel().getEditor(), null, opts, 0);
    }
  }
};
