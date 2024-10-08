// email.js

import dotenv from "dotenv";
import Imap from "imap";
import { simpleParser } from "mailparser";
import { PrismaClient } from "@prisma/client";

dotenv.config();

const prisma = new PrismaClient();

async function storeEmailInDatabase(emailData) {
  try {
    const existingEmail = await prisma.email.findFirst({
      where: {
        from: emailData.from,
        subject: emailData.subject,
        date: emailData.date,
      },
    });

    if (existingEmail) {
      console.log("Email already exists in database, skipping insert.");
      return existingEmail;
    }

    const storedEmail = await prisma.email.create({
      data: {
        from: emailData.from,
        to: emailData.to,
        subject: emailData.subject || "",
        date: emailData.date,
        bodyText: emailData.bodyText || "",
      },
    });
    console.log("Email stored in database successfully.");
    return storedEmail;
  } catch (error) {
    console.error("Error storing email in database:", error);
    throw error;
  }
}

function openInbox(imap, callback) {
  imap.openBox("INBOX", true, callback);
}

export async function fetchEmailsForAccount(account, page, pageSize) {
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

    imap.once("ready", function () {
      openInbox(imap, async function (err, box) {
        if (err) return reject(err);
        console.log(`Total messages in inbox: ${box.messages.total}`);

        const totalEmails = box.messages.total;
        const start = (page - 1) * pageSize + 1;
        const end = Math.min(start + pageSize - 1, totalEmails);

        const f = imap.seq.fetch(`${end}:${start}`, {
          bodies: ["HEADER.FIELDS (FROM TO SUBJECT DATE)", "TEXT"],
          struct: true,
        });

        let emails = [];

        f.on("message", function (msg, seqno) {
          let bodyBuffer = "";
          let emailData = {};

          msg.on("body", function (stream, info) {
            let buffer = "";
            stream.on("data", function (chunk) {
              buffer += chunk.toString("utf8");
            });
            stream.once("end", function () {
              if (info.which === "TEXT") {
                bodyBuffer = buffer;
              } else {
                const header = Imap.parseHeader(buffer);
                emailData.from = header.from ? header.from[0] : "";
                emailData.to = header.to ? header.to[0] : "";
                emailData.subject = header.subject ? header.subject[0] : "";
                emailData.date = new Date(header.date[0]);
              }
            });
          });

          msg.once("end", async function () {
            try {
              const parsed = await simpleParser(bodyBuffer);
              emailData.bodyText = parsed.text || "";
              const storedEmail = await storeEmailInDatabase(emailData);
              emails.push({
                id: storedEmail.id,
                from: emailData.from,
                to: emailData.to,
                subject: emailData.subject,
                date: emailData.date,
                bodyText: emailData.bodyText,
              });
            } catch (error) {
              console.error(`Error parsing or storing email:`, error);
            }
          });
        });

        f.once("error", function (err) {
          console.log("Fetch error: " + err);
          reject(err);
        });

        f.once("end", function () {
          imap.end();
          resolve({ emails, totalEmails });
        });
      });
    });

    imap.once("error", function (err) {
      console.log(`Error with account ${account.user}: ` + err);
      reject(err);
    });

    imap.once("end", function () {
      console.log(`Connection ended for ${account.user}`);
    });

    imap.connect();
  });
}
