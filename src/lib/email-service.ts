// Re-export the Universal Email Service for backward compatibility
export { 
  UniversalEmailService, 
  emailService as default,
  type EmailConfig,
  type EmailTemplate,
  type EmailData
} from './universal-email-service';
