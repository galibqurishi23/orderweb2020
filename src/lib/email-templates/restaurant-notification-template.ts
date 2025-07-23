export function generateRestaurantNotificationTemplate(
  restaurantName: string,
  orderData: {
    orderId: string;
    orderNumber: string;
    customerName: string;
    customerPhone?: string;
    customerEmail: string;
    items: Array<{
      name: string;
      quantity: number;
      price: number;
      addons?: string[];
    }>;
    totalAmount: number;
    orderType: string;
    paymentMethod: string;
    deliveryAddress?: string;
    specialInstructions?: string;
    orderTime: string;
  },
  restaurantLogo?: string
): { subject: string; html: string; text: string } {
  
  const subject = `New Order #${orderData.orderNumber} - ${restaurantName}`;
  
  const itemsList = orderData.items.map(item => {
    const addonsText = item.addons && item.addons.length > 0 
      ? `<br><small>+ ${item.addons.join(', ')}</small>` 
      : '';
    return `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">
          ${item.name} x${item.quantity}${addonsText}
        </td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">
          £${item.price.toFixed(2)}
        </td>
      </tr>
    `;
  }).join('');

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Order Notification</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background-color: #f4f4f4;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 10px; overflow: hidden; box-shadow: 0 0 20px rgba(0,0,0,0.1);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; text-align: center;">
          ${restaurantLogo ? 
            `<img src="${restaurantLogo}" alt="${restaurantName}" style="max-height: 60px; margin-bottom: 15px;">` : 
            ''
          }
          <h1 style="color: white; margin: 0; font-size: 28px; font-weight: bold;">New Order Alert!</h1>
          <p style="color: #f0f0f0; margin: 10px 0 0 0; font-size: 16px;">Order #${orderData.orderNumber}</p>
        </div>

        <!-- Order Details -->
        <div style="padding: 30px;">
          
          <!-- Customer Information -->
          <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
            <h2 style="color: #2c3e50; margin: 0 0 15px 0; font-size: 20px; border-bottom: 2px solid #3498db; padding-bottom: 5px;">Customer Details</h2>
            <div style="display: grid; gap: 10px;">
              <p style="margin: 5px 0;"><strong>Name:</strong> ${orderData.customerName}</p>
              <p style="margin: 5px 0;"><strong>Email:</strong> ${orderData.customerEmail}</p>
              ${orderData.customerPhone ? `<p style="margin: 5px 0;"><strong>Phone:</strong> ${orderData.customerPhone}</p>` : ''}
              <p style="margin: 5px 0;"><strong>Order Type:</strong> <span style="background-color: #3498db; color: white; padding: 3px 8px; border-radius: 12px; font-size: 12px;">${orderData.orderType}</span></p>
              <p style="margin: 5px 0;"><strong>Payment:</strong> ${orderData.paymentMethod}</p>
              <p style="margin: 5px 0;"><strong>Order Time:</strong> ${orderData.orderTime}</p>
            </div>
          </div>

          ${orderData.deliveryAddress ? `
          <!-- Delivery Address -->
          <div style="background-color: #fff3cd; padding: 15px; border-radius: 8px; margin-bottom: 25px; border-left: 4px solid #ffc107;">
            <h3 style="margin: 0 0 10px 0; color: #856404;">Delivery Address</h3>
            <p style="margin: 0; color: #856404;">${orderData.deliveryAddress}</p>
          </div>
          ` : ''}

          <!-- Order Items -->
          <div style="margin-bottom: 25px;">
            <h2 style="color: #2c3e50; margin: 0 0 15px 0; font-size: 20px; border-bottom: 2px solid #e74c3c; padding-bottom: 5px;">Order Items</h2>
            <table style="width: 100%; border-collapse: collapse; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1);">
              <thead>
                <tr style="background-color: #34495e;">
                  <th style="padding: 15px; text-align: left; color: white; font-weight: bold;">Item</th>
                  <th style="padding: 15px; text-align: right; color: white; font-weight: bold;">Price</th>
                </tr>
              </thead>
              <tbody>
                ${itemsList}
              </tbody>
              <tfoot>
                <tr style="background-color: #2c3e50;">
                  <td style="padding: 15px; text-align: left; color: white; font-weight: bold; font-size: 18px;">Total</td>
                  <td style="padding: 15px; text-align: right; color: white; font-weight: bold; font-size: 18px;">£${orderData.totalAmount.toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          ${orderData.specialInstructions ? `
          <!-- Special Instructions -->
          <div style="background-color: #d1ecf1; padding: 15px; border-radius: 8px; margin-bottom: 25px; border-left: 4px solid #17a2b8;">
            <h3 style="margin: 0 0 10px 0; color: #0c5460;">Special Instructions</h3>
            <p style="margin: 0; color: #0c5460; font-style: italic;">${orderData.specialInstructions}</p>
          </div>
          ` : ''}

          <!-- Action Required -->
          <div style="background-color: #d4edda; padding: 20px; border-radius: 8px; text-align: center; border: 2px solid #28a745;">
            <h3 style="margin: 0 0 10px 0; color: #155724; font-size: 18px;">⏰ Action Required</h3>
            <p style="margin: 0; color: #155724; font-weight: bold;">Please confirm this order and begin preparation.</p>
          </div>
        </div>

        <!-- Footer -->
        <div style="background-color: #34495e; padding: 20px; text-align: center;">
          <p style="color: #bdc3c7; margin: 0; font-size: 14px;">${restaurantName} - Order Management System</p>
          <p style="color: #95a5a6; margin: 5px 0 0 0; font-size: 12px;">This is an automated notification from OrderWeb</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
NEW ORDER ALERT - ${restaurantName}

Order #${orderData.orderNumber}
Order Time: ${orderData.orderTime}

CUSTOMER DETAILS:
Name: ${orderData.customerName}
Email: ${orderData.customerEmail}
${orderData.customerPhone ? `Phone: ${orderData.customerPhone}` : ''}
Order Type: ${orderData.orderType}
Payment Method: ${orderData.paymentMethod}

${orderData.deliveryAddress ? `DELIVERY ADDRESS:\n${orderData.deliveryAddress}\n` : ''}

ORDER ITEMS:
${orderData.items.map(item => {
  const addons = item.addons && item.addons.length > 0 ? ` (+ ${item.addons.join(', ')})` : '';
  return `${item.name} x${item.quantity}${addons} - £${item.price.toFixed(2)}`;
}).join('\n')}

TOTAL: £${orderData.totalAmount.toFixed(2)}

${orderData.specialInstructions ? `SPECIAL INSTRUCTIONS:\n${orderData.specialInstructions}\n` : ''}

ACTION REQUIRED: Please confirm this order and begin preparation.

---
${restaurantName} - Order Management System
This is an automated notification from OrderWeb
  `;

  return { subject, html, text };
}
