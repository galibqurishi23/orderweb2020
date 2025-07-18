// Professional Email Templates for OrderWeb Restaurant System
// These templates use double curly braces {{ }} for variable substitution

export interface EmailTemplate {
  id: string;
  tenant_id: string;
  template_type: 'order_confirmation' | 'order_completion' | 'restaurant_alert';
  name: string;
  subject: string;
  html_content: string;
  text_content: string;
  variables: string;
  is_active: boolean;
  created_at?: Date;
  updated_at?: Date;
}

// Helper function to create template with proper variable handling
const createTemplate = (template: Omit<EmailTemplate, 'variables'> & { variables: any }): EmailTemplate => ({
  ...template,
  variables: JSON.stringify(template.variables),
  // Replace template variables with proper escaping for TypeScript
  html_content: template.html_content.replace(/\$\{\{([^}]+)\}\}/g, '${$1}'),
  text_content: template.text_content.replace(/\$\{\{([^}]+)\}\}/g, '${$1}'),
});

export const professionalEmailTemplates: EmailTemplate[] = [
  // Template 1: Classic Professional
  {
    id: 'classic-professional-confirmation',
    tenant_id: 'default',
    template_type: 'order_confirmation',
    name: 'Classic Professional',
    subject: 'Order Confirmation #{{order_number}} - {{restaurant_name}}',
    html_content: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Order Confirmation</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; line-height: 1.6; color: #333333; background-color: #f4f4f4;">
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #f4f4f4; padding: 20px;">
        <tr>
            <td align="center">
                <table cellpadding="0" cellspacing="0" border="0" width="600" style="background-color: #ffffff; border-radius: 10px; box-shadow: 0 4px 12px rgba(0,0,0,0.1); overflow: hidden;">
                    
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 40px 30px; text-align: center;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 28px; font-weight: 300; letter-spacing: 1px;">
                                {{restaurant_name}}
                            </h1>
                            <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 16px; opacity: 0.9;">
                                Order Confirmation
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            <div style="text-align: center; margin-bottom: 30px;">
                                <div style="background-color: #f8f9fa; border-radius: 50px; display: inline-block; padding: 15px 25px; margin-bottom: 20px;">
                                    <span style="font-size: 18px; font-weight: 600; color: #667eea;">Order #{{order_number}}</span>
                                </div>
                            </div>
                            
                            <p style="font-size: 16px; margin-bottom: 25px;">
                                Dear <strong>{{customer_name}}</strong>,
                            </p>
                            
                            <p style="font-size: 16px; margin-bottom: 25px;">
                                Thank you for choosing {{restaurant_name}}! We're delighted to confirm that your order has been received and is being prepared with care by our culinary team.
                            </p>
                            
                            <!-- Order Details Box -->
                            <div style="background-color: #f8f9fa; border-left: 4px solid #667eea; padding: 20px; margin: 25px 0; border-radius: 0 5px 5px 0;">
                                <h3 style="color: #333; margin-top: 0; font-size: 18px; margin-bottom: 15px;">Order Details</h3>
                                <table style="width: 100%; font-size: 14px;">
                                    <tr>
                                        <td style="padding: 5px 0; font-weight: 600;">Order Type:</td>
                                        <td style="padding: 5px 0; text-transform: capitalize;">{{order_type}}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 5px 0; font-weight: 600;">Date & Time:</td>
                                        <td style="padding: 5px 0;">{{order_date}} at {{order_time}}</td>
                                    </tr>
                                    <tr>
                                        <td style="padding: 5px 0; font-weight: 600;">Payment Method:</td>
                                        <td style="padding: 5px 0; text-transform: capitalize;">{{payment_method}}</td>
                                    </tr>
                                </table>
                            </div>
                            
                            <!-- Items -->
                            <div style="margin: 25px 0;">
                                <h3 style="color: #333; font-size: 18px; margin-bottom: 15px;">Your Order</h3>
                                <table style="width: 100%; border-collapse: collapse;">
                                    <thead>
                                        <tr style="background-color: #f8f9fa;">
                                            <th style="padding: 12px; text-align: left; font-weight: 600; border-bottom: 2px solid #dee2e6;">Item</th>
                                            <th style="padding: 12px; text-align: center; font-weight: 600; border-bottom: 2px solid #dee2e6;">Qty</th>
                                            <th style="padding: 12px; text-align: right; font-weight: 600; border-bottom: 2px solid #dee2e6;">Price</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {{#each items}}
                                        <tr>
                                            <td style="padding: 12px; border-bottom: 1px solid #dee2e6;">
                                                <div style="font-weight: 600;">{{name}}</div>
                                            </td>
                                            <td style="padding: 12px; text-align: center; border-bottom: 1px solid #dee2e6;">{{quantity}}</td>
                                            <td style="padding: 12px; text-align: right; border-bottom: 1px solid #dee2e6; font-weight: 600;">{{price}}</td>
                                        </tr>
                                        {{/each}}
                                    </tbody>
                                    <tfoot>
                                        <tr>
                                            <td colspan="2" style="padding: 15px 12px; text-align: right; font-size: 18px; font-weight: 700; border-top: 2px solid #667eea;">Total:</td>
                                            <td style="padding: 15px 12px; text-align: right; font-size: 18px; font-weight: 700; color: #667eea; border-top: 2px solid #667eea;">{{total}}</td>
                                        </tr>
                                    </tfoot>
                                </table>
                            </div>
                            
                            <div style="text-align: center; margin: 30px 0;">
                                <p style="font-size: 16px; color: #666;">
                                    Estimated {{order_type}} time: <strong>{{estimated_time}} minutes</strong>
                                </p>
                            </div>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #f8f9fa; padding: 30px; text-align: center; border-top: 1px solid #dee2e6;">
                            <h4 style="color: #333; margin-top: 0; font-size: 16px;">{{restaurant_name}}</h4>
                            <p style="color: #666; font-size: 14px; margin: 5px 0;">
                                {{restaurant_address}}<br>
                                Phone: {{restaurant_phone}}<br>
                                Email: {{restaurant_email}}
                            </p>
                            <p style="color: #999; font-size: 12px; margin-top: 20px;">
                                Thank you for choosing {{restaurant_name}}. We appreciate your business!
                            </p>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`,
    text_content: `
Order Confirmation #{{order_number}} - {{restaurant_name}}

Dear {{customer_name}},

Thank you for choosing {{restaurant_name}}! Your order has been received and is being prepared.

Order Details:
- Order #: {{order_number}}
- Order Type: {{order_type}}
- Date & Time: {{order_date}} at {{order_time}}
- Payment Method: {{payment_method}}

Your Order:
{{#each items}}
- {{quantity}}x {{name}} - {{price}}
{{/each}}

Total: {{total}}

Estimated {{order_type}} time: {{estimated_time}} minutes

{{restaurant_name}}
{{restaurant_address}}
Phone: {{restaurant_phone}}
Email: {{restaurant_email}}

Thank you for your business!
    `,
    variables: JSON.stringify({
      order_number: "ORD-2024-001",
      customer_name: "John Smith",
      restaurant_name: "Bella Vista Restaurant",
      order_type: "delivery",
      order_date: "July 18, 2024",
      order_time: "7:30 PM",
      payment_method: "credit card",
      total: "$45.90",
      estimated_time: "35-40",
      items: [
        { name: "Margherita Pizza", quantity: 1, price: "$18.99" },
        { name: "Caesar Salad", quantity: 1, price: "$12.99" },
        { name: "Garlic Bread", quantity: 2, price: "$6.99" },
        { name: "Delivery Fee", quantity: 1, price: "$3.99" },
        { name: "Tax", quantity: 1, price: "$2.94" }
      ],
      restaurant_address: "456 Oak Avenue, New York, NY 10002",
      restaurant_phone: "(555) 123-4567",
      restaurant_email: "info@bellavista.com"
    }),
    is_active: true
  },

  // Template 2: Modern Minimalist
  {
    id: 'modern-minimalist-confirmation',
    tenant_id: 'default',
    template_type: 'order_confirmation',
    name: 'Modern Minimalist',
    subject: '✓ Order Confirmed - {{restaurant_name}}',
    html_content: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Order Confirmed</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; line-height: 1.6; color: #2c3e50; background-color: #ecf0f1;">
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background-color: #ecf0f1; padding: 40px 0;">
        <tr>
            <td align="center">
                <table cellpadding="0" cellspacing="0" border="0" width="600" style="background-color: #ffffff; border-radius: 2px; box-shadow: 0 2px 10px rgba(0,0,0,0.1);">
                    
                    <!-- Header -->
                    <tr>
                        <td style="padding: 50px 40px 30px 40px; text-align: center; border-bottom: 1px solid #ecf0f1;">
                            <div style="width: 60px; height: 60px; background-color: #27ae60; border-radius: 50%; margin: 0 auto 20px; display: flex; align-items: center; justify-content: center;">
                                <span style="color: white; font-size: 24px; font-weight: bold;">✓</span>
                            </div>
                            <h1 style="color: #2c3e50; margin: 0; font-size: 24px; font-weight: 300;">
                                Order Confirmed
                            </h1>
                            <p style="color: #7f8c8d; margin: 10px 0 0 0; font-size: 16px;">
                                {{restaurant_name}}
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px;">
                            <div style="text-align: center; margin-bottom: 30px;">
                                <span style="background-color: #ecf0f1; padding: 8px 16px; border-radius: 20px; font-size: 14px; font-weight: 600; color: #2c3e50;">
                                    #{{order_number}}
                                </span>
                            </div>
                            
                            <p style="font-size: 16px; margin-bottom: 30px; text-align: center;">
                                Hi {{customer_name}}, your order is confirmed and we're preparing it now.
                            </p>
                            
                            <!-- Order Summary -->
                            <div style="background-color: #f8f9fa; padding: 25px; border-radius: 4px; margin: 30px 0;">
                                <div style="display: flex; justify-content: space-between; margin-bottom: 15px;">
                                    <span style="font-weight: 600; color: #2c3e50;">Order Type</span>
                                    <span style="color: #7f8c8d; text-transform: capitalize;">{{order_type}}</span>
                                </div>
                                <div style="display: flex; justify-content: space-between; margin-bottom: 15px;">
                                    <span style="font-weight: 600; color: #2c3e50;">Date</span>
                                    <span style="color: #7f8c8d;">{{order_date}}</span>
                                </div>
                                <div style="display: flex; justify-content: space-between; margin-bottom: 15px;">
                                    <span style="font-weight: 600; color: #2c3e50;">Time</span>
                                    <span style="color: #7f8c8d;">{{order_time}}</span>
                                </div>
                                <div style="display: flex; justify-content: space-between; margin-bottom: 0;">
                                    <span style="font-weight: 600; color: #2c3e50;">Ready in</span>
                                    <span style="color: #27ae60; font-weight: 600;">{{estimated_time}} min</span>
                                </div>
                            </div>
                            
                            <!-- Items -->
                            <div style="margin: 30px 0;">
                                {{#each items}}
                                <div style="display: flex; justify-content: space-between; align-items: center; padding: 15px 0; border-bottom: 1px solid #ecf0f1;">
                                    <div style="flex: 1;">
                                        <div style="font-weight: 600; color: #2c3e50;">{{name}}</div>
                                    </div>
                                    <div style="text-align: right;">
                                        <div style="font-size: 14px; color: #7f8c8d;">{{quantity}}x</div>
                                        <div style="font-weight: 600; color: #2c3e50;">{{price}}</div>
                                    </div>
                                </div>
                                {{/each}}
                                
                                <div style="display: flex; justify-content: space-between; align-items: center; padding: 20px 0; border-top: 2px solid #2c3e50; margin-top: 10px;">
                                    <span style="font-size: 18px; font-weight: 700; color: #2c3e50;">Total</span>
                                    <span style="font-size: 18px; font-weight: 700; color: #27ae60;">{{total}}</span>
                                </div>
                            </div>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background-color: #2c3e50; padding: 30px; text-align: center; color: #ecf0f1;">
                            <div style="font-size: 18px; font-weight: 300; margin-bottom: 10px;">{{restaurant_name}}</div>
                            <div style="font-size: 14px; opacity: 0.8;">
                                {{restaurant_address}}<br>
                                {{restaurant_phone}}
                            </div>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`,
    text_content: `
Order Confirmed - {{restaurant_name}}

Hi {{customer_name}},

Your order #{{order_number}} is confirmed and we're preparing it now.

Order Details:
- Type: {{order_type}}
- Date: {{order_date}} at {{order_time}}
- Ready in: {{estimated_time}} minutes

Items:
{{#each items}}
{{quantity}}x {{name}} - {{price}}
{{/each}}

Total: {{total}}

{{restaurant_name}}
{{restaurant_address}}
{{restaurant_phone}}
    `,
    variables: JSON.stringify({
      order_number: "ORD-2024-002",
      customer_name: "Sarah Johnson",
      restaurant_name: "Urban Bites",
      order_type: "pickup",
      order_date: "July 18, 2024",
      order_time: "6:45 PM",
      total: "$32.50",
      estimated_time: "25",
      items: [
        { name: "Quinoa Buddha Bowl", quantity: 1, price: "$16.99" },
        { name: "Green Smoothie", quantity: 1, price: "$8.99" },
        { name: "Avocado Toast", quantity: 1, price: "$9.99" },
        { name: "Tax", quantity: 1, price: "$2.47" }
      ],
      restaurant_address: "789 Broadway, New York, NY 10003",
      restaurant_phone: "(555) 987-6543"
    }),
    is_active: true
  },

  // Template 3: Colorful & Friendly
  {
    id: 'colorful-friendly-confirmation',
    tenant_id: 'default',
    template_type: 'order_confirmation',
    name: 'Colorful & Friendly',
    subject: '🎉 Your delicious order is on its way! - {{restaurant_name}}',
    html_content: `
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Order Confirmed</title>
</head>
<body style="margin: 0; padding: 0; font-family: 'Arial', sans-serif; line-height: 1.6; color: #2c3e50; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
    <table cellpadding="0" cellspacing="0" border="0" width="100%" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px 0;">
        <tr>
            <td align="center">
                <table cellpadding="0" cellspacing="0" border="0" width="600" style="background-color: #ffffff; border-radius: 15px; box-shadow: 0 8px 25px rgba(0,0,0,0.15); overflow: hidden;">
                    
                    <!-- Header -->
                    <tr>
                        <td style="background: linear-gradient(45deg, #ff6b6b, #4ecdc4); padding: 40px 30px; text-align: center; position: relative;">
                            <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: bold; text-shadow: 2px 2px 4px rgba(0,0,0,0.3);">
                                Woohoo! 🎉
                            </h1>
                            <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 18px; text-shadow: 1px 1px 2px rgba(0,0,0,0.3);">
                                Your order is confirmed!
                            </p>
                        </td>
                    </tr>
                    
                    <!-- Content -->
                    <tr>
                        <td style="padding: 40px 30px;">
                            <div style="text-align: center; margin-bottom: 30px;">
                                <div style="background: linear-gradient(45deg, #ff6b6b, #4ecdc4); color: white; padding: 10px 20px; border-radius: 25px; display: inline-block; font-size: 16px; font-weight: bold; margin-bottom: 20px;">
                                    Order #{{order_number}}
                                </div>
                                <div style="background-color: #45b7d1; color: white; padding: 15px; border-radius: 10px; margin: 20px 0;">
                                    <h2 style="margin: 0; font-size: 22px;">{{restaurant_name}}</h2>
                                </div>
                            </div>
                            
                            <div style="background: linear-gradient(45deg, #ffeaa7, #fab1a0); padding: 20px; border-radius: 15px; margin: 25px 0; text-align: center;">
                                <h3 style="margin: 0 0 10px 0; color: #2d3436; font-size: 20px;">Hey {{customer_name}}! 👋</h3>
                                <p style="margin: 0; color: #2d3436; font-size: 16px;">
                                    Thanks for your order! Our kitchen ninjas are already working on your delicious meal! 🥷👨‍🍳
                                </p>
                            </div>
                            
                            <!-- Items -->
                            <div style="background: linear-gradient(45deg, #fd79a8, #fdcb6e); padding: 25px; border-radius: 15px; margin: 25px 0;">
                                <h3 style="color: #2d3436; margin-top: 0; font-size: 20px; text-align: center;">🛒 Your Goodies</h3>
                                <div style="background-color: rgba(255,255,255,0.8); padding: 15px; border-radius: 10px;">
                                    {{#each items}}
                                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-bottom: 2px dotted #ddd;">
                                        <div style="flex: 1;">
                                            <div style="font-weight: bold; color: #2d3436; font-size: 16px;">{{name}}</div>
                                        </div>
                                        <div style="text-align: right;">
                                            <div style="background-color: #74b9ff; color: white; padding: 4px 8px; border-radius: 10px; font-size: 12px; margin-bottom: 5px;">{{quantity}}x</div>
                                            <div style="font-weight: bold; color: #2d3436; font-size: 16px;">{{price}}</div>
                                        </div>
                                    </div>
                                    {{/each}}
                                    
                                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 20px 0; border-top: 3px solid #00b894; margin-top: 15px;">
                                        <span style="font-size: 20px; font-weight: bold; color: #2d3436;">💰 Total:</span>
                                        <span style="font-size: 24px; font-weight: bold; color: #00b894;">{{total}}</span>
                                    </div>
                                </div>
                            </div>
                            
                            <div style="background: linear-gradient(45deg, #81ecec, #74b9ff); padding: 20px; border-radius: 15px; text-align: center; margin-top: 30px;">
                                <p style="color: #2d3436; margin: 0; font-size: 16px;">
                                    🌟 We can't wait for you to taste your order! 🌟<br>
                                    Ready in {{estimated_time}} minutes!
                                </p>
                            </div>
                        </td>
                    </tr>
                    
                    <!-- Footer -->
                    <tr>
                        <td style="background: linear-gradient(45deg, #2d3436, #636e72); padding: 30px; text-align: center; color: #ffffff;">
                            <div style="font-size: 22px; font-weight: bold; margin-bottom: 10px;">🏪 {{restaurant_name}}</div>
                            <div style="font-size: 14px; opacity: 0.9;">
                                📍 {{restaurant_address}}<br>
                                📞 {{restaurant_phone}}
                            </div>
                            <div style="margin-top: 15px; font-size: 14px; opacity: 0.8;">
                                Thanks for being awesome! 🙏❤️
                            </div>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
</body>
</html>`,
    text_content: `
🎉 Your delicious order is on its way! - {{restaurant_name}}

Hey {{customer_name}}! 👋

Woohoo! Your order #{{order_number}} is confirmed!

Thanks for your order! Our kitchen ninjas are already working on your delicious meal!

Order Details:
- Type: {{order_type}}
- Date: {{order_date}} at {{order_time}}
- Ready in: {{estimated_time}} minutes

Your Goodies:
{{#each items}}
{{quantity}}x {{name}} - {{price}}
{{/each}}

Total: {{total}}

{{restaurant_name}}
{{restaurant_address}}
{{restaurant_phone}}

Thanks for being awesome! 🙏❤️
    `,
    variables: JSON.stringify({
      order_number: "ORD-2024-003",
      customer_name: "Mike Chen",
      restaurant_name: "Tasty Bites Café",
      order_type: "delivery",
      order_date: "July 18, 2024",
      order_time: "8:15 PM",
      total: "$54.85",
      estimated_time: "45",
      items: [
        { name: "BBQ Bacon Burger", quantity: 2, price: "$15.99" },
        { name: "Loaded Nachos", quantity: 1, price: "$12.99" },
        { name: "Chocolate Milkshake", quantity: 1, price: "$6.99" },
        { name: "Onion Rings", quantity: 1, price: "$7.99" },
        { name: "Delivery Fee", quantity: 1, price: "$4.99" },
        { name: "Tax", quantity: 1, price: "$4.38" },
        { name: "Tip", quantity: 1, price: "$8.51" }
      ],
      restaurant_address: "321 Pizza Lane, Brooklyn, NY 11201",
      restaurant_phone: "(555) 456-7890"
    }),
    is_active: true
  }
];

// Function to insert templates into database
export async function insertProfessionalTemplates() {
  const Database = (await import('@/lib/db')).default;
  
  try {
    for (const template of professionalEmailTemplates) {
      await Database.execute(`
        INSERT INTO email_templates (
          id, tenant_id, template_type, name, subject, html_content, text_content, variables, is_active, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())
        ON DUPLICATE KEY UPDATE
          name = VALUES(name),
          subject = VALUES(subject),
          html_content = VALUES(html_content),
          text_content = VALUES(text_content),
          variables = VALUES(variables),
          is_active = VALUES(is_active),
          updated_at = NOW()
      `, [
        template.id,
        template.tenant_id,
        template.template_type,
        template.name,
        template.subject,
        template.html_content,
        template.text_content,
        template.variables,
        template.is_active
      ]);
    }
    
    console.log('✅ Professional email templates inserted successfully!');
    return true;
  } catch (error) {
    console.error('❌ Error inserting professional templates:', error);
    return false;
  }
}

// Function to get template preview data
export function getTemplatePreview(templateId: string) {
  const template = professionalEmailTemplates.find(t => t.id === templateId);
  if (!template) return null;
  
  return {
    name: template.name,
    subject: template.subject,
    preview_data: JSON.parse(template.variables),
    html_content: template.html_content,
    text_content: template.text_content
  };
}
