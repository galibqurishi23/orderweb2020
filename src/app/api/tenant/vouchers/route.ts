import { NextRequest, NextResponse } from 'next/server';
import { 
  getTenantVouchers, 
  saveTenantVoucher, 
  updateTenantVoucher, 
  deleteTenantVoucher 
} from '@/lib/tenant-voucher-service';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');
    
    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'Tenant ID is required' },
        { status: 400 }
      );
    }

    const vouchers = await getTenantVouchers(tenantId);
    
    return NextResponse.json({
      success: true,
      data: vouchers
    });
  } catch (error) {
    console.error('Error fetching tenant vouchers:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch vouchers' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');
    
    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'Tenant ID is required' },
        { status: 400 }
      );
    }

    const voucherData = await request.json();
    
    // Validate required fields
    if (!voucherData.code || !voucherData.value || !voucherData.expiryDate) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    await saveTenantVoucher(tenantId, voucherData);
    
    return NextResponse.json({
      success: true,
      message: 'Voucher created successfully'
    });
  } catch (error) {
    console.error('Error creating tenant voucher:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create voucher' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');
    
    if (!tenantId) {
      return NextResponse.json(
        { success: false, error: 'Tenant ID is required' },
        { status: 400 }
      );
    }

    const voucherData = await request.json();
    
    // Validate required fields
    if (!voucherData.id || !voucherData.code || !voucherData.value || !voucherData.expiryDate) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    await updateTenantVoucher(tenantId, voucherData);
    
    return NextResponse.json({
      success: true,
      message: 'Voucher updated successfully'
    });
  } catch (error) {
    console.error('Error updating tenant voucher:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update voucher' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');
    const voucherId = searchParams.get('voucherId');
    
    if (!tenantId || !voucherId) {
      return NextResponse.json(
        { success: false, error: 'Tenant ID and Voucher ID are required' },
        { status: 400 }
      );
    }

    await deleteTenantVoucher(tenantId, voucherId);
    
    return NextResponse.json({
      success: true,
      message: 'Voucher deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting tenant voucher:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete voucher' },
      { status: 500 }
    );
  }
}
