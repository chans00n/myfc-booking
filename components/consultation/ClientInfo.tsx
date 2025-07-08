"use client";

import { ConsultationWithRelations, IntakeForm, Profile } from "@/types";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  User,
  Phone,
  Mail,
  Calendar,
  MapPin,
  Heart,
  AlertCircle,
  FileText,
  Activity,
} from "lucide-react";
import { format } from "date-fns";

interface ClientInfoProps {
  client: Profile;
  intakeForm: IntakeForm | null;
  consultation: ConsultationWithRelations;
}

export function ClientInfo({ client, intakeForm, consultation }: ClientInfoProps) {
  return (
    <div className="h-full flex flex-col">
      <div className="p-4 border-b">
        <h2 className="text-lg font-semibold flex items-center gap-2">
          <User className="h-5 w-5" />
          Client Information
        </h2>
      </div>

      <Tabs defaultValue="overview" className="flex-1 flex flex-col">
        <TabsList className="w-full rounded-none border-b">
          <TabsTrigger value="overview" className="flex-1">
            Overview
          </TabsTrigger>
          <TabsTrigger value="health" className="flex-1">
            Health Info
          </TabsTrigger>
          <TabsTrigger value="intake" className="flex-1">
            Intake Form
          </TabsTrigger>
        </TabsList>

        <ScrollArea className="flex-1">
          <TabsContent value="overview" className="p-4 space-y-4 m-0">
            {/* Basic Info */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Contact Information</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span>
                    {client.first_name} {client.last_name}
                  </span>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="h-4 w-4 text-muted-foreground" />
                  <a href={`mailto:${client.email}`} className="text-primary hover:underline">
                    {client.email}
                  </a>
                </div>
                <div className="flex items-center gap-3 text-sm">
                  <Phone className="h-4 w-4 text-muted-foreground" />
                  <a href={`tel:${client.phone}`} className="text-primary hover:underline">
                    {client.phone}
                  </a>
                </div>
                {client.date_of_birth && (
                  <div className="flex items-center gap-3 text-sm">
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                    <span>Born {format(new Date(client.date_of_birth), "MMMM d, yyyy")}</span>
                  </div>
                )}
                {(client.address_line1 || client.city) && (
                  <div className="flex items-start gap-3 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground mt-0.5" />
                    <div>
                      {client.address_line1 && <div>{client.address_line1}</div>}
                      {client.address_line2 && <div>{client.address_line2}</div>}
                      {(client.city || client.state || client.zip_code) && (
                        <div>
                          {client.city}
                          {client.city && client.state && ", "}
                          {client.state} {client.zip_code}
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Consultation History */}
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-base">Consultation History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Total Consultations:</span>
                    <Badge variant="secondary">{client.consultation_count || 0}</Badge>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Free Consultation Used:</span>
                    <Badge variant={client.has_had_free_consultation ? "default" : "outline"}>
                      {client.has_had_free_consultation ? "Yes" : "No"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Emergency Contact */}
            {intakeForm?.emergency_contact_name && (
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-base flex items-center gap-2">
                    <AlertCircle className="h-4 w-4" />
                    Emergency Contact
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div>
                    <span className="font-medium">{intakeForm.emergency_contact_name}</span>
                    {intakeForm.emergency_contact_relationship && (
                      <span className="text-muted-foreground">
                        {" "}
                        ({intakeForm.emergency_contact_relationship})
                      </span>
                    )}
                  </div>
                  {intakeForm.emergency_contact_phone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-3 w-3 text-muted-foreground" />
                      <a
                        href={`tel:${intakeForm.emergency_contact_phone}`}
                        className="text-primary hover:underline"
                      >
                        {intakeForm.emergency_contact_phone}
                      </a>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="health" className="p-4 space-y-4 m-0">
            {intakeForm ? (
              <>
                {/* Health Conditions */}
                {intakeForm.health_conditions && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Heart className="h-4 w-4" />
                        Health Conditions
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm whitespace-pre-wrap">{intakeForm.health_conditions}</p>
                    </CardContent>
                  </Card>
                )}

                {/* Medications */}
                {intakeForm.current_medications && intakeForm.current_medications.length > 0 && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base">Current Medications</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-1">
                        {intakeForm.current_medications.map((med, index) => (
                          <li key={index} className="text-sm flex items-start gap-2">
                            <span className="text-muted-foreground">•</span>
                            <span>{med}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {/* Allergies */}
                {intakeForm.allergies && intakeForm.allergies.length > 0 && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <AlertCircle className="h-4 w-4 text-yellow-600" />
                        Allergies
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-1">
                        {intakeForm.allergies.map((allergy, index) => (
                          <li key={index} className="text-sm flex items-start gap-2">
                            <span className="text-yellow-600">!</span>
                            <span>{allergy}</span>
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}

                {/* Primary Concerns */}
                {intakeForm.primary_concerns && (
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-base flex items-center gap-2">
                        <Activity className="h-4 w-4" />
                        Primary Concerns
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm whitespace-pre-wrap">{intakeForm.primary_concerns}</p>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No health information available</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="intake" className="p-4 m-0">
            {intakeForm ? (
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Intake Form Details</CardTitle>
                  <CardDescription>
                    Submitted {format(new Date(intakeForm.created_at), "MMMM d, yyyy at h:mm a")}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Display all intake form fields in a structured way */}
                  <div className="space-y-3 text-sm">
                    {intakeForm.massage_experience && (
                      <div>
                        <span className="font-medium">Massage Experience:</span>
                        <p className="text-muted-foreground mt-1">
                          {intakeForm.massage_experience}
                        </p>
                      </div>
                    )}

                    {intakeForm.pressure_preference && (
                      <div>
                        <span className="font-medium">Pressure Preference:</span>
                        <Badge variant="outline" className="ml-2">
                          {intakeForm.pressure_preference}
                        </Badge>
                      </div>
                    )}

                    {intakeForm.focus_areas && (
                      <div>
                        <span className="font-medium">Focus Areas:</span>
                        <p className="text-muted-foreground mt-1">{intakeForm.focus_areas}</p>
                      </div>
                    )}

                    {intakeForm.areas_to_avoid && intakeForm.areas_to_avoid.length > 0 && (
                      <div>
                        <span className="font-medium">Areas to Avoid:</span>
                        <ul className="mt-1 space-y-1">
                          {intakeForm.areas_to_avoid.map((area, index) => (
                            <li
                              key={index}
                              className="text-muted-foreground flex items-start gap-2"
                            >
                              <span>•</span>
                              <span>{area}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {intakeForm.treatment_goals && (
                      <div>
                        <span className="font-medium">Treatment Goals:</span>
                        <p className="text-muted-foreground mt-1">{intakeForm.treatment_goals}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="py-8 text-center text-muted-foreground">
                  <FileText className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>No intake form submitted</p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </ScrollArea>
      </Tabs>
    </div>
  );
}
