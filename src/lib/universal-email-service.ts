import nodemailer from 'nodemailer';

interface WelcomeEmailData {
  restaurantName: string;
  adminEmail: string;
  adminName: string;
  password: string;
  tenantSlug: string;
}

class UniversalEmailService {
  private transporter: nodemailer.Transporter | null = null;

  constructor() {
    this.initializeTransporter();
  }

  private async initializeTransporter() {
    try {
      // Use environment variables for email configuration
      this.transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST || 'localhost',
        port: parseInt(process.env.SMTP_PORT || '587'),
        secure: process.env.SMTP_SECURE === 'true',
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });
    } catch (error) {
      console.error('Failed to initialize email transporter:', error);
    }
  }

  async sendWelcomeEmail(data: WelcomeEmailData): Promise<boolean> {
    try {
      if (!this.transporter) {
        console.log('Email transporter not available, skipping welcome email');
        return false;
      }

      const mailOptions = {
        from: process.env.FROM_EMAIL || 'noreply@orderweb.com',
        to: data.adminEmail,
        subject: `Welcome to OrderWeb - ${data.restaurantName}`,
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>Welcome to OrderWeb!</h2>
            <p>Hello ${data.adminName},</p>
            <p>Your restaurant "<strong>${data.restaurantName}</strong>" has been successfully set up on OrderWeb.</p>
            
            <div style="background-color: #f5f5f5; padding: 20px; border-radius: 5px; margin: 20px 0;">
              <h3>Your Login Details:</h3>
              <p><strong>Email:</strong> ${data.adminEmail}</p>
              <p><strong>Password:</strong> ${data.password}</p>
              <p><strong>Admin URL:</strong> <a href="${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/${data.tenantSlug}/admin">${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/${data.tenantSlug}/admin</a></p>
            </div>
            
            <p>Please log in and change your password as soon as possible.</p>
            
            <p>Thank you for choosing OrderWeb!</p>
            <p>Best regards,<br>The OrderWeb Team</p>
          </div>
        `,
      };

      await this.transporter.sendMail(mailOptions);
      console.log('Welcome email sent successfully to:', data.adminEmail);
      return true;
    } catch (error) {
      console.error('Failed to send welcome email:', error);
      return false;
    }
  }

  async sendEmail(to: string, subject: string, html: string): Promise<boolean> {
    try {
      if (!this.transporter) {
        console.log('Email transporter not available, skipping email');
        return false;
      }

      const mailOptions = {
        from: process.env.FROM_EMAIL || 'noreply@orderweb.com',
        to,
        subject,
        html,
      };

      await this.transporter.sendMail(mailOptions);
      console.log('Email sent successfully to:', to);
      return true;
    } catch (error) {
      console.error('Failed to send email:', error);
      return false;
    }
  }
}

// Export singleton instance
export const emailService = new UniversalEmailService();
