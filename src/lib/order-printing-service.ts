import { PrinterService } from '@/lib/robust-printer-service';
import { Order, Printer } from '@/lib/types';

/**
 * Order printing service that integrates with the enhanced printer system
 */
export class OrderPrintingService {
  
  /**
   * Print an order to appropriate printers
   */
  static async printOrder(tenantId: string, order: Order): Promise<void> {
    try {
      console.log('🖨️ Printing order:', order.orderNumber);
      
      // Get all active printers for the tenant
      const printers = await PrinterService.getTenantPrinters(tenantId);
      const activePrinters = printers.filter(p => p.active);
      
      if (activePrinters.length === 0) {
        console.warn('⚠️ No active printers found for tenant:', tenantId);
        return;
      }
      
      // Print to different printer types
      const printPromises = [];
      
      // Print kitchen order
      const kitchenPrinters = activePrinters.filter(p => p.type === 'kitchen');
      for (const printer of kitchenPrinters) {
        const kitchenContent = this.formatKitchenOrder(order);
        printPromises.push(
          PrinterService.sendPrintJob(printer, kitchenContent, 'kitchen')
        );
      }
      
      // Print receipt
      const receiptPrinters = activePrinters.filter(p => p.type === 'receipt');
      for (const printer of receiptPrinters) {
        const receiptContent = this.formatReceipt(order);
        printPromises.push(
          PrinterService.sendPrintJob(printer, receiptContent, 'receipt')
        );
      }
      
      // Print bar orders (if any drink items)
      const hasDrinks = order.items.some(item => 
        item.menuItem.categoryId === 'drinks' || 
        item.menuItem.name.toLowerCase().includes('drink')
      );
      
      if (hasDrinks) {
        const barPrinters = activePrinters.filter(p => p.type === 'bar');
        for (const printer of barPrinters) {
          const barContent = this.formatBarOrder(order);
          printPromises.push(
            PrinterService.sendPrintJob(printer, barContent, 'bar')
          );
        }
      }
      
      // Wait for all print jobs to complete
      const results = await Promise.allSettled(printPromises);
      
      // Log results
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          console.log(`✅ Print job ${index + 1} completed:`, result.value.message);
        } else {
          console.error(`❌ Print job ${index + 1} failed:`, result.reason);
        }
      });
      
      console.log('🎯 Order printing completed for order:', order.orderNumber);
      
    } catch (error) {
      console.error('❌ Error printing order:', error);
      throw error;
    }
  }
  
  /**
   * Format kitchen order for printing
   */
  private static formatKitchenOrder(order: Order): string {
    const lines = [];
    
    lines.push('='.repeat(32));
    lines.push('        KITCHEN ORDER');
    lines.push('='.repeat(32));
    lines.push('');
    lines.push(`Order #: ${order.orderNumber}`);
    lines.push(`Time: ${new Date(order.createdAt).toLocaleString()}`);
    lines.push(`Customer: ${order.customerName}`);
    lines.push(`Phone: ${order.customerPhone}`);
    if (order.address) {
      lines.push(`Address: ${order.address}`);
    }
    lines.push('');
    lines.push('-'.repeat(32));
    lines.push('ITEMS:');
    lines.push('-'.repeat(32));
    
    order.items.forEach(item => {
      lines.push(`${item.quantity}x ${item.menuItem.name}`);
      if (item.selectedAddons && item.selectedAddons.length > 0) {
        item.selectedAddons.forEach(addon => {
          lines.push(`  + ${addon.name}`);
        });
      }
      if (item.specialInstructions) {
        lines.push(`  NOTE: ${item.specialInstructions}`);
      }
      lines.push('');
    });
    
    lines.push('-'.repeat(32));
    lines.push(`Total: $${order.total.toFixed(2)}`);
    lines.push('='.repeat(32));
    
    return lines.join('\n');
  }
  
  /**
   * Format receipt for printing
   */
  private static formatReceipt(order: Order): string {
    const lines = [];
    
    lines.push('='.repeat(32));
    lines.push('        RECEIPT');
    lines.push('='.repeat(32));
    lines.push('');
    lines.push(`Order #: ${order.orderNumber}`);
    lines.push(`Date: ${new Date(order.createdAt).toLocaleString()}`);
    lines.push(`Customer: ${order.customerName}`);
    lines.push('');
    lines.push('-'.repeat(32));
    
    let subtotal = 0;
    order.items.forEach(item => {
      const itemTotal = item.quantity * item.menuItem.price;
      subtotal += itemTotal;
      
      lines.push(`${item.quantity}x ${item.menuItem.name}`);
      lines.push(`    $${item.menuItem.price.toFixed(2)} each = $${itemTotal.toFixed(2)}`);
      
      if (item.selectedAddons && item.selectedAddons.length > 0) {
        item.selectedAddons.forEach(addon => {
          const addonTotal = addon.price * item.quantity;
          lines.push(`  + ${addon.name} ($${addon.price.toFixed(2)}) = $${addonTotal.toFixed(2)}`);
          subtotal += addonTotal;
        });
      }
      lines.push('');
    });
    
    lines.push('-'.repeat(32));
    lines.push(`Subtotal: $${subtotal.toFixed(2)}`);
    lines.push(`Tax: $${(order.total - subtotal).toFixed(2)}`);
    lines.push(`TOTAL: $${order.total.toFixed(2)}`);
    lines.push('='.repeat(32));
    lines.push('');
    lines.push('Thank you for your order!');
    lines.push('');
    
    return lines.join('\n');
  }
  
  /**
   * Format bar order for printing
   */
  private static formatBarOrder(order: Order): string {
    const lines = [];
    
    lines.push('='.repeat(32));
    lines.push('        BAR ORDER');
    lines.push('='.repeat(32));
    lines.push('');
    lines.push(`Order #: ${order.orderNumber}`);
    lines.push(`Time: ${new Date(order.createdAt).toLocaleString()}`);
    lines.push(`Customer: ${order.customerName}`);
    lines.push('');
    lines.push('-'.repeat(32));
    lines.push('DRINKS:');
    lines.push('-'.repeat(32));
    
    // Filter only drink items
    const drinkItems = order.items.filter(item => 
      item.menuItem.categoryId === 'drinks' || 
      item.menuItem.name.toLowerCase().includes('drink')
    );
    
    drinkItems.forEach(item => {
      lines.push(`${item.quantity}x ${item.menuItem.name}`);
      if (item.selectedAddons && item.selectedAddons.length > 0) {
        item.selectedAddons.forEach(addon => {
          lines.push(`  + ${addon.name}`);
        });
      }
      if (item.specialInstructions) {
        lines.push(`  NOTE: ${item.specialInstructions}`);
      }
      lines.push('');
    });
    
    lines.push('='.repeat(32));
    
    return lines.join('\n');
  }
  
  /**
   * Test all printers for a tenant
   */
  static async testAllPrinters(tenantId: string): Promise<{ [printerId: string]: any }> {
    const printers = await PrinterService.getTenantPrinters(tenantId);
    const results: { [printerId: string]: any } = {};
    
    for (const printer of printers) {
      try {
        const result = await PrinterService.testPrinterConnection(printer);
        results[printer.id] = result;
      } catch (error) {
        results[printer.id] = {
          success: false,
          message: 'Test failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        };
      }
    }
    
    return results;
  }
}
