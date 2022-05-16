const amqp = require('amqplib/callback_api');
let eventEmitter = null;
let amqpConn = null;
let connectionString = null;
let eventChannel = null;
let assertQueue = null;

// Function to init the queue connection
function init(eventEmitterReference, connectionStringReference = 'amqp://localhost'){
    eventEmitter = eventEmitterReference;
    connectionString = connectionStringReference;
    amqpConnect();
}


// Create AMQ Connection
function amqpConnect(){
  amqp.connect(connectionString, function(error, connection) {

    if (error) {
      console.error("[AMQP]", error.message);
      throw error;
    }
    amqpConn = connection;
    createChannel();
  });
}

/*
  Channel creation
  Includes the listener in the response queue
*/
function createChannel(){

  amqpConn.createChannel(function(error, channel) {
    if (error) {
      console.error("[AMQP]", error.message);
      throw error;
    }

    // Create the assert queue
    channel.assertQueue('', { exclusive: true }, function(error1, q) {
      if (error1) {
        console.error("[AMQP]", error1.message);
        throw error1;
      }
      eventChannel = channel;

      assertQueue = q;
      
      // Queue listener
      eventChannel.consume(assertQueue.queue, function(msg) {
        console.log("queue : " + msg.properties.correlationId);
        let data = msg.content;

        // Emit the event wit the correlationId
        eventEmitter.emit(msg.properties.correlationId, data);

      }, {
        noAck: true
      });

    });
  });
}

// Emmit message to queue
function emit(message){

  var correlationId = generateUuid();
  message = JSON.stringify(message);

  eventChannel.sendToQueue('rpc_queue', Buffer.from(message), {
      correlationId: correlationId,
      replyTo: assertQueue.queue 
  });
  return correlationId;
}

// UID Generator
function generateUuid() {
  return Math.random().toString() +
         Math.random().toString() +
         Math.random().toString();
}

module.exports.init = init;
module.exports.emit = emit;
