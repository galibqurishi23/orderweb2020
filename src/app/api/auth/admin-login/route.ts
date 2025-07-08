import { NextRequest, NextResponse } from 'next/server';
import bcrypt from 'bcryptjs';
import { cookies } from 'next/headers';
import { TenantService } from '@/lib/tenant-service';
import db from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const { username, password, tenantSlug } = await request.json();

    if (!username || !password || !tenantSlug) {
      return NextResponse.json(
        { success: false, error: 'Username, password, and tenant are required' },
        { status: 400 }
      );
    }

    // Get tenant by slug
    const tenant = await TenantService.getTenantBySlug(tenantSlug);
    if (!tenant) {
      return NextResponse.json(
        { success: false, error: 'Restaurant not found' },
        { status: 404 }
      );
    }

    // Find user in tenant_users table using username (owner is the admin role)
    const [userRows] = await db.execute(
      'SELECT id, email, username, password, name, role, active FROM tenant_users WHERE username = ? AND tenant_id = ? AND role = "owner"',
      [username, tenant.id]
    );

    const users = userRows as any[];
    if (users.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid username or password' },
        { status: 401 }
      );
    }

    const user = users[0];

    // Check if user is active
    if (!user.active) {
      return NextResponse.json(
        { success: false, error: 'Account is deactivated' },
        { status: 401 }
      );
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return NextResponse.json(
        { success: false, error: 'Invalid username or password' },
        { status: 401 }
      );
    }

    // Create session data
    const sessionData = {
      userId: user.id,
      email: user.email,
      username: user.username,
      name: user.name,
      role: user.role,
      tenantId: tenant.id,
      tenantSlug: tenant.slug,
      loginTime: new Date().toISOString()
    };

    // Set HTTP-only cookie for session
    const cookieStore = await cookies();
    cookieStore.set('admin-session', JSON.stringify(sessionData), {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 24 * 60 * 60, // 24 hours
      path: '/'
    });

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role
      },
      tenant: {
        id: tenant.id,
        name: tenant.name,
        slug: tenant.slug
      }
    });

  } catch (error) {
    console.error('Admin login error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
