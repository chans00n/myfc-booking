"use client";

import { UseFormReturn } from "react-hook-form";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { InfoIcon } from "lucide-react";
import { DigitalSignature } from "../DigitalSignature";
import type { IntakeFormData } from "@/types/intake-forms";

interface ConsentSectionProps {
  form: UseFormReturn<IntakeFormData>;
}

export function ConsentSection({ form }: ConsentSectionProps) {
  const {
    watch,
    setValue,
    formState: { errors },
  } = form;
  const consentAgreements = watch("consentAgreements");
  const signature = watch("signature");

  const updateConsent = (field: keyof typeof consentAgreements, value: boolean) => {
    setValue("consentAgreements", {
      ...consentAgreements,
      [field]: value,
    });
  };

  const handleSignatureChange = (sig: string | null) => {
    setValue("signature", sig || "");
    if (sig) {
      setValue("signatureDate", new Date().toISOString());
    } else {
      setValue("signatureDate", "");
    }
  };

  return (
    <div className="space-y-6">
      {/* Important Information */}
      <Alert>
        <InfoIcon className="h-4 w-4" />
        <AlertDescription>
          Please read all consent forms carefully. Your signature indicates that you understand and
          agree to the terms outlined below.
        </AlertDescription>
      </Alert>

      {/* Informed Consent */}
      <Card>
        <CardHeader>
          <CardTitle>Informed Consent for Massage Therapy</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="prose prose-sm max-w-none">
            <p className="text-sm text-muted-foreground">
              I understand that massage therapy is provided for stress reduction, relaxation, relief
              from muscle tension, and improvement of circulation and energy flow.
            </p>

            <p className="text-sm text-muted-foreground">
              I understand that massage therapists do not diagnose illness or disease, prescribe
              medications, or perform spinal manipulations. I acknowledge that massage therapy is
              not a substitute for medical examination or diagnosis, and that I should see a
              physician for any physical ailment.
            </p>

            <p className="text-sm text-muted-foreground">
              I have informed my massage therapist of all my known physical conditions, medical
              conditions, and medications, and I will keep the massage therapist updated on any
              changes.
            </p>
          </div>

          <div className="flex items-start space-x-2">
            <Checkbox
              id="informed-consent"
              checked={consentAgreements.informedConsent}
              onCheckedChange={(checked) => updateConsent("informedConsent", !!checked)}
            />
            <Label htmlFor="informed-consent" className="text-sm">
              I have read and agree to the informed consent for massage therapy
            </Label>
          </div>
          {errors.consentAgreements?.informedConsent && (
            <p className="text-sm text-destructive">
              {errors.consentAgreements.informedConsent.message}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Liability Release */}
      <Card>
        <CardHeader>
          <CardTitle>Liability Release</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="prose prose-sm max-w-none">
            <p className="text-sm text-muted-foreground">
              I understand that massage therapy may involve physical touch and manipulation of
              muscles and soft tissues. I acknowledge that there are risks associated with massage
              therapy, including but not limited to, bruising, soreness, and in rare cases, injury.
            </p>

            <p className="text-sm text-muted-foreground">
              I release the massage therapist and the establishment from any and all liability for
              any injuries or damages that may occur as a result of the massage therapy session,
              except in cases of gross negligence or intentional misconduct.
            </p>
          </div>

          <div className="flex items-start space-x-2">
            <Checkbox
              id="liability-release"
              checked={consentAgreements.liabilityRelease}
              onCheckedChange={(checked) => updateConsent("liabilityRelease", !!checked)}
            />
            <Label htmlFor="liability-release" className="text-sm">
              I have read and agree to the liability release
            </Label>
          </div>
          {errors.consentAgreements?.liabilityRelease && (
            <p className="text-sm text-destructive">
              {errors.consentAgreements.liabilityRelease.message}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Privacy Policy */}
      <Card>
        <CardHeader>
          <CardTitle>Privacy Policy</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="prose prose-sm max-w-none">
            <p className="text-sm text-muted-foreground">
              Your personal and health information will be kept strictly confidential and will only
              be used for providing you with the best possible care. We will not share your
              information with third parties without your explicit consent, except as required by
              law.
            </p>
          </div>

          <div className="flex items-start space-x-2">
            <Checkbox
              id="privacy-policy"
              checked={consentAgreements.privacyPolicy}
              onCheckedChange={(checked) => updateConsent("privacyPolicy", !!checked)}
            />
            <Label htmlFor="privacy-policy" className="text-sm">
              I have read and agree to the privacy policy
            </Label>
          </div>
          {errors.consentAgreements?.privacyPolicy && (
            <p className="text-sm text-destructive">
              {errors.consentAgreements.privacyPolicy.message}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Cancellation Policy */}
      <Card>
        <CardHeader>
          <CardTitle>Cancellation Policy</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="prose prose-sm max-w-none">
            <p className="text-sm text-muted-foreground">
              We require 24 hours notice for cancellations or rescheduling. Late cancellations or
              no-shows may be subject to a cancellation fee. We understand that emergencies happen
              and will work with you on a case-by-case basis.
            </p>
          </div>

          <div className="flex items-start space-x-2">
            <Checkbox
              id="cancellation-policy"
              checked={consentAgreements.cancellationPolicy}
              onCheckedChange={(checked) => updateConsent("cancellationPolicy", !!checked)}
            />
            <Label htmlFor="cancellation-policy" className="text-sm">
              I have read and agree to the cancellation policy
            </Label>
          </div>
          {errors.consentAgreements?.cancellationPolicy && (
            <p className="text-sm text-destructive">
              {errors.consentAgreements.cancellationPolicy.message}
            </p>
          )}
        </CardContent>
      </Card>

      {/* Optional Consents */}
      <Card>
        <CardHeader>
          <CardTitle>Optional Consents</CardTitle>
          <CardDescription>
            These are optional and will not affect your ability to receive services
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start space-x-2">
            <Checkbox
              id="photography-consent"
              checked={consentAgreements.photographyConsent}
              onCheckedChange={(checked) => updateConsent("photographyConsent", !!checked)}
            />
            <Label htmlFor="photography-consent" className="text-sm">
              I consent to photography for documentation purposes (face will not be shown)
            </Label>
          </div>

          <div className="flex items-start space-x-2">
            <Checkbox
              id="marketing-consent"
              checked={consentAgreements.marketingConsent}
              onCheckedChange={(checked) => updateConsent("marketingConsent", !!checked)}
            />
            <Label htmlFor="marketing-consent" className="text-sm">
              I would like to receive promotional emails about services and special offers
            </Label>
          </div>
        </CardContent>
      </Card>

      {/* Digital Signature */}
      <Card>
        <CardHeader>
          <CardTitle>Digital Signature</CardTitle>
          <CardDescription>
            By signing below, you acknowledge that you have read, understood, and agree to all the
            terms and conditions outlined in this intake form.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <DigitalSignature
            onSignatureChange={handleSignatureChange}
            initialSignature={signature}
          />

          {!signature && (
            <Alert>
              <AlertDescription className="text-sm">
                A signature is required to submit this form
              </AlertDescription>
            </Alert>
          )}

          {signature && (
            <div className="text-sm text-muted-foreground">
              Signed on: {new Date().toLocaleDateString()}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
