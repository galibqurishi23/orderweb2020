import { NextRequest, NextResponse } from 'next/server';
import { TenantService } from '@/lib/tenant-service';

interface Params {
  id: string;
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;
    const body = await request.json();
    const { status } = body;

    if (!status || !['active', 'suspended', 'trial', 'cancelled'].includes(status)) {
      return NextResponse.json(
        { success: false, error: 'Invalid status' },
        { status: 400 }
      );
    }

    await TenantService.updateTenantStatus(id, status);

    return NextResponse.json({
      success: true,
      message: 'Tenant status updated successfully'
    });
  } catch (error) {
    console.error('Error updating tenant status:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update tenant status' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<Params> }
) {
  try {
    const resolvedParams = await params;
    const { id } = resolvedParams;

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Tenant ID is required' },
        { status: 400 }
      );
    }

    await TenantService.deleteTenant(id);

    return NextResponse.json({
      success: true,
      message: 'Restaurant and all associated data deleted successfully'
    });
  } catch (error: any) {
    console.error('Error deleting tenant:', error);
    
    if (error.message === 'Tenant not found') {
      return NextResponse.json(
        { success: false, error: 'Restaurant not found' },
        { status: 404 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Failed to delete restaurant' },
      { status: 500 }
    );
  }
}
