const express = require('express')
const amqp = require('amqplib/callback_api');
const app = express()
const port = 3001


app.use(express.json())

app.get('/', (req, res) => {
  res.send('Hello World!')
})

/*
  Exposed service to receive callback
*/
app.post('/callback',(req,res) => {
  let body = req.body
  let correlationId = req.headers['correlation-id']
  let replyTo = req.headers['reply-to']
  res.end()

  replyCallback(body, correlationId, replyTo)
  
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})


/********************************** HTTP Client ***************************/

const http = require('http');

function sendToNui(data, correlationId, replyTo) {

  const options = {
    hostname: 'localhost',
    port: 3002,
    path: '/load',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length,
      'Correlation-Id': correlationId,
      'reply-to': replyTo
    }
  };

  const req = http.request(options, res => {
  
    req.on('error', error => {
      console.error(error);
    });
    
    res.on('data', d => {
      process.stdout.write(d);
    });
  
    console.log('Output NUI:     ' + correlationId)
  });

  req.write(data);
  req.end();

}

/**********************************  AMQP Part ******************************************/

amqpConnect();

var amqpConn = null;
const connectionString = 'amqp://localhost'

function amqpConnect(){
  amqp.connect('amqp://localhost', function(error, connection) {

    if (error) {
      console.error("[AMQP]", error.message);
      throw error;
    }
    amqpConn = connection;
    createChannel();
  });
}

var eventChannel = null;
var queue = 'rpc_queue';

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
    sendToNui(message, correlationId, replyTo);
    console.log('Input Queue:    ' + correlationId)

  });
}


function replyCallback(message, correlationId, replyTo){

  console.log('Input callback: ' + correlationId)
  eventChannel.sendToQueue(replyTo, Buffer.from(message.toString()), {
      correlationId: correlationId
    });

}
