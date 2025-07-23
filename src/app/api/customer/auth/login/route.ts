import { NextRequest, NextResponse } from 'next/server';
import { CustomerAuthService } from '@/lib/customer-auth-service';

export async function POST(request: NextRequest) {
  try {
    const { email, password, tenantId } = await request.json();

    if (!email || !password || !tenantId) {
      return NextResponse.json({
        success: false,
        error: 'Email, password, and restaurant are required'
      }, { status: 400 });
    }

    // Get client IP for rate limiting
    const clientIP = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     'unknown';

    const result = await CustomerAuthService.login(email, password, tenantId, clientIP);

    if (result.success) {
      const response = NextResponse.json({
        success: true,
        customer: result.customer
      });

      // Set HTTP-only cookie with JWT token
      response.cookies.set('customer-token', result.token!, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60, // 7 days
        path: '/'
      });

      return response;
    } else {
      return NextResponse.json({
        success: false,
        error: result.error
      }, { status: 401 });
    }

  } catch (error) {
    console.error('Customer login API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Login failed. Please try again.'
    }, { status: 500 });
  }
}
