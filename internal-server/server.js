const express = require('express')
const EventEmitter = require('events')
const eventEmitter = new EventEmitter();
const stompit = require('./stompit')
const app = express()
const port = 3000


app.use(express.json())

// Queue Initialization
stompit.init(eventEmitter)


// Exposed service to make the load
app.post('/load',(req,res) => {
  
  correlation = stompit.emit(req.body);
  console.log("generated: " + correlation);
  
  // Wait for the event emitted & reponse
  eventEmitter.once(correlation, msg => {
    console.log("Emited:     " + correlation);
    res.write(msg);
    res.end();
  })
})

// Init server
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})