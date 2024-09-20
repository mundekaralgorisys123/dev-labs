const Imap = require('imap');
const { inspect } = require('util');
const config = require('./config');
const { simpleParser } = require('mailparser'); 

console.log('Debugging user:', config.user);
console.log('Debugging password:', config.password);

const imap = new Imap({
  user: config.user,
  password: config.password,
  host: config.host,
  port: config.port,
  tls: config.tls,
  tlsOptions: { rejectUnauthorized: false }
});

function openInbox(callback) {
  imap.openBox('INBOX', true, callback);
}

imap.once('ready', function () {
  openInbox(function (err, box) {
    if (err) throw err;
    console.log(`Total messages in inbox: ${box.messages.total}`);

    const f = imap.seq.fetch(`${box.messages.total}:1`, {
      bodies: ['HEADER.FIELDS (FROM TO SUBJECT DATE)', 'TEXT'],
      struct: true,
    });

    f.on('message', function (msg, seqno) {
      console.log(`Message #${seqno}`);
      let prefix = `(#${seqno}) `;
      let bodyBuffer = '';
      msg.on('body', function (stream, info) {
        let buffer = '';
        stream.on('data', function (chunk) {
          buffer += chunk.toString('utf8');
        });
        stream.once('end', function () {
          if (info.which === 'TEXT') {
            bodyBuffer = buffer; 
          } else {
            console.log(`${prefix}Parsed header: ${inspect(Imap.parseHeader(buffer))}`);
          }
        });
      });
      msg.once('attributes', function (attrs) {
        console.log(`${prefix}Attributes: ${inspect(attrs, false, 8)}`);
      });
      msg.once('end', async function () {
        // Decode and parse the email body
        console.log(`${prefix}Finished`);
        try {
          const parsed = await simpleParser(bodyBuffer);
          console.log(`${prefix}Parsed body:`, parsed.text); 
        } catch (error) {
          console.error(`${prefix}Error parsing body:`, error);
        }
      });
    });

    f.once('error', function (err) {
      console.log('Fetch error: ' + err);
    });

    f.once('end', function () {
      console.log('Done fetching all messages!');
      imap.end();
    });
  });
});

imap.once('error', function (err) {
  console.log(err);
});

imap.once('end', function () {
  console.log('Connection ended');
});

imap.connect();
