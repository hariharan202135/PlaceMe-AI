import nodemailer from 'nodemailer';

export const sendResetEmail = async (to: string, resetUrl: string): Promise<boolean> => {
  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT) || 587;
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!user || !pass) {
    console.warn('⚠️ SMTP credentials not configured (SMTP_USER/SMTP_PASS). Skipping email dispatch.');
    return false;
  }

  try {
    const transporter = nodemailer.createTransport({
      host: host || 'smtp.gmail.com',
      port,
      secure: port === 465,
      auth: { user, pass }
    });

    const mailOptions = {
      from: `"PlaceMe AI Support" <${user}>`,
      to,
      subject: 'Password Reset Request - PlaceMe AI',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 10px;">
          <h2 style="color: #6366f1; text-align: center;">PlaceMe AI</h2>
          <p>Hello,</p>
          <p>We received a request to reset the password for your account. Click the button below to choose a new password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}" style="background-color: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 8px; font-weight: bold; display: inline-block;">Reset Password</a>
          </div>
          <p>If you did not request a password reset, please ignore this email. This link will expire in 15 minutes.</p>
          <hr style="border: 0; border-top: 1px solid #eee; margin: 30px 0;" />
          <p style="font-size: 11px; color: #888; text-align: center;">PlaceMe AI Platform Support</p>
        </div>
      `
    };

    const info = await transporter.sendMail(mailOptions);
    console.log(`✉️ Password reset email dispatched to ${to}: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error('Error dispatching password reset email:', error);
    return false;
  }
};
