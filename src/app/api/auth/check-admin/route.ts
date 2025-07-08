import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(request: NextRequest) {
  try {
    const cookieStore = await cookies();
    const sessionCookie = cookieStore.get('admin-session');

    if (!sessionCookie) {
      return NextResponse.json({
        authenticated: false,
        error: 'No session found'
      });
    }

    const sessionData = JSON.parse(sessionCookie.value);
    
    // Check if session is still valid (24 hours)
    const loginTime = new Date(sessionData.loginTime);
    const now = new Date();
    const hoursDiff = (now.getTime() - loginTime.getTime()) / (1000 * 60 * 60);
    
    if (hoursDiff > 24) {
      // Session expired, clear cookie
      cookieStore.delete('admin-session');
      return NextResponse.json({
        authenticated: false,
        error: 'Session expired'
      });
    }

    return NextResponse.json({
      authenticated: true,
      user: {
        id: sessionData.userId,
        email: sessionData.email,
        name: sessionData.name,
        role: sessionData.role
      },
      tenant: {
        id: sessionData.tenantId,
        slug: sessionData.tenantSlug
      },
      tenantSlug: sessionData.tenantSlug
    });

  } catch (error) {
    console.error('Auth check error:', error);
    return NextResponse.json({
      authenticated: false,
      error: 'Invalid session'
    });
  }
}
