const stompit = require('stompit');

const connectOptions = {
  'host': 'localhost',
  'port': 61613,
  'connectHeaders':{
    'host': '/',
    'login': 'guest',
    'passcode': 'guest',
    'heart-beat': '0,0'
  }
};

// Function to init the queue connection
function init(eventEmitterReference, ){
    eventEmitter = eventEmitterReference;
    stompConnect();
    
}

var stompClient = null;

function stompConnect(){
  stompit.connect(connectOptions, function(error, client) {
    
    if (error) {
      console.log('connect error ' + error.message);
      return;
    }
    
    stompClient = client;  
    stompConsume();
  });
}

function stompEmit(message){

  const correlationId = generateUuid();

  const sendHeaders = {
    'client-id': 'external',
    'destination': 'load2',
    'content-type': 'text/plain',
    'destination-type': 'ANYCAST',
    'correlation-id': correlationId,
    'reply-to': 'callback2'
  };
  
  const frame = stompClient.send(sendHeaders);
  frame.write(JSON.stringify(message));
  frame.end();

  return correlationId;
}

function stompConsume(){

  const subscribeHeaders = {
    'destination': 'callback2',
    'ack': 'client-individual'
  };

  stompClient.subscribe(subscribeHeaders, function(error, message) {
    
    if (error) {
      console.log('subscribe error ' + error);
      return;
    }

    let correlationId = message.headers['correlation-id'];
    
    message.readString('utf-8', function(error, body) {

      if (error) {
        console.log('read message error ' + error.message);
        return;
      }

      console.log("queue : " + correlationId);

      // Emit the event wit the correlationId
      eventEmitter.emit(correlationId, body);
      console.log('received message: ' + body);
      stompClient.ack(message);
    });
  });
}

// UID Generator
function generateUuid() {
  return Math.random().toString() +
         Math.random().toString() +
         Math.random().toString();
}

module.exports.init = init;
module.exports.emit = stompEmit;