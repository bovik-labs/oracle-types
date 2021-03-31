const fs = require('fs');
const accountSid = process.env['TWILIO_ACCOUNT_ID'];
const authToken = fs.readFileSync('tok', 'utf8');
const client = require('twilio')(accountSid, authToken);

const http = require('http');
const express = require('express');

const MessagingResponse = require('twilio').twiml.MessagingResponse;

const app = express();
app.use(express.urlencoded({extended: false}));

// listener: undefined | (x : string) => void
let listener = undefined;

function notify(message) {
  if (listener !== undefined) {
	 listener(message);
	 listener = undefined;
  }
}

app.post('/sms', (req, res) => {

  console.log('got a message');
  console.log(req.body);
  const message = req.body.Body;
  notify(message);

   res.writeHead(200, {'Content-Type': 'text/xml'});
   res.end('<?xml version="1.0" encoding="UTF-8"?><Response></Response>');
});

app.get('/listen', (req, res) => {

  console.log('got a listener');

  listener = (message /*: string*/) => {
  	 res.json({message});
  }
});

http.createServer(app).listen(1337, () => {
  console.log('Express server listening on port 1337');
});
