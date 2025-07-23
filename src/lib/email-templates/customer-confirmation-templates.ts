export interface CustomerOrderData {
  orderId: string;
  orderNumber: string;
  customerName: string;
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
  estimatedTime?: string;
  specialInstructions?: string;
  orderTime: string;
}

export interface RestaurantBranding {
  restaurantName: string;
  restaurantLogo?: string;
  socialMedia?: {
    facebook?: string;
    instagram?: string;
    twitter?: string;
  };
  customFooter?: string;
  contactInfo?: {
    phone?: string;
    email?: string;
    address?: string;
  };
}

// Template A: Professional & Clean
export function generateCustomerConfirmationTemplateA(
  orderData: CustomerOrderData,
  branding: RestaurantBranding
): { subject: string; html: string; text: string } {

  const subject = `Order Confirmation #${orderData.orderNumber} - ${branding.restaurantName}`;

  const itemsList = orderData.items.map(item => {
    const addonsText = item.addons && item.addons.length > 0 
      ? `<br><small style="color: #666;">+ ${item.addons.join(', ')}</small>` 
      : '';
    return `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #e9ecef;">
          <div style="font-weight: 500; color: #2c3e50;">${item.name}</div>
          <div style="font-size: 14px; color: #6c757d;">Quantity: ${item.quantity}</div>
          ${addonsText}
        </td>
        <td style="padding: 12px; border-bottom: 1px solid #e9ecef; text-align: right; font-weight: 500; color: #2c3e50;">
          £${item.price.toFixed(2)}
        </td>
      </tr>
    `;
  }).join('');

  const socialMediaLinks = branding.socialMedia ? `
    <div style="margin-top: 20px; text-align: center;">
      <p style="color: #6c757d; margin-bottom: 10px; font-size: 14px;">Follow us on social media:</p>
      <div style="display: inline-block;">
        ${branding.socialMedia.facebook ? `<a href="${branding.socialMedia.facebook}" style="margin: 0 10px; color: #3b5998; text-decoration: none;">Facebook</a>` : ''}
        ${branding.socialMedia.instagram ? `<a href="${branding.socialMedia.instagram}" style="margin: 0 10px; color: #e4405f; text-decoration: none;">Instagram</a>` : ''}
        ${branding.socialMedia.twitter ? `<a href="${branding.socialMedia.twitter}" style="margin: 0 10px; color: #1da1f2; text-decoration: none;">Twitter</a>` : ''}
      </div>
    </div>
  ` : '';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Order Confirmation</title>
    </head>
    <body style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background-color: #f8f9fa;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 8px; overflow: hidden; box-shadow: 0 0 25px rgba(0,0,0,0.1);">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
          ${branding.restaurantLogo ? 
            `<img src="${branding.restaurantLogo}" alt="${branding.restaurantName}" style="max-height: 60px; margin-bottom: 20px; filter: brightness(0) invert(1);">` : 
            ''
          }
          <h1 style="color: white; margin: 0; font-size: 32px; font-weight: 300; letter-spacing: 1px;">${branding.restaurantName}</h1>
          <div style="width: 60px; height: 2px; background-color: white; margin: 15px auto;"></div>
          <p style="color: rgba(255,255,255,0.9); margin: 0; font-size: 18px;">Order Confirmation</p>
        </div>

        <!-- Success Message -->
        <div style="padding: 30px; text-align: center; background-color: #d4edda; border-bottom: 1px solid #c3e6cb;">
          <div style="display: inline-block; width: 60px; height: 60px; background-color: #28a745; border-radius: 50%; position: relative; margin-bottom: 15px;">
            <span style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: white; font-size: 24px;">✓</span>
          </div>
          <h2 style="color: #155724; margin: 0 0 10px 0; font-size: 24px; font-weight: 400;">Thank you, ${orderData.customerName}!</h2>
          <p style="color: #155724; margin: 0; font-size: 16px;">Your order has been confirmed and is being prepared.</p>
        </div>

        <!-- Order Details -->
        <div style="padding: 30px;">
          
          <!-- Order Info -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 30px; padding: 20px; background-color: #f8f9fa; border-radius: 6px;">
            <div>
              <h3 style="margin: 0 0 10px 0; color: #495057; font-size: 16px; font-weight: 600;">Order Details</h3>
              <p style="margin: 5px 0; color: #6c757d;"><strong>Order #:</strong> ${orderData.orderNumber}</p>
              <p style="margin: 5px 0; color: #6c757d;"><strong>Order Time:</strong> ${orderData.orderTime}</p>
              <p style="margin: 5px 0; color: #6c757d;"><strong>Order Type:</strong> ${orderData.orderType}</p>
            </div>
            <div>
              <h3 style="margin: 0 0 10px 0; color: #495057; font-size: 16px; font-weight: 600;">Payment & Delivery</h3>
              <p style="margin: 5px 0; color: #6c757d;"><strong>Payment:</strong> ${orderData.paymentMethod}</p>
              ${orderData.estimatedTime ? `<p style="margin: 5px 0; color: #6c757d;"><strong>Est. Time:</strong> ${orderData.estimatedTime}</p>` : ''}
              ${orderData.deliveryAddress ? `<p style="margin: 5px 0; color: #6c757d;"><strong>Delivery:</strong> ${orderData.deliveryAddress}</p>` : ''}
            </div>
          </div>

          <!-- Order Items -->
          <div style="margin-bottom: 30px;">
            <h3 style="color: #2c3e50; margin: 0 0 20px 0; font-size: 20px; font-weight: 500; border-bottom: 2px solid #667eea; padding-bottom: 8px;">Your Order</h3>
            <table style="width: 100%; border-collapse: collapse; background-color: white; border: 1px solid #dee2e6; border-radius: 6px; overflow: hidden;">
              <tbody>
                ${itemsList}
              </tbody>
              <tfoot>
                <tr style="background-color: #f8f9fa;">
                  <td style="padding: 15px; text-align: left; font-weight: 600; color: #2c3e50; font-size: 18px; border-top: 2px solid #667eea;">Total Amount</td>
                  <td style="padding: 15px; text-align: right; font-weight: 600; color: #2c3e50; font-size: 18px; border-top: 2px solid #667eea;">£${orderData.totalAmount.toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          ${orderData.specialInstructions ? `
          <!-- Special Instructions -->
          <div style="background-color: #fff3cd; padding: 15px; border-radius: 6px; margin-bottom: 30px; border-left: 4px solid #ffc107;">
            <h4 style="margin: 0 0 8px 0; color: #856404; font-size: 16px;">Special Instructions</h4>
            <p style="margin: 0; color: #856404;">${orderData.specialInstructions}</p>
          </div>
          ` : ''}

          <!-- Contact Info -->
          ${branding.contactInfo ? `
          <div style="background-color: #e3f2fd; padding: 20px; border-radius: 6px; margin-bottom: 20px;">
            <h4 style="margin: 0 0 15px 0; color: #1565c0; font-size: 16px;">Contact Information</h4>
            ${branding.contactInfo.phone ? `<p style="margin: 5px 0; color: #1976d2;"><strong>Phone:</strong> ${branding.contactInfo.phone}</p>` : ''}
            ${branding.contactInfo.email ? `<p style="margin: 5px 0; color: #1976d2;"><strong>Email:</strong> ${branding.contactInfo.email}</p>` : ''}
            ${branding.contactInfo.address ? `<p style="margin: 5px 0; color: #1976d2;"><strong>Address:</strong> ${branding.contactInfo.address}</p>` : ''}
          </div>
          ` : ''}

          ${socialMediaLinks}
        </div>

        <!-- Footer -->
        <div style="background-color: #2c3e50; padding: 25px; text-align: center;">
          <p style="color: #bdc3c7; margin: 0 0 10px 0; font-size: 16px; font-weight: 500;">${branding.restaurantName}</p>
          ${branding.customFooter ? `<p style="color: #95a5a6; margin: 0 0 10px 0; font-size: 14px;">${branding.customFooter}</p>` : ''}
          <p style="color: #95a5a6; margin: 0; font-size: 12px;">Thank you for choosing us for your dining experience!</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
ORDER CONFIRMATION - ${branding.restaurantName}

Thank you, ${orderData.customerName}!
Your order has been confirmed and is being prepared.

ORDER DETAILS:
Order #: ${orderData.orderNumber}
Order Time: ${orderData.orderTime}
Order Type: ${orderData.orderType}
Payment Method: ${orderData.paymentMethod}
${orderData.estimatedTime ? `Estimated Time: ${orderData.estimatedTime}` : ''}
${orderData.deliveryAddress ? `Delivery Address: ${orderData.deliveryAddress}` : ''}

YOUR ORDER:
${orderData.items.map(item => {
  const addons = item.addons && item.addons.length > 0 ? ` (+ ${item.addons.join(', ')})` : '';
  return `${item.name} x${item.quantity}${addons} - £${item.price.toFixed(2)}`;
}).join('\n')}

TOTAL: £${orderData.totalAmount.toFixed(2)}

${orderData.specialInstructions ? `SPECIAL INSTRUCTIONS:\n${orderData.specialInstructions}\n` : ''}

${branding.contactInfo ? `CONTACT INFO:\n${branding.contactInfo.phone ? `Phone: ${branding.contactInfo.phone}\n` : ''}${branding.contactInfo.email ? `Email: ${branding.contactInfo.email}\n` : ''}${branding.contactInfo.address ? `Address: ${branding.contactInfo.address}\n` : ''}` : ''}

---
${branding.restaurantName}
${branding.customFooter || 'Thank you for choosing us for your dining experience!'}
  `;

  return { subject, html, text };
}

// Template B: Warm & Friendly
export function generateCustomerConfirmationTemplateB(
  orderData: CustomerOrderData,
  branding: RestaurantBranding
): { subject: string; html: string; text: string } {

  const subject = `🍽️ Your delicious order is confirmed! #${orderData.orderNumber} - ${branding.restaurantName}`;

  const itemsList = orderData.items.map(item => {
    const addonsText = item.addons && item.addons.length > 0 
      ? `<br><small style="color: #ff6b35;">+ ${item.addons.join(', ')}</small>` 
      : '';
    return `
      <tr>
        <td style="padding: 15px; border-bottom: 2px solid #ffe4d6; background-color: #fff8f5;">
          <div style="font-weight: 600; color: #d2001f; font-size: 16px;">${item.name}</div>
          <div style="font-size: 14px; color: #ff6b35; margin-top: 5px;">Qty: ${item.quantity} 🍴</div>
          ${addonsText}
        </td>
        <td style="padding: 15px; border-bottom: 2px solid #ffe4d6; background-color: #fff8f5; text-align: right; font-weight: 600; color: #d2001f; font-size: 16px;">
          £${item.price.toFixed(2)}
        </td>
      </tr>
    `;
  }).join('');

  const socialMediaLinks = branding.socialMedia ? `
    <div style="margin-top: 25px; text-align: center; background-color: #fff0e6; padding: 20px; border-radius: 15px;">
      <p style="color: #ff6b35; margin-bottom: 15px; font-size: 16px; font-weight: 600;">🌟 Stay connected with us! 🌟</p>
      <div style="display: inline-block;">
        ${branding.socialMedia.facebook ? `<a href="${branding.socialMedia.facebook}" style="margin: 0 15px; color: #3b5998; text-decoration: none; font-weight: 600; font-size: 16px;">📘 Facebook</a>` : ''}
        ${branding.socialMedia.instagram ? `<a href="${branding.socialMedia.instagram}" style="margin: 0 15px; color: #e4405f; text-decoration: none; font-weight: 600; font-size: 16px;">📸 Instagram</a>` : ''}
        ${branding.socialMedia.twitter ? `<a href="${branding.socialMedia.twitter}" style="margin: 0 15px; color: #1da1f2; text-decoration: none; font-weight: 600; font-size: 16px;">🐦 Twitter</a>` : ''}
      </div>
    </div>
  ` : '';

  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Order Confirmation</title>
    </head>
    <body style="font-family: 'Comic Sans MS', cursive, Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; background: linear-gradient(45deg, #ff9a56, #ffad56, #ffc356, #ffd556); min-height: 100vh;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white; border-radius: 20px; overflow: hidden; box-shadow: 0 0 30px rgba(0,0,0,0.2); border: 3px solid #ff6b35;">
        
        <!-- Header -->
        <div style="background: linear-gradient(135deg, #ff6b35 0%, #f7931e 50%, #ff6b35 100%); padding: 40px 30px; text-align: center; position: relative;">
          <div style="position: absolute; top: 10px; left: 20px; font-size: 30px;">🍽️</div>
          <div style="position: absolute; top: 10px; right: 20px; font-size: 30px;">🎉</div>
          ${branding.restaurantLogo ? 
            `<img src="${branding.restaurantLogo}" alt="${branding.restaurantName}" style="max-height: 70px; margin-bottom: 20px; border-radius: 10px; box-shadow: 0 4px 8px rgba(0,0,0,0.2);">` : 
            ''
          }
          <h1 style="color: white; margin: 0; font-size: 36px; font-weight: bold; text-shadow: 2px 2px 4px rgba(0,0,0,0.3);">${branding.restaurantName}</h1>
          <div style="margin: 15px auto; width: 80px; height: 4px; background-color: white; border-radius: 2px;"></div>
          <p style="color: white; margin: 0; font-size: 20px; font-weight: 600;">🎊 Order Confirmed! 🎊</p>
        </div>

        <!-- Success Message -->
        <div style="padding: 30px; text-align: center; background: linear-gradient(135deg, #4ecdc4 0%, #44a08d 100%); color: white;">
          <div style="display: inline-block; width: 80px; height: 80px; background-color: white; border-radius: 50%; position: relative; margin-bottom: 20px; box-shadow: 0 4px 12px rgba(0,0,0,0.2);">
            <span style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); color: #4ecdc4; font-size: 36px; font-weight: bold;">✓</span>
          </div>
          <h2 style="color: white; margin: 0 0 15px 0; font-size: 28px; font-weight: bold; text-shadow: 1px 1px 2px rgba(0,0,0,0.2);">Hooray, ${orderData.customerName}! 🥳</h2>
          <p style="color: white; margin: 0; font-size: 18px; font-weight: 500;">Your delicious order is confirmed and our chefs are getting started!</p>
        </div>

        <!-- Order Details -->
        <div style="padding: 30px; background-color: #fffbf7;">
          
          <!-- Order Info Cards -->
          <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 15px; margin-bottom: 30px;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 20px; border-radius: 15px; color: white; text-align: center;">
              <h3 style="margin: 0 0 10px 0; font-size: 18px; font-weight: bold;">📋 Order Info</h3>
              <p style="margin: 5px 0; font-size: 14px;"><strong>Order #:</strong> ${orderData.orderNumber}</p>
              <p style="margin: 5px 0; font-size: 14px;"><strong>Time:</strong> ${orderData.orderTime}</p>
              <p style="margin: 5px 0; font-size: 14px;"><strong>Type:</strong> ${orderData.orderType}</p>
            </div>
            <div style="background: linear-gradient(135deg, #ff9a56 0%, #ff6b35 100%); padding: 20px; border-radius: 15px; color: white; text-align: center;">
              <h3 style="margin: 0 0 10px 0; font-size: 18px; font-weight: bold;">💳 Payment & Time</h3>
              <p style="margin: 5px 0; font-size: 14px;"><strong>Payment:</strong> ${orderData.paymentMethod}</p>
              ${orderData.estimatedTime ? `<p style="margin: 5px 0; font-size: 14px;"><strong>Ready in:</strong> ${orderData.estimatedTime}</p>` : ''}
              ${orderData.deliveryAddress ? `<p style="margin: 5px 0; font-size: 14px;"><strong>📍 Delivery</strong></p>` : ''}
            </div>
          </div>

          ${orderData.deliveryAddress ? `
          <!-- Delivery Address -->
          <div style="background-color: #e8f4fd; padding: 20px; border-radius: 15px; margin-bottom: 25px; border: 2px dashed #3498db; text-align: center;">
            <h4 style="margin: 0 0 10px 0; color: #2980b9; font-size: 18px;">🚚 Delivery Address</h4>
            <p style="margin: 0; color: #2980b9; font-weight: 600; font-size: 16px;">${orderData.deliveryAddress}</p>
          </div>
          ` : ''}

          <!-- Order Items -->
          <div style="margin-bottom: 30px;">
            <h3 style="color: #d2001f; margin: 0 0 20px 0; font-size: 24px; font-weight: bold; text-align: center; background: linear-gradient(45deg, #ffd89b 0%, #19547b 100%); background-clip: text; -webkit-background-clip: text; -webkit-text-fill-color: transparent;">🍴 Your Delicious Order 🍴</h3>
            <table style="width: 100%; border-collapse: collapse; border-radius: 15px; overflow: hidden; box-shadow: 0 4px 12px rgba(0,0,0,0.1);">
              <tbody>
                ${itemsList}
              </tbody>
              <tfoot>
                <tr style="background: linear-gradient(135deg, #ff6b35 0%, #d2001f 100%); color: white;">
                  <td style="padding: 20px; text-align: left; font-weight: bold; font-size: 20px;">🎯 Total Amount</td>
                  <td style="padding: 20px; text-align: right; font-weight: bold; font-size: 24px;">£${orderData.totalAmount.toFixed(2)}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          ${orderData.specialInstructions ? `
          <!-- Special Instructions -->
          <div style="background: linear-gradient(135deg, #ffeaa7 0%, #fab1a0 100%); padding: 20px; border-radius: 15px; margin-bottom: 25px; border: 3px solid #fdcb6e; text-align: center;">
            <h4 style="margin: 0 0 10px 0; color: #d63031; font-size: 18px; font-weight: bold;">📝 Special Instructions</h4>
            <p style="margin: 0; color: #d63031; font-weight: 600; font-style: italic; font-size: 16px;">"${orderData.specialInstructions}"</p>
          </div>
          ` : ''}

          <!-- Contact Info -->
          ${branding.contactInfo ? `
          <div style="background: linear-gradient(135deg, #a8edea 0%, #fed6e3 100%); padding: 25px; border-radius: 15px; margin-bottom: 20px; text-align: center;">
            <h4 style="margin: 0 0 15px 0; color: #2d3436; font-size: 20px; font-weight: bold;">📞 Need to reach us?</h4>
            ${branding.contactInfo.phone ? `<p style="margin: 5px 0; color: #2d3436; font-weight: 600;"><strong>📱 Phone:</strong> ${branding.contactInfo.phone}</p>` : ''}
            ${branding.contactInfo.email ? `<p style="margin: 5px 0; color: #2d3436; font-weight: 600;"><strong>✉️ Email:</strong> ${branding.contactInfo.email}</p>` : ''}
            ${branding.contactInfo.address ? `<p style="margin: 5px 0; color: #2d3436; font-weight: 600;"><strong>📍 Address:</strong> ${branding.contactInfo.address}</p>` : ''}
          </div>
          ` : ''}

          ${socialMediaLinks}
        </div>

        <!-- Footer -->
        <div style="background: linear-gradient(135deg, #2d3436 0%, #636e72 100%); padding: 30px; text-align: center;">
          <p style="color: #ddd; margin: 0 0 15px 0; font-size: 20px; font-weight: bold;">🌟 ${branding.restaurantName} 🌟</p>
          ${branding.customFooter ? `<p style="color: #bbb; margin: 0 0 15px 0; font-size: 16px; font-style: italic;">${branding.customFooter}</p>` : ''}
          <p style="color: #999; margin: 0; font-size: 14px;">Thank you for bringing joy to our kitchen! 👨‍🍳👩‍🍳</p>
        </div>
      </div>
    </body>
    </html>
  `;

  const text = `
🍽️ ORDER CONFIRMATION - ${branding.restaurantName} 🎉

Hooray, ${orderData.customerName}!
Your delicious order is confirmed and our chefs are getting started!

📋 ORDER DETAILS:
Order #: ${orderData.orderNumber}
Order Time: ${orderData.orderTime}
Order Type: ${orderData.orderType}
Payment Method: ${orderData.paymentMethod}
${orderData.estimatedTime ? `Ready in: ${orderData.estimatedTime}` : ''}
${orderData.deliveryAddress ? `🚚 Delivery Address: ${orderData.deliveryAddress}` : ''}

🍴 YOUR DELICIOUS ORDER:
${orderData.items.map(item => {
  const addons = item.addons && item.addons.length > 0 ? ` (+ ${item.addons.join(', ')})` : '';
  return `${item.name} x${item.quantity}${addons} - £${item.price.toFixed(2)}`;
}).join('\n')}

🎯 TOTAL: £${orderData.totalAmount.toFixed(2)}

${orderData.specialInstructions ? `📝 SPECIAL INSTRUCTIONS:\n"${orderData.specialInstructions}"\n` : ''}

${branding.contactInfo ? `📞 CONTACT INFO:\n${branding.contactInfo.phone ? `📱 Phone: ${branding.contactInfo.phone}\n` : ''}${branding.contactInfo.email ? `✉️ Email: ${branding.contactInfo.email}\n` : ''}${branding.contactInfo.address ? `📍 Address: ${branding.contactInfo.address}\n` : ''}` : ''}

---
🌟 ${branding.restaurantName} 🌟
${branding.customFooter || 'Thank you for bringing joy to our kitchen! 👨‍🍳👩‍🍳'}
  `;

  return { subject, html, text };
}
