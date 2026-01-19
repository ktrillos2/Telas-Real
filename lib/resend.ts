import { Resend } from 'resend';

// Initialize Resend with the API key
// Note: In production, ensure RESEND_API_KEY is set in your environment variables
const resend = new Resend(process.env.RESEND_API_KEY);

export default resend;
