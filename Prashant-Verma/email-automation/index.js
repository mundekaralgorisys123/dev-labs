require("dotenv").config();
const Imap = require("imap");
const { inspect } = require("util");
const { simpleParser } = require("mailparser");

const accounts = [
  {
    user: process.env.EMAIL_1_USER,
    password: process.env.EMAIL_1_PASSWORD,
    host: process.env.EMAIL_1_HOST,
    port: process.env.EMAIL_1_PORT,
    tls: process.env.EMAIL_1_TLS === "true",
  },
  {
    user: process.env.EMAIL_2_USER,
    password: process.env.EMAIL_2_PASSWORD,
    host: process.env.EMAIL_2_HOST,
    port: process.env.EMAIL_2_PORT,
    tls: process.env.EMAIL_2_TLS === "true",
  },
];

function openInbox(imap, callback) {
  imap.openBox("INBOX", true, callback);
}

function fetchEmailsForAccount(account) {
  console.log(`Connecting to account: ${account.user}`);

  const imap = new Imap({
    user: account.user,
    password: account.password,
    host: account.host,
    port: account.port,
    tls: account.tls,
    tlsOptions: { rejectUnauthorized: false },
  });

  imap.once("ready", function () {
    openInbox(imap, function (err, box) {
      if (err) throw err;
      console.log(`Total messages in inbox: ${box.messages.total}`);

      const f = imap.seq.fetch(`${box.messages.total}:1`, {
        bodies: ["HEADER.FIELDS (FROM TO SUBJECT DATE)", "TEXT"],
        struct: true,
      });

      f.on("message", function (msg, seqno) {
        console.log(`Message #${seqno}`);
        let prefix = `(#${seqno}) `;
        let bodyBuffer = "";
        msg.on("body", function (stream, info) {
          let buffer = "";
          stream.on("data", function (chunk) {
            buffer += chunk.toString("utf8");
          });
          stream.once("end", function () {
            if (info.which === "TEXT") {
              bodyBuffer = buffer;
            } else {
              console.log(
                `${prefix}Parsed header: ${inspect(Imap.parseHeader(buffer))}`
              );
            }
          });
        });
        msg.once("attributes", function (attrs) {
          console.log(`${prefix}Attributes: ${inspect(attrs, false, 8)}`);
        });
        msg.once("end", async function () {
          // Decode and parse the email body
          console.log(`${prefix}Finished`);
          try {
            const parsed = await simpleParser(bodyBuffer);
            if (parsed.text) {
              console.log(`${prefix}Parsed text body:`, parsed.text);
            } else {
              console.log(`${prefix}No plain text body available.`);
            }
          } catch (error) {
            console.error(`${prefix}Error parsing body:`, error);
          }
        });
      });

      f.once("error", function (err) {
        console.log("Fetch error: " + err);
      });

      f.once("end", function () {
        console.log("Done fetching all messages for " + account.user);
        imap.end();
      });
    });
  });

  imap.once("error", function (err) {
    console.log(`Error with account ${account.user}: ` + err);
  });

  imap.once("end", function () {
    console.log(`Connection ended for ${account.user}`);
  });

  imap.connect();
}

accounts.forEach(fetchEmailsForAccount);
