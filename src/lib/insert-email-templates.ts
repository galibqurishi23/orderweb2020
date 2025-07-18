#!/usr/bin/env node

// Script to insert professional email templates into the database
import { insertProfessionalTemplates } from './professional-email-templates-v2';

async function main() {
  console.log('🚀 Starting professional email templates insertion...');
  
  try {
    const success = await insertProfessionalTemplates();
    
    if (success) {
      console.log('✅ All professional email templates have been successfully inserted!');
      console.log('');
      console.log('📧 Available Templates:');
      console.log('  1. Classic Professional - Clean and corporate design');
      console.log('  2. Modern Minimalist - Simple and contemporary');
      console.log('  3. Colorful & Friendly - Fun and engaging design');
      console.log('');
      console.log('🎯 These templates include:');
      console.log('  • Professional HTML email layouts');
      console.log('  • Plain text versions for fallback');
      console.log('  • Demo data for testing');
      console.log('  • Variable substitution support');
      console.log('');
      console.log('🔧 Admins can now:');
      console.log('  • Choose from these templates in the admin panel');
      console.log('  • Preview templates with demo data');
      console.log('  • Customize colors and branding');
      console.log('  • Test email delivery');
      
      process.exit(0);
    } else {
      console.error('❌ Failed to insert templates. Check the error logs above.');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    process.exit(1);
  }
}

main();
