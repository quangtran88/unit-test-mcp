export interface EmailService {
  sendWelcomeEmail(email: string, name: string): Promise<void>;
  sendActivationEmail(email: string, name: string): Promise<void>;
  sendPasswordResetEmail(email: string): Promise<void>;
}
