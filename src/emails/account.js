const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendWelcomeEmail = (email, name) => {
  sgMail.send({ // it could be used as promise
    to: email,
    from: 'fernando.herdoiza@jobsity.io',
    subject: 'Welcome to the task app',
    text: `Welcome to the app ${name}. Let me know how you get along with the app.`
    // also has a html label 
  });
}

const sendCancelEmail = (email, name) => {
  sgMail.send({ // it could be used as promise
    to: email,
    from: 'fernando.herdoiza@jobsity.io',
    subject: 'Bye bye',
    html: `<!DOCTYPE html>
    <html lang="en">
    <head>
    
    </head>
    <body>
      <h3>Hope to see you soon ${name}.</h3>
    </body>
    </html>`
  });
}

module.exports = {
  sendWelcomeEmail,
  sendCancelEmail
}