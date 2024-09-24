import dotenv from 'dotenv';
import Imap from 'imap';
import { inspect } from 'util';
import { simpleParser } from 'mailparser';
import { PrismaClient } from '@prisma/client';

dotenv.config();

const prisma = new PrismaClient();

const accounts = [
  {
    user: process.env.EMAIL_1_USER,
    password: process.env.EMAIL_1_PASSWORD,
    host: process.env.EMAIL_1_HOST,
    port: process.env.EMAIL_1_PORT,
    tls: process.env.EMAIL_1_TLS === 'true',
  },
  {
    user: process.env.EMAIL_2_USER,
    password: process.env.EMAIL_2_PASSWORD,
    host: process.env.EMAIL_2_HOST,
    port: process.env.EMAIL_2_PORT,
    tls: process.env.EMAIL_2_TLS === 'true',
  },
];

async function storeEmailInDatabase(emailData) {
  try {
    // Check if the email already exists in the database
    const existingEmail = await prisma.email.findFirst({
      where: {
        from: emailData.from,
        subject: emailData.subject,
        date: emailData.date,
      },
    });

    if (existingEmail) {
      console.log('Email already exists in database, skipping insert.');
      return; // Skip insertion if email already exists
    }

    // Insert the new email since it doesn't exist
    await prisma.email.create({
      data: {
        from: emailData.from,
        to: emailData.to,
        subject: emailData.subject || '',
        date: emailData.date,
        bodyText: emailData.bodyText || '',
      },
    });
    console.log('Email stored in database successfully.');
  } catch (error) {
    console.error('Error storing email in database:', error);
  }
}


function openInbox(imap, callback) {
  imap.openBox('INBOX', true, callback);
}

export function fetchEmailsForAccount(account) {
  return new Promise((resolve, reject) => {
    console.log(`Connecting to account: ${account.user}`);
  
    const imap = new Imap({
      user: account.user,
      password: account.password,
      host: account.host,
      port: account.port,
      tls: account.tls,
      tlsOptions: { rejectUnauthorized: false },
    });
  
    imap.once('ready', function () {
      openInbox(imap, function (err, box) {
        if (err) return reject(err);
        console.log(`Total messages in inbox: ${box.messages.total}`);
  
        const f = imap.seq.fetch(`${box.messages.total}:1`, {
          bodies: ['HEADER.FIELDS (FROM TO SUBJECT DATE)', 'TEXT'],
          struct: true,
        });
  
        let emails = [];
  
        f.on('message', function (msg, seqno) {
          let bodyBuffer = '';
          let emailData = {};
  
          msg.on('body', function (stream, info) {
            let buffer = '';
            stream.on('data', function (chunk) {
              buffer += chunk.toString('utf8');
            });
            stream.once('end', function () {
              if (info.which === 'TEXT') {
                bodyBuffer = buffer;
              } else {
                const header = Imap.parseHeader(buffer);
                emailData.from = header.from ? header.from[0] : '';
                emailData.to = header.to ? header.to[0] : '';
                emailData.subject = header.subject ? header.subject[0] : '';
                emailData.date = new Date(header.date[0]);
              }
            });
          });
  
          msg.once('end', async function () {
            try {
              // Parse the email body
              const parsed = await simpleParser(bodyBuffer);

              // Ensure only plain text is used for bodyText
              emailData.bodyText = parsed.text || ''; // This extracts only the plain text version
              
              // Skip HTML body
              // emailData.bodyHtml = parsed.html || ''; // Ignore the HTML content if it's available
  
              // Store email data in PostgreSQL database
              await storeEmailInDatabase(emailData);
              emails.push(emailData); // Add email to the array
            } catch (error) {
              console.error(`Error parsing or storing email:`, error);
            }
          });
        });
  
        f.once('error', function (err) {
          console.log('Fetch error: ' + err);
          reject(err);
        });
  
        f.once('end', function () {
          console.log('Done fetching all messages for ' + account.user);
          imap.end();
          resolve(emails); // Resolve with fetched emails
        });
      });
    });
  
    imap.once('error', function (err) {
      console.log(`Error with account ${account.user}: ` + err);
      reject(err);
    });
  
    imap.once('end', function () {
      console.log(`Connection ended for ${account.user}`);
    });
  
    imap.connect();
  });
}



accounts.forEach(fetchEmailsForAccount);