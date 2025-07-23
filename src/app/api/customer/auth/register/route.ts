import { NextRequest, NextResponse } from 'next/server';
import { CustomerAuthService } from '@/lib/customer-auth-service';

export async function POST(request: NextRequest) {
  try {
    const { name, email, password, phone, tenantId } = await request.json();

    if (!name || !email || !password || !tenantId) {
      return NextResponse.json({
        success: false,
        error: 'Name, email, password, and restaurant are required'
      }, { status: 400 });
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json({
        success: false,
        error: 'Please enter a valid email address'
      }, { status: 400 });
    }

    // Password strength validation
    if (password.length < 6) {
      return NextResponse.json({
        success: false,
        error: 'Password must be at least 6 characters long'
      }, { status: 400 });
    }

    const result = await CustomerAuthService.register(name, email, password, phone, tenantId);

    if (result.success) {
      const response = NextResponse.json({
        success: true,
        customer: result.customer,
        message: 'Account created successfully! Welcome bonus of 100 points added.'
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
      }, { status: 400 });
    }

  } catch (error) {
    console.error('Customer registration API error:', error);
    return NextResponse.json({
      success: false,
      error: 'Registration failed. Please try again.'
    }, { status: 500 });
  }
}
