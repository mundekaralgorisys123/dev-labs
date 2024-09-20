require('dotenv').config();

const config = {
  user: process.env.IMAP_USER,
  password: process.env.IMAP_PASSWORD,
  host: process.env.IMAP_HOST,
  port: parseInt(process.env.IMAP_PORT, 10),
  tls: process.env.IMAP_TLS === 'true'
};

module.exports = config;
