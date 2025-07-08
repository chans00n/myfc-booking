import { NextRequest, NextResponse } from "next/server";
import {
  sendConsultationConfirmation,
  sendConsultationReminder,
  sendConsultationFollowup,
} from "@/lib/notifications/email-service";
import { format } from "date-fns";
import { generateConsultationRoomUrl } from "@/lib/consultations/urls";

export async function POST(request: NextRequest) {
  try {
    const { type, email } = await request.json();

    if (!type || !email) {
      return NextResponse.json({ error: "Missing required parameters" }, { status: 400 });
    }

    const testData = {
      clientName: "Test Client",
      therapistName: process.env.THERAPIST_NAME || "Zionna Hanson",
      businessName: process.env.BUSINESS_NAME || "MYFC",
      logoUrl: process.env.LOGO_URL,
    };

    let result;
    const testDate = new Date();
    testDate.setDate(testDate.getDate() + 1); // Tomorrow

    switch (type) {
      case "confirmation":
        result = await sendConsultationConfirmation({
          to: email,
          clientName: testData.clientName,
          consultationType: "video",
          consultationDate: testDate,
          consultationTime: "2:00 PM - 2:30 PM",
          duration: 30,
          roomUrl: generateConsultationRoomUrl("test"),
          phoneNumber: "(555) 123-4567",
          therapistName: testData.therapistName,
          businessName: testData.businessName,
          logoUrl: testData.logoUrl,
        });
        break;

      case "24hour":
        result = await sendConsultationReminder({
          to: email,
          clientName: testData.clientName,
          consultationType: "video",
          consultationDate: testDate,
          consultationTime: "2:00 PM - 2:30 PM",
          duration: 30,
          reminderType: "24hour",
          roomUrl: generateConsultationRoomUrl("test"),
          phoneNumber: "(555) 123-4567",
          therapistName: testData.therapistName,
          businessName: testData.businessName,
          logoUrl: testData.logoUrl,
        });
        break;

      case "1hour":
        result = await sendConsultationReminder({
          to: email,
          clientName: testData.clientName,
          consultationType: "phone",
          consultationDate: testDate,
          consultationTime: "2:00 PM - 2:30 PM",
          duration: 30,
          reminderType: "1hour",
          phoneNumber: "(555) 123-4567",
          therapistName: testData.therapistName,
          businessName: testData.businessName,
          logoUrl: testData.logoUrl,
        });
        break;

      case "15min":
        result = await sendConsultationReminder({
          to: email,
          clientName: testData.clientName,
          consultationType: "video",
          consultationDate: testDate,
          consultationTime: "2:00 PM - 2:30 PM",
          duration: 30,
          reminderType: "15min",
          roomUrl: generateConsultationRoomUrl("test"),
          therapistName: testData.therapistName,
          businessName: testData.businessName,
          logoUrl: testData.logoUrl,
        });
        break;

      case "followup":
        result = await sendConsultationFollowup({
          to: email,
          clientName: testData.clientName,
          consultationType: "video",
          therapistName: testData.therapistName,
          businessName: testData.businessName,
          bookingUrl: `${process.env.NEXT_PUBLIC_APP_URL}/booking`,
          specialOfferTitle: "First Visit Special - 20% Off",
          specialOfferDescription:
            "Save 20% on your first massage appointment when you book within 7 days!",
          specialOfferCode: "CONSULT20",
          logoUrl: testData.logoUrl,
        });
        break;

      default:
        return NextResponse.json({ error: "Invalid notification type" }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: `Test ${type} email sent to ${email}`,
      result,
    });
  } catch (error) {
    console.error("Error sending test email:", error);
    return NextResponse.json({ error: "Failed to send test email" }, { status: 500 });
  }
}

// Test page HTML
export async function GET() {
  const html = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Consultation Notification Test</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
          max-width: 600px;
          margin: 50px auto;
          padding: 20px;
        }
        h1 {
          color: #333;
        }
        .form-group {
          margin-bottom: 20px;
        }
        label {
          display: block;
          margin-bottom: 5px;
          font-weight: 600;
        }
        input, select {
          width: 100%;
          padding: 10px;
          border: 1px solid #ddd;
          border-radius: 4px;
          font-size: 16px;
        }
        button {
          background-color: #000;
          color: white;
          padding: 10px 20px;
          border: none;
          border-radius: 4px;
          font-size: 16px;
          cursor: pointer;
          width: 100%;
        }
        button:hover {
          background-color: #333;
        }
        .message {
          margin-top: 20px;
          padding: 10px;
          border-radius: 4px;
        }
        .success {
          background-color: #d4edda;
          color: #155724;
          border: 1px solid #c3e6cb;
        }
        .error {
          background-color: #f8d7da;
          color: #721c24;
          border: 1px solid #f5c6cb;
        }
      </style>
    </head>
    <body>
      <h1>Consultation Notification Test</h1>
      <form id="testForm">
        <div class="form-group">
          <label for="email">Email Address</label>
          <input type="email" id="email" name="email" required placeholder="test@example.com">
        </div>
        
        <div class="form-group">
          <label for="type">Notification Type</label>
          <select id="type" name="type" required>
            <option value="">Select a notification type</option>
            <option value="confirmation">Consultation Confirmation</option>
            <option value="24hour">24-Hour Reminder</option>
            <option value="1hour">1-Hour Reminder</option>
            <option value="15min">15-Minute Reminder</option>
            <option value="followup">Post-Consultation Follow-up</option>
          </select>
        </div>
        
        <button type="submit">Send Test Email</button>
      </form>
      
      <div id="message"></div>
      
      <script>
        document.getElementById('testForm').addEventListener('submit', async (e) => {
          e.preventDefault();
          
          const email = document.getElementById('email').value;
          const type = document.getElementById('type').value;
          const messageDiv = document.getElementById('message');
          
          messageDiv.innerHTML = 'Sending...';
          messageDiv.className = 'message';
          
          try {
            const response = await fetch('/api/notifications/consultation/test', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({ email, type }),
            });
            
            const data = await response.json();
            
            if (response.ok) {
              messageDiv.innerHTML = data.message || 'Test email sent successfully!';
              messageDiv.className = 'message success';
            } else {
              messageDiv.innerHTML = data.error || 'Failed to send test email';
              messageDiv.className = 'message error';
            }
          } catch (error) {
            messageDiv.innerHTML = 'Error: ' + error.message;
            messageDiv.className = 'message error';
          }
        });
      </script>
    </body>
    </html>
  `;

  return new Response(html, {
    headers: { "Content-Type": "text/html" },
  });
}
