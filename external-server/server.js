const express = require('express')
const stompit = require('./stompit')
const app = express()
const port = 3001


app.use(express.json())

// Queue Initialization
stompit.init()


/*
  Exposed service to receive callback
*/
app.post('/callback',(req,res) => {
  let data = req.body
  let correlationId = req.headers['correlation-id']
  let replyTo = req.headers['reply-to']
  res.end()

  stompit.replyCallback(data, correlationId, replyTo)
  
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})