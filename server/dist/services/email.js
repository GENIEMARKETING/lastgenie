"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendVerificationEmail = sendVerificationEmail;
exports.sendOrderConfirmationEmail = sendOrderConfirmationEmail;
exports.sendShippingNotificationEmail = sendShippingNotificationEmail;
exports.isEmailServiceConfigured = isEmailServiceConfigured;
const nodemailer_1 = __importDefault(require("nodemailer"));
const transporter = nodemailer_1.default.createTransport({
    // Use environment variables for SMTP config
    // For development, can use console.log or test account
    // For production, use real SMTP (Gmail, SendGrid, AWS SES, etc.)
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: Number(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
    },
});
async function sendVerificationEmail(email, firstName, verificationToken) {
    // Point to backend API endpoint which will verify and redirect to frontend
    const apiUrl = process.env.API_URL || `http://localhost:${process.env.PORT || 3001}`;
    const verificationUrl = `${apiUrl}/api/auth/verify-email?token=${verificationToken}`;
    const mailOptions = {
        from: process.env.SMTP_FROM || 'noreply@lastgenie.com',
        to: email,
        subject: 'Verify your Genie account',
        html: `
      <h1>Welcome to Genie, ${firstName}!</h1>
      <p>Please verify your email address by clicking the link below:</p>
      <a href="${verificationUrl}">Verify Email</a>
      <p>This link will expire in 24 hours.</p>
      <p>If you didn't create an account, please ignore this email.</p>
    `,
    };
    // In development, log the URL instead of sending
    if (process.env.NODE_ENV === 'development') {
        console.log('Verification email (dev mode):', verificationUrl);
        return;
    }
    await transporter.sendMail(mailOptions);
}
async function sendOrderConfirmationEmail(orderDetails) {
    const mailOptions = {
        from: process.env.SMTP_FROM || 'noreply@lastgenie.com',
        to: orderDetails.customerEmail,
        subject: `Order Confirmation - ${orderDetails.orderNumber}`,
        html: generateOrderConfirmationHTML(orderDetails),
    };
    // In development, log the email content instead of sending
    if (process.env.NODE_ENV === 'development' || !isEmailConfigured) {
        console.log('Order confirmation email (dev mode):', {
            to: orderDetails.customerEmail,
            subject: mailOptions.subject,
            orderNumber: orderDetails.orderNumber,
            total: orderDetails.total
        });
        return;
    }
    try {
        await transporter.sendMail(mailOptions);
        console.log('Order confirmation email sent:', orderDetails.orderNumber);
    }
    catch (error) {
        console.error('Failed to send order confirmation email:', error);
        throw error;
    }
}
async function sendShippingNotificationEmail(customerEmail, customerName, orderNumber, trackingNumber, carrier) {
    const trackingUrl = getTrackingUrl(carrier, trackingNumber);
    const mailOptions = {
        from: process.env.SMTP_FROM || 'noreply@lastgenie.com',
        to: customerEmail,
        subject: `Your order has shipped - ${orderNumber}`,
        html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #333;">Your Order Has Shipped!</h1>
        <p>Hi ${customerName},</p>
        <p>Great news! Your order <strong>${orderNumber}</strong> has been shipped and is on its way to you.</p>
        
        <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Tracking Information</h3>
          <p><strong>Carrier:</strong> ${carrier}</p>
          <p><strong>Tracking Number:</strong> ${trackingNumber}</p>
          ${trackingUrl ? `<p><a href="${trackingUrl}" style="color: #007bff;">Track Your Package</a></p>` : ''}
        </div>
        
        <p>You should receive your order within 2-7 business days depending on your shipping method.</p>
        <p>If you have any questions, please don't hesitate to contact us.</p>
        
        <p>Thank you for choosing Genie!</p>
        <p>The Genie Team</p>
      </div>
    `,
    };
    // In development, log the email content instead of sending
    if (process.env.NODE_ENV === 'development' || !isEmailConfigured) {
        console.log('Shipping notification email (dev mode):', {
            to: customerEmail,
            orderNumber,
            trackingNumber,
            carrier
        });
        return;
    }
    try {
        await transporter.sendMail(mailOptions);
        console.log('Shipping notification email sent:', orderNumber);
    }
    catch (error) {
        console.error('Failed to send shipping notification email:', error);
        throw error;
    }
}
function generateOrderConfirmationHTML(order) {
    const itemsHTML = order.items.map(item => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.name}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">$${item.price.toFixed(2)}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">$${item.total.toFixed(2)}</td>
    </tr>
  `).join('');
    return `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #333;">Order Confirmation</h1>
      <p>Hi ${order.customerName},</p>
      <p>Thank you for your order! We've received your payment and are preparing your items for shipment.</p>
      
      <div style="background-color: #f8f9fa; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <h3 style="margin-top: 0;">Order Details</h3>
        <p><strong>Order Number:</strong> ${order.orderNumber}</p>
        <p><strong>Order Date:</strong> ${new Date().toLocaleDateString()}</p>
      </div>
      
      <h3>Items Ordered</h3>
      <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <thead>
          <tr style="background-color: #f8f9fa;">
            <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">Item</th>
            <th style="padding: 10px; text-align: center; border-bottom: 2px solid #ddd;">Qty</th>
            <th style="padding: 10px; text-align: right; border-bottom: 2px solid #ddd;">Price</th>
            <th style="padding: 10px; text-align: right; border-bottom: 2px solid #ddd;">Total</th>
          </tr>
        </thead>
        <tbody>
          ${itemsHTML}
        </tbody>
      </table>
      
      <div style="text-align: right; margin: 20px 0;">
        <p><strong>Subtotal: $${order.subtotal.toFixed(2)}</strong></p>
        <p><strong>Shipping: $${order.shipping.toFixed(2)}</strong></p>
        <p><strong>Tax: $${order.tax.toFixed(2)}</strong></p>
        <p style="font-size: 18px; color: #333;"><strong>Total: $${order.total.toFixed(2)}</strong></p>
      </div>
      
      <h3>Shipping Address</h3>
      <div style="background-color: #f8f9fa; padding: 15px; border-radius: 8px;">
        <p style="margin: 0;">
          ${order.shippingAddress.street1}<br>
          ${order.shippingAddress.street2 ? order.shippingAddress.street2 + '<br>' : ''}
          ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zipCode}
        </p>
      </div>
      
      <p style="margin-top: 30px;">We'll send you a shipping confirmation email with tracking information once your order ships.</p>
      <p>If you have any questions about your order, please contact us.</p>
      
      <p>Thank you for choosing Genie!</p>
      <p>The Genie Team</p>
    </div>
  `;
}
function getTrackingUrl(carrier, trackingNumber) {
    const carrierLower = carrier.toLowerCase();
    if (carrierLower.includes('usps')) {
        return `https://tools.usps.com/go/TrackConfirmAction?qtc_tLabels1=${trackingNumber}`;
    }
    else if (carrierLower.includes('ups')) {
        return `https://www.ups.com/track?tracknum=${trackingNumber}`;
    }
    else if (carrierLower.includes('fedex')) {
        return `https://www.fedex.com/fedextrack/?trknbr=${trackingNumber}`;
    }
    return null;
}
// Check if email service is configured
function isEmailServiceConfigured() {
    return isEmailConfigured;
}
