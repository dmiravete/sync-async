const express = require('express')
const app = express()
const cluster = require('express-cluster');
const port = 3002

cluster(function(worker) {

  app.use(express.json())

  /*
    Exposed service to make the load
  */
  app.post('/load', (req,res) => {

    let body = req.body
    let correlationId = req.headers['correlation-id']
    let replyTo = req.headers['reply-to']
    

    console.log('Input:  ' + correlationId)
    

    setTimeout(function(){
      callback(body, correlationId, replyTo)
      res.end()
    }, 4000);

  })

  app.listen(port, () => {
    console.log(`Example app listening on port ${port}`)
  })


  /***************   Callback   *********************************/

  const http = require('http');

  function callback(data, correlationId, replyTo) {

    data = JSON.stringify(data);

    //console.log(data)
    console.log('Output: ' + correlationId)

    const options = {
      hostname: 'localhost',
      port: 3001,
      path: '/callback',
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
    
    });
    req.write(data);
    req.end();
    
  }
}, {count: 5})


