import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

interface ConsultationReminderEmailProps {
  clientName: string;
  consultationType: "video" | "phone";
  consultationDate: string;
  consultationTime: string;
  duration: number;
  reminderType: "24hour" | "1hour" | "15min";
  roomUrl?: string;
  phoneNumber?: string;
  therapistName: string;
  businessName: string;
  logoUrl?: string;
}

export const ConsultationReminderEmail: React.FC<ConsultationReminderEmailProps> = ({
  clientName,
  consultationType,
  consultationDate,
  consultationTime,
  duration,
  reminderType,
  roomUrl,
  phoneNumber,
  therapistName,
  businessName,
  logoUrl,
}) => {
  const getReminderTitle = () => {
    switch (reminderType) {
      case "24hour":
        return "Your consultation is tomorrow";
      case "1hour":
        return "Your consultation starts in 1 hour";
      case "15min":
        return "Your consultation starts in 15 minutes";
      default:
        return "Consultation reminder";
    }
  };

  const getUrgencyStyle = () => {
    if (reminderType === "15min") {
      return {
        backgroundColor: "#ff4444",
        color: "#ffffff",
      };
    }
    if (reminderType === "1hour") {
      return {
        backgroundColor: "#ff8800",
        color: "#ffffff",
      };
    }
    return {
      backgroundColor: "#0066cc",
      color: "#ffffff",
    };
  };

  const previewText = getReminderTitle();

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          {logoUrl && <Img src={logoUrl} width="150" height="50" alt={businessName} style={logo} />}

          <Section style={{ ...urgencyBanner, ...getUrgencyStyle() }}>
            <Heading style={urgencyHeading}>{getReminderTitle()}</Heading>
          </Section>

          <Text style={text}>Hi {clientName},</Text>

          {reminderType === "24hour" && (
            <Text style={text}>
              This is a friendly reminder about your free {consultationType} consultation with{" "}
              {therapistName} tomorrow.
            </Text>
          )}

          {reminderType === "1hour" && (
            <Text style={text}>
              Your free {consultationType} consultation with {therapistName} is coming up soon!
              Please make sure you're ready to{" "}
              {consultationType === "video" ? "join the video call" : "receive our call"}.
            </Text>
          )}

          {reminderType === "15min" && (
            <Text style={urgentText}>
              Your consultation starts in just 15 minutes!
              {consultationType === "video"
                ? " Click the button below to join now."
                : " We'll be calling you shortly."}
            </Text>
          )}

          <Section style={appointmentBox}>
            <Heading as="h2" style={h2}>
              Consultation Details
            </Heading>

            <Text style={appointmentDetail}>
              <strong>Type:</strong>{" "}
              {consultationType === "video" ? "Video Consultation" : "Phone Consultation"}
            </Text>
            <Text style={appointmentDetail}>
              <strong>Date:</strong> {consultationDate}
            </Text>
            <Text style={appointmentDetail}>
              <strong>Time:</strong> {consultationTime}
            </Text>
            <Text style={appointmentDetail}>
              <strong>Duration:</strong> {duration} minutes
            </Text>
          </Section>

          {consultationType === "video" && roomUrl && (
            <Section style={joinSection}>
              {reminderType !== "24hour" && (
                <>
                  <Button style={{ ...button, ...getUrgencyStyle() }} href={roomUrl}>
                    Join Video Consultation Now
                  </Button>

                  <Text style={smallText}>
                    Video link:{" "}
                    <Link href={roomUrl} style={link}>
                      {roomUrl}
                    </Link>
                  </Text>
                </>
              )}

              {reminderType === "1hour" && (
                <Text style={text}>
                  <strong>Quick checklist:</strong>
                </Text>
              )}

              {(reminderType === "24hour" || reminderType === "1hour") && (
                <ul style={list}>
                  <li>Test your camera and microphone</li>
                  <li>Find a quiet, private space</li>
                  <li>Have any questions ready</li>
                  <li>Join 2-3 minutes early</li>
                </ul>
              )}
            </Section>
          )}

          {consultationType === "phone" && phoneNumber && (
            <Section style={joinSection}>
              <Text style={appointmentDetail}>
                <strong>We'll call you at:</strong> {phoneNumber}
              </Text>

              {reminderType === "15min" && (
                <Text style={urgentText}>
                  Please ensure your phone is available and you're in a quiet space.
                </Text>
              )}

              {reminderType === "1hour" && (
                <Text style={text}>
                  Please make sure your phone is charged and you're in a quiet space when we call.
                </Text>
              )}
            </Section>
          )}

          {reminderType === "24hour" && (
            <Section>
              <Heading as="h2" style={h2}>
                Prepare for Tomorrow
              </Heading>

              <Text style={text}>To make the most of your consultation, please have ready:</Text>

              <ul style={list}>
                <li>List of any current pain or discomfort</li>
                <li>Your health history and medications</li>
                <li>Questions about massage therapy</li>
                <li>Your schedule for potential appointments</li>
              </ul>
            </Section>
          )}

          <Hr style={hr} />

          <Text style={text}>
            Need to reschedule? Please let us know as soon as possible by replying to this email.
          </Text>

          <Text style={text}>
            Looking forward to speaking with you{reminderType === "24hour" ? " tomorrow" : " soon"}!
          </Text>

          <Text style={text}>
            Best regards,
            <br />
            {therapistName}
            <br />
            {businessName}
          </Text>
        </Container>
      </Body>
    </Html>
  );
};

