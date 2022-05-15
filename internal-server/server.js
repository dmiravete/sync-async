const express = require('express')
const amqp = require('amqplib/callback_api');
const EventEmitter = require('events')
const eventEmitter = new EventEmitter();
const app = express()
const port = 3000


app.use(express.json())

app.get('/', (req, res) => {
  res.send('Hello World!')
})

/*
  Exposed service to make the load
*/
app.post('/load',(req,res) => {
  
  correlation = emit(req.body)
  console.log("generated: " + correlation)
  
  eventEmitter.once(correlation, msg => {
    console.log("Emited:     " + correlation)
    res.write(msg)
    res.end()
  })
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})


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
var assertQueue = null;

function createChannel(){

  amqpConn.createChannel(function(error, channel) {
    if (error) {
      console.error("[AMQP]", error.message);
      throw error;
    }

    channel.assertQueue('', { exclusive: true }, function(error1, q) {

      if (error1) {
        console.error("[AMQP]", error.message);
        throw error1;
      }
      eventChannel = channel;

      assertQueue = q;
       
      eventChannel.consume(assertQueue.queue, function(msg) {
        console.log("queue : " + msg.properties.correlationId)
        eventEmitter.emit(msg.properties.correlationId, msg.content)

      }, {
        noAck: true
      });

    });
  });
}


var keysMap = {}

function emit(message){

  var correlationId = generateUuid();
  message = JSON.stringify(message);
  console.log('Message:' + message);

  eventChannel.sendToQueue('rpc_queue', Buffer.from(message), {
      correlationId: correlationId,
      replyTo: assertQueue.queue 
  });
  return correlationId
}

function generateUuid() {
  return Math.random().toString() +
         Math.random().toString() +
         Math.random().toString();
}





