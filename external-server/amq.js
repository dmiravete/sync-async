const amqp = require('amqplib/callback_api');
const httpClient = require ('./http-client')
let eventEmitter = null;
let amqpConn = null;
let connectionString = null;
let eventChannel = null;
const queue = 'rpc_queue';

// Function to init the queue connection
function init(connectionStringReference = 'amqp://localhost'){
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

function createChannel(){

    amqpConn.createChannel(function(error, channel) {
      if (error) {
        console.error("[AMQP]", error.message);
        throw error;
      }
  
      channel.assertQueue(queue, { durable: false });
      channel.prefetch(1);
      eventChannel = channel;
  
      startConsumer();
    });
  }

  function startConsumer(){

    eventChannel.consume(queue, function reply(msg) {
      let message = msg.content;
      let correlationId = msg.properties.correlationId;
      let replyTo = msg.properties.replyTo;
      console.log(replyTo)
      eventChannel.ack(msg)
      
      // Send to NUI
      httpClient.sendToNui(message, correlationId, replyTo);
      console.log('Input Queue:    ' + correlationId)
  
    });
  }

  function replyCallback(data, correlationId, replyTo){

    console.log('Input callback: ' + correlationId)
    eventChannel.sendToQueue(replyTo, Buffer.from(JSON.stringify(data)), {
        correlationId: correlationId
      });
  
  }

module.exports.init = init;
module.exports.replyCallback = replyCallback;