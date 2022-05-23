const stompit = require('stompit');
const httpClient = require ('./http-client')

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

function stompConsume(){

  const subscribeHeaders = {
    'client-id': 'internal',  
    'destination': 'load2',
    'ack': 'client-individual'
  };

  stompClient.subscribe(subscribeHeaders, function(error, message) {
    
    if (error) {
      console.log('subscribe error ' + error);
      return;
    }
    let correlationId = message.headers['correlation-id'];
    let replyTo = message.headers['reply-to'];

    message.readString('utf-8', function(error, body) {

      if (error) {
        console.log('read message error ' + error.message);
        return;
      }

      console.log(body);
      
      // Send to NUI
      httpClient.sendToNui(body, correlationId, replyTo);
      
      stompClient.ack(message);
    });
  });
}

function replyCallback(data, correlationId, replyTo){

  console.log('Input callback: ' + correlationId)

  const sendHeaders = {
    'client-id': 'internal',
    'destination': replyTo,
    'content-type': 'text/plain',
    'destination-type': 'ANYCAST',
    'correlation-id': correlationId,

  };
  
  const frame = stompClient.send(sendHeaders);
  frame.write(JSON.stringify(data));
  frame.end();
}

module.exports.init = init;
module.exports.replyCallback = replyCallback;