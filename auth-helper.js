// auth-helper.js
require('dotenv').config();
const express = require('express');
const { google } = require('googleapis');

const app = express();

const oauth2Client = new google.auth.OAuth2(
  process.env.GMAIL_CLIENT_ID,
  process.env.GMAIL_CLIENT_SECRET,
  process.env.GMAIL_REDIRECT_URI || 'http://localhost:5000/oauth2callback'
);

const SCOPES = ['https://www.googleapis.com/auth/gmail.send'];

app.get('/auth', (req, res) => {
  const url = oauth2Client.generateAuthUrl({
    access_type: 'offline',   // <- important: asks for refresh token
    scope: SCOPES,
    prompt: 'consent'        // <- forces consent screen so refresh_token is returned
  });
  res.redirect(url);
});

app.get('/oauth2callback', async (req, res) => {
  const code = req.query.code;
  if (!code) return res.status(400).send('Missing code');
  try {
    const { tokens } = await oauth2Client.getToken(code);
    // tokens.refresh_token will exist the first time consent is granted (or if prompt: 'consent' used)
    console.log('TOKENS:', tokens);
    res.send(`<h2>Success</h2><p>Check server logs — refresh_token printed in console.</p>
              <pre>${JSON.stringify(tokens, null, 2)}</pre>`);
  } catch (err) {
    console.error('Error getting tokens:', err);
    res.status(500).send('Token exchange failed — check server logs.');
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Auth helper running on http://localhost:${PORT}`);
  console.log(`Visit http://localhost:${PORT}/auth to start consent flow`);
});
