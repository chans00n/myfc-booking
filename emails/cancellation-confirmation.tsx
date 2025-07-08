import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import * as React from "react";

interface CancellationConfirmationEmailProps {
  clientName: string;
  appointmentDate: string;
  appointmentTime: string;
  serviceName: string;
  cancellationReason?: string;
  refundAmount?: number;
}

export const CancellationConfirmationEmail = ({
  clientName,
  appointmentDate,
  appointmentTime,
  serviceName,
  cancellationReason,
  refundAmount,
}: CancellationConfirmationEmailProps) => {
  const previewText = `Your ${serviceName} appointment has been cancelled`;

  return (
    <Html>
      <Head />
      <Preview>{previewText}</Preview>
      <Body style={main}>
        <Container style={container}>
          <Heading style={h1}>Appointment Cancelled</Heading>

          <Text style={text}>Hi {clientName},</Text>

          <Text style={text}>Your appointment has been successfully cancelled.</Text>

          <Section style={appointmentDetails}>
            <Heading as="h2" style={h2}>
              Cancelled Appointment Details
            </Heading>

            <Text style={detailRow}>
              <strong>Service:</strong> {serviceName}
            </Text>

            <Text style={detailRow}>
              <strong>Original Date:</strong> {appointmentDate}
            </Text>

            <Text style={detailRow}>
              <strong>Original Time:</strong> {appointmentTime}
            </Text>

            {cancellationReason && (
              <Text style={detailRow}>
                <strong>Reason:</strong> {cancellationReason}
              </Text>
            )}
          </Section>

          {refundAmount && refundAmount > 0 && (
            <Section style={refundSection}>
              <Heading as="h2" style={h2}>
                Refund Information
              </Heading>
              <Text style={text}>
                A refund of ${refundAmount.toFixed(2)} will be processed to your original payment
                method within 5-10 business days.
              </Text>
            </Section>
          )}

          <Section style={ctaSection}>
            <Text style={text}>Would you like to book a new appointment?</Text>
            <Button style={button} href={`${process.env.NEXT_PUBLIC_APP_URL}/booking`}>
              Book New Appointment
            </Button>
          </Section>

          <Hr style={hr} />

          <Text style={footer}>
            If you have any questions about this cancellation, please don't hesitate to contact us.
          </Text>

          <Text style={footer}>We hope to see you again soon!</Text>
        </Container>
      </Body>
    </Html>
  );
};

export default CancellationConfirmationEmail;

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

const h1 = {
  color: "#333",
  fontSize: "24px",
  fontWeight: "600",
  lineHeight: "24px",
  margin: "0 0 20px",
};

const h2 = {
  color: "#333",
  fontSize: "20px",
  fontWeight: "600",
  lineHeight: "24px",
  margin: "0 0 16px",
};

const text = {
  color: "#333",
  fontSize: "16px",
  lineHeight: "24px",
  margin: "0 0 16px",
};

const appointmentDetails = {
  backgroundColor: "#f4f4f5",
  borderRadius: "8px",
  padding: "24px",
  margin: "24px 0",
};

const detailRow = {
  color: "#333",
  fontSize: "16px",
  lineHeight: "24px",
  margin: "0 0 8px",
};

const refundSection = {
  backgroundColor: "#f0fdf4",
  borderRadius: "8px",
  padding: "20px",
  margin: "24px 0",
  border: "1px solid #bbf7d0",
};

const ctaSection = {
  margin: "32px 0",
  textAlign: "center" as const,
};

const button = {
  backgroundColor: "#000",
  borderRadius: "8px",
  color: "#fff",
  fontSize: "16px",
  fontWeight: "600",
  textDecoration: "none",
  textAlign: "center" as const,
  display: "inline-block",
  padding: "12px 24px",
};

const hr = {
  borderColor: "#e6e6e6",
  margin: "42px 0 26px",
};

const footer = {
  color: "#666",
  fontSize: "14px",
  lineHeight: "20px",
  margin: "0 0 8px",
};