export default ConsultationReminderEmail;

const main = {
  backgroundColor: "#ffffff",
  fontFamily:
    '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Oxygen-Sans,Ubuntu,Cantarell,"Helvetica Neue",sans-serif',
};

const container = {
  margin: "0 auto",
  padding: "20px 0 48px",
  maxWidth: "560px",
};

const logo = {
  margin: "0 auto 32px",
  display: "block",
};

const urgencyBanner = {
  borderRadius: "8px",
  padding: "16px",
  marginBottom: "24px",
  textAlign: "center" as const,
};

const urgencyHeading = {
  margin: "0",
  fontSize: "20px",
  fontWeight: "600",
  color: "inherit",
};

const h1 = {
  color: "#333",
  fontSize: "24px",
  fontWeight: "600",
  lineHeight: "32px",
  margin: "0 0 24px",
  textAlign: "center" as const,
};

const h2 = {
  color: "#333",
  fontSize: "20px",
  fontWeight: "600",
  lineHeight: "28px",
  margin: "0 0 16px",
};

const text = {
  color: "#555",
  fontSize: "16px",
  lineHeight: "24px",
  margin: "0 0 16px",
};

const urgentText = {
  color: "#d32f2f",
  fontSize: "16px",
  lineHeight: "24px",
  margin: "0 0 16px",
  fontWeight: "600",
};

const smallText = {
  color: "#666",
  fontSize: "14px",
  lineHeight: "20px",
  margin: "8px 0",
};

const appointmentBox = {
  backgroundColor: "#f8f9fa",
  borderRadius: "8px",
  padding: "24px",
  marginBottom: "24px",
};

const appointmentDetail = {
  color: "#333",
  fontSize: "16px",
  lineHeight: "24px",
  margin: "8px 0",
};

const joinSection = {
  marginBottom: "32px",
};

const button = {
  backgroundColor: "#000",
  borderRadius: "8px",
  color: "#fff",
  display: "inline-block",
  fontSize: "16px",
  fontWeight: "600",
  lineHeight: "48px",
  padding: "0 24px",
  textAlign: "center" as const,
  textDecoration: "none",
  margin: "16px 0",
};

const link = {
  color: "#0066cc",
  textDecoration: "underline",
};

const list = {
  marginLeft: "20px",
  marginBottom: "16px",
  color: "#555",
};

const hr = {
  borderColor: "#e8eaed",
  margin: "32px 0",
};
