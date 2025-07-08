import { createClient } from "@/lib/supabase/client";
import type { Payment } from "@/types/payments";

export interface ReceiptData {
  receiptNumber: string;
  paymentDate: string;
  clientName: string;
  clientEmail: string;
  serviceName: string;
  serviceDate: string;
  amount: number;
  paymentMethod: string;
  paymentStatus: string;
  refundedAmount?: number;
}

export async function generateReceiptData(
  paymentId: string
): Promise<{ data?: ReceiptData; error?: string }> {
  try {
    const supabase = createClient();

    // Get payment with related data
    const { data: payment, error } = await supabase
      .from("payments")
      .select(
        `
        *,
        appointment:appointments!payments_appointment_id_fkey(
          *,
          service:services(*),
          client:profiles(*)
        )
      `
      )
      .eq("id", paymentId)
      .single();

    if (error || !payment) {
      return { error: "Payment not found" };
    }

    const receiptData: ReceiptData = {
      receiptNumber: payment.receipt_number || `TEMP-${payment.id.slice(0, 8)}`,
      paymentDate: payment.paid_at || payment.created_at,
      clientName: `${payment.appointment.client.first_name} ${payment.appointment.client.last_name}`,
      clientEmail: payment.appointment.client.email,
      serviceName: payment.appointment.service.name,
      serviceDate: payment.appointment.appointment_date,
      amount: payment.amount_cents / 100,
      paymentMethod: payment.payment_method_type,
      paymentStatus: payment.status,
      refundedAmount:
        payment.refunded_amount_cents > 0 ? payment.refunded_amount_cents / 100 : undefined,
    };

    return { data: receiptData };
  } catch (error) {
    console.error("Error generating receipt data:", error);
    return { error: "Failed to generate receipt" };
  }
}

