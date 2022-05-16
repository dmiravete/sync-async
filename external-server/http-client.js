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

module.exports.sendToNui = sendToNui;