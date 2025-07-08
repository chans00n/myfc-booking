"use client";

import { useState, useEffect } from "react";
import {
  getAllServices,
  createServiceClient,
  updateServiceClient,
  deleteServiceClient,
} from "@/lib/services/client";
import { ServiceForm } from "@/components/admin/service-form";
import { formatPrice, formatDuration, type ServiceFormData } from "@/lib/services/schemas";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import type { Service } from "@/types";

export default function ServicesPage() {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadServices();
  }, []);

  const loadServices = async () => {
    setLoading(true);
    const data = await getAllServices(true); // Include inactive services
    setServices(data);
    setLoading(false);
  };

  const handleCreate = async (data: ServiceFormData) => {
    setSubmitting(true);
    const result = await createServiceClient(data);

    if (result.error) {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Service created successfully",
      });
      setShowForm(false);
      loadServices();
    }

    setSubmitting(false);
  };

  const handleUpdate = async (data: ServiceFormData) => {
    if (!selectedService) return;

    setSubmitting(true);
    const result = await updateServiceClient(selectedService.id, data);

    if (result.error) {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Service updated successfully",
      });
      setShowForm(false);
      setSelectedService(null);
      loadServices();
    }

    setSubmitting(false);
  };

  const handleDelete = async () => {
    if (!selectedService) return;

    setSubmitting(true);
    const result = await deleteServiceClient(selectedService.id);

    if (result.error) {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Service deleted successfully",
      });
      setShowDeleteDialog(false);
      setSelectedService(null);
      loadServices();
    }

    setSubmitting(false);
  };

  const toggleServiceStatus = async (service: Service) => {
    const result = await updateServiceClient(service.id, {
      is_active: !service.is_active,
    });

    if (result.error) {
      toast({
        title: "Error",
        description: result.error,
        variant: "destructive",
      });
    } else {
      loadServices();
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Services</h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Manage your massage therapy services
          </p>
        </div>
        <Button onClick={() => setShowForm(true)} className="w-full sm:w-auto">
          <Plus className="mr-2 h-4 w-4" />
          Add Service
        </Button>
      </div>

      <div className="grid gap-4">
        {services.map((service) => (
          <Card key={service.id} className={!service.is_active ? "opacity-60" : ""}>
            <CardContent className="p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
                <div className="space-y-2 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="text-lg sm:text-xl font-semibold">{service.name}</h3>
                    {!service.is_active && (
                      <Badge variant="secondary" className="text-xs">
                        Inactive
                      </Badge>
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {service.description}
                  </p>
                  <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 text-sm">
                    <span className="font-medium">
                      Duration: {formatDuration(service.duration_minutes)}
                    </span>
                    <span className="font-medium">Price: {formatPrice(service.price_cents)}</span>
                  </div>
                </div>
                <div className="flex items-center gap-2 pt-2 sm:pt-0">
                  <Switch
                    checked={service.is_active}
                    onCheckedChange={() => toggleServiceStatus(service)}
                    className="data-[state=checked]:bg-primary"
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => {
                      setSelectedService(service);
                      setShowForm(true);
                    }}
                  >
                    <Pencil className="h-4 w-4" />
                    <span className="sr-only">Edit</span>
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={() => {
                      setSelectedService(service);
                      setShowDeleteDialog(true);
                    }}
                  >
                    <Trash2 className="h-4 w-4" />
                    <span className="sr-only">Delete</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {services.length === 0 && (
        <Card>
          <CardContent className="text-center py-12">
            <p className="text-gray-500 mb-4">No services created yet</p>
            <Button onClick={() => setShowForm(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create your first service
            </Button>
          </CardContent>
        </Card>
      )}

      <Dialog open={showForm} onOpenChange={setShowForm}>
        <DialogContent className="w-full max-w-2xl p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-lg sm:text-xl">
              {selectedService ? "Edit Service" : "Create New Service"}
            </DialogTitle>
            <DialogDescription className="text-sm">
              {selectedService
                ? "Update the service details below"
                : "Fill in the details to create a new service"}
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <ServiceForm
              service={selectedService || undefined}
              onSubmit={selectedService ? handleUpdate : handleCreate}
              onCancel={() => {
                setShowForm(false);
                setSelectedService(null);
              }}
              loading={submitting}
            />
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <DialogContent className="w-[calc(100%-2rem)] sm:w-full max-w-md mx-auto">
          <DialogHeader>
            <DialogTitle className="text-base sm:text-lg">Delete Service</DialogTitle>
            <DialogDescription className="text-sm pt-2">
              Are you sure you want to delete "{selectedService?.name}"? This will mark the service
              as inactive and it will no longer be available for booking.
            </DialogDescription>
          </DialogHeader>
          <div className="flex flex-col-reverse sm:flex-row gap-2 sm:gap-4 sm:justify-end pt-4">
            <Button
              variant="outline"
              onClick={() => setShowDeleteDialog(false)}
              disabled={submitting}
              className="w-full sm:w-auto"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              disabled={submitting}
              className="w-full sm:w-auto"
            >
              {submitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                "Delete"
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
