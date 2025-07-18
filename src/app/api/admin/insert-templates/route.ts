import { NextResponse } from 'next/server';
import { insertProfessionalTemplates } from '@/lib/professional-email-templates-v2';

export async function POST() {
  try {
    console.log('🚀 Starting professional email templates insertion...');
    
    const success = await insertProfessionalTemplates();
    
    if (success) {
      console.log('✅ All professional email templates have been successfully inserted!');
      return NextResponse.json({ 
        success: true, 
        message: 'Professional email templates inserted successfully!' 
      });
    } else {
      console.error('❌ Failed to insert templates.');
      return NextResponse.json({ 
        success: false, 
        message: 'Failed to insert templates' 
      }, { status: 500 });
    }
  } catch (error) {
    console.error('❌ Unexpected error:', error);
    return NextResponse.json({ 
      success: false, 
      message: 'Unexpected error occurred' 
    }, { status: 500 });
  }
}
