// email.js
const nodemailer = require('nodemailer');

// Create a transporter object using Gmail service
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'nflpoolparty7@gmail.com', // Your email address
    pass: 'tujgtbkzukprmvwf',  // Your email password or app-specific password
  },
});

// Function to send email
const sendMatchEmail = (userEmail, pick) => {
  const mailOptions = {
    from: '"Pick Party" <nflpoolparty7@gmail.com>',
    to: userEmail, // Send to the user's email
    subject: 'Your Pick Has Been Matched!',
    html: `
        <h5>Your [${pick.team} ${pick.spread}] pick has been matched for $${pick.matchedWager} with ${pick.matchedUserEmail} !</h5>
        <p>Log in to see all Matched and Unmatched Picks in one place.</p>
        <p>Godspeed!</p>
    `,
};

  // Send the email
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log('Error sending email: ', error);
    } else {
      console.log('Email sent: ' + info.response);
    }
  });
};

module.exports = { sendMatchEmail };