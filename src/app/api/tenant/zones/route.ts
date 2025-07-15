import { NextRequest, NextResponse } from 'next/server';
import { 
  getTenantDeliveryZones, 
  saveTenantDeliveryZone, 
  updateTenantDeliveryZone, 
  deleteTenantDeliveryZone 
} from '@/lib/tenant-zone-service';

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

    const zones = await getTenantDeliveryZones(tenantId);
    
    return NextResponse.json({
      success: true,
      data: zones
    });
  } catch (error) {
    console.error('Error fetching tenant delivery zones:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to fetch delivery zones' },
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

    const zoneData = await request.json();
    
    // Validate required fields
    if (!zoneData.name || !zoneData.postcodes || zoneData.postcodes.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Zone name and postcodes are required' },
        { status: 400 }
      );
    }

    await saveTenantDeliveryZone(tenantId, zoneData);
    
    return NextResponse.json({
      success: true,
      message: 'Delivery zone created successfully'
    });
  } catch (error) {
    console.error('Error creating tenant delivery zone:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to create delivery zone' },
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

    const zoneData = await request.json();
    
    // Validate required fields
    if (!zoneData.id || !zoneData.name || !zoneData.postcodes || zoneData.postcodes.length === 0) {
      return NextResponse.json(
        { success: false, error: 'Zone ID, name and postcodes are required' },
        { status: 400 }
      );
    }

    await updateTenantDeliveryZone(tenantId, zoneData);
    
    return NextResponse.json({
      success: true,
      message: 'Delivery zone updated successfully'
    });
  } catch (error) {
    console.error('Error updating tenant delivery zone:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to update delivery zone' },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tenantId = searchParams.get('tenantId');
    const zoneId = searchParams.get('zoneId');
    
    if (!tenantId || !zoneId) {
      return NextResponse.json(
        { success: false, error: 'Tenant ID and Zone ID are required' },
        { status: 400 }
      );
    }

    await deleteTenantDeliveryZone(tenantId, zoneId);
    
    return NextResponse.json({
      success: true,
      message: 'Delivery zone deleted successfully'
    });
  } catch (error) {
    console.error('Error deleting tenant delivery zone:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to delete delivery zone' },
      { status: 500 }
    );
  }
}