// HTML receipt template
export function generateReceiptHTML(receipt: ReceiptData): string {
  const businessName = "SOZA Massage Therapy";
  const businessAddress = "123 Wellness Street, Health City, HC 12345";
  const businessPhone = "(555) 123-4567";
  const businessEmail = "info@sozamassage.com";

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>Payment Receipt - ${receipt.receiptNumber}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          line-height: 1.6;
          color: #333;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }
        .header {
          text-align: center;
          border-bottom: 2px solid #22c55e;
          padding-bottom: 20px;
          margin-bottom: 30px;
        }
        .logo {
          font-size: 28px;
          font-weight: bold;
          color: #22c55e;
          margin-bottom: 10px;
        }
        .business-info {
          font-size: 14px;
          color: #666;
        }
        .receipt-title {
          text-align: center;
          font-size: 24px;
          font-weight: bold;
          margin: 30px 0;
        }
        .receipt-details {
          background-color: #f8f9fa;
          padding: 20px;
          border-radius: 8px;
          margin-bottom: 30px;
        }
        .detail-row {
          display: flex;
          justify-content: space-between;
          margin-bottom: 10px;
        }
        .detail-label {
          font-weight: bold;
          color: #555;
        }
        .services-table {
          width: 100%;
          border-collapse: collapse;
          margin: 20px 0;
        }
        .services-table th,
        .services-table td {
          border: 1px solid #ddd;
          padding: 12px;
          text-align: left;
        }
        .services-table th {
          background-color: #22c55e;
          color: white;
          font-weight: bold;
        }
        .total-row {
          font-size: 18px;
          font-weight: bold;
          color: #22c55e;
        }
        .footer {
          text-align: center;
          margin-top: 40px;
          padding-top: 20px;
          border-top: 1px solid #ddd;
          font-size: 14px;
          color: #666;
        }
        .status-badge {
          display: inline-block;
          padding: 4px 12px;
          border-radius: 20px;
          font-size: 14px;
          font-weight: bold;
        }
        .status-paid {
          background-color: #22c55e;
          color: white;
        }
        .status-refunded {
          background-color: #ef4444;
          color: white;
        }
        .status-partial {
          background-color: #f59e0b;
          color: white;
        }
        @media print {
          body {
            padding: 0;
          }
        }
      </style>
    </head>
    <body>
      <div class="header">
        <div class="logo">${businessName}</div>
        <div class="business-info">
          ${businessAddress}<br>
          Phone: ${businessPhone} | Email: ${businessEmail}
        </div>
      </div>

      <h1 class="receipt-title">PAYMENT RECEIPT</h1>

      <div class="receipt-details">
        <div class="detail-row">
          <span class="detail-label">Receipt Number:</span>
          <span>${receipt.receiptNumber}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Payment Date:</span>
          <span>${new Date(receipt.paymentDate).toLocaleDateString("en-US", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Payment Status:</span>
          <span class="status-badge ${
            receipt.paymentStatus === "succeeded"
              ? "status-paid"
              : receipt.paymentStatus === "refunded"
                ? "status-refunded"
                : "status-partial"
          }">
            ${receipt.paymentStatus.toUpperCase()}
          </span>
        </div>
      </div>

      <h2>Client Information</h2>
      <div class="receipt-details">
        <div class="detail-row">
          <span class="detail-label">Name:</span>
          <span>${receipt.clientName}</span>
        </div>
        <div class="detail-row">
          <span class="detail-label">Email:</span>
          <span>${receipt.clientEmail}</span>
        </div>
      </div>

      <h2>Service Details</h2>
      <table class="services-table">
        <thead>
          <tr>
            <th>Service</th>
            <th>Date</th>
            <th>Amount</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>${receipt.serviceName}</td>
            <td>${new Date(receipt.serviceDate).toLocaleDateString("en-US")}</td>
            <td>$${receipt.amount.toFixed(2)}</td>
          </tr>
        </tbody>
        <tfoot>
          ${
            receipt.refundedAmount
              ? `
            <tr>
              <td colspan="2" style="text-align: right;">Subtotal:</td>
              <td>$${receipt.amount.toFixed(2)}</td>
            </tr>
            <tr>
              <td colspan="2" style="text-align: right; color: #ef4444;">Refunded:</td>
              <td style="color: #ef4444;">-$${receipt.refundedAmount.toFixed(2)}</td>
            </tr>
            <tr class="total-row">
              <td colspan="2" style="text-align: right;">Net Amount:</td>
              <td>$${(receipt.amount - receipt.refundedAmount).toFixed(2)}</td>
            </tr>
          `
              : `
            <tr class="total-row">
              <td colspan="2" style="text-align: right;">Total Paid:</td>
              <td>$${receipt.amount.toFixed(2)}</td>
            </tr>
          `
          }
        </tfoot>
      </table>

      <div class="receipt-details">
        <div class="detail-row">
          <span class="detail-label">Payment Method:</span>
          <span>${receipt.paymentMethod.charAt(0).toUpperCase() + receipt.paymentMethod.slice(1)}</span>
        </div>
      </div>

      <div class="footer">
        <p>Thank you for choosing ${businessName}!</p>
        <p style="font-size: 12px;">
          This receipt was generated electronically and is valid without a signature.<br>
          For questions about this receipt, please contact us at ${businessEmail}
        </p>
      </div>
    </body>
    </html>
  `;
}

// Generate PDF receipt (requires additional package like puppeteer or jsPDF)
export async function generateReceiptPDF(
  paymentId: string
): Promise<{ data?: Blob; error?: string }> {
  try {
    const { data: receiptData, error } = await generateReceiptData(paymentId);

    if (error || !receiptData) {
      return { error: error || "Failed to generate receipt data" };
    }

    const html = generateReceiptHTML(receiptData);

    // In a production environment, you would use a service like Puppeteer
    // or a PDF generation API to convert HTML to PDF
    // For now, we'll return the HTML as a blob
    const blob = new Blob([html], { type: "text/html" });

    return { data: blob };
  } catch (error) {
    console.error("Error generating receipt PDF:", error);
    return { error: "Failed to generate receipt PDF" };
  }
}

// Send receipt via email
export async function emailReceipt(
  paymentId: string,
  recipientEmail?: string
): Promise<{ success: boolean; error?: string }> {
  try {
    const { data: receiptData, error } = await generateReceiptData(paymentId);

    if (error || !receiptData) {
      return { success: false, error: error || "Failed to generate receipt data" };
    }

    const html = generateReceiptHTML(receiptData);
    const recipient = recipientEmail || receiptData.clientEmail;

    // In production, integrate with your email service (SendGrid, AWS SES, etc.)
    // For now, we'll just log it
    console.log("Sending receipt to:", recipient);
    console.log("Receipt HTML length:", html.length);

    // Store that we sent the receipt
    const supabase = createClient();
    await supabase.from("payment_events").insert({
      payment_id: paymentId,
      event_type: "receipt.sent",
      event_data: {
        recipient,
        sent_at: new Date().toISOString(),
      },
    });

    return { success: true };
  } catch (error) {
    console.error("Error emailing receipt:", error);
    return { success: false, error: "Failed to email receipt" };
  }
}
