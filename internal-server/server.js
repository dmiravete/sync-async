const express = require('express')
const amqp = require('amqplib/callback_api');
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
  console.log(req.body)
  res.end()
})

app.listen(port, () => {
  console.log(`Example app listening on port ${port}`)
})




