"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Calendar, FileText, User, Search as SearchIcon, Loader2 } from "lucide-react";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { createClient } from "@/lib/supabase/client";
import { format } from "date-fns";
import { Badge } from "@/components/ui/badge";

interface SearchResult {
  id: string;
  type: "appointment" | "client" | "consultation" | "service";
  title: string;
  subtitle?: string;
  url: string;
  status?: string;
}

export function AdminSearchCommand() {
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [results, setResults] = React.useState<SearchResult[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [recentSearches, setRecentSearches] = React.useState<SearchResult[]>([]);
  const router = useRouter();
  const supabase = createClient();

  // Load recent searches from localStorage
  React.useEffect(() => {
    const stored = localStorage.getItem("admin-recent-searches");
    if (stored) {
      setRecentSearches(JSON.parse(stored));
    }
  }, []);

  // Save to recent searches
  const addToRecentSearches = (result: SearchResult) => {
    const updated = [result, ...recentSearches.filter((r) => r.id !== result.id)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem("admin-recent-searches", JSON.stringify(updated));
  };

  // Keyboard shortcut
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((open) => !open);
      }
    };

    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  // Search function
  const performSearch = React.useCallback(
    async (query: string) => {
      if (!query || query.length < 2) {
        setResults([]);
        return;
      }

      setLoading(true);
      try {
        const searchResults: SearchResult[] = [];

        // Search appointments
        const { data: appointments } = await supabase
          .from("appointments")
          .select("*")
          .or(`notes.ilike.%${query}%`)
          .order("appointment_date", { ascending: false })
          .limit(5);

        if (appointments && appointments.length > 0) {
          const appointmentClientIds = appointments.map((a) => a.client_id).filter(Boolean);
          const appointmentServiceIds = appointments.map((a) => a.service_id).filter(Boolean);

          const [{ data: clients }, { data: services }] = await Promise.all([
            supabase
              .from("profiles")
              .select("id, first_name, last_name")
              .in("id", appointmentClientIds),
            supabase.from("services").select("id, name").in("id", appointmentServiceIds),
          ]);

          appointments.forEach((apt) => {
            const client = clients?.find((c) => c.id === apt.client_id);
            const service = services?.find((s) => s.id === apt.service_id);

            searchResults.push({
              id: `apt-${apt.id}`,
              type: "appointment",
              title: `${client?.first_name || ""} ${client?.last_name || ""} - ${service?.name || "Unknown Service"}`,
              subtitle: apt.appointment_date
                ? format(new Date(apt.appointment_date), "MMM d, yyyy")
                : "",
              url: `/dashboard/appointments/${apt.id}`,
              status: apt.status,
            });
          });
        }

        // Search clients
        const { data: clients } = await supabase
          .from("profiles")
          .select("id, first_name, last_name, email, phone")
          .eq("role", "client")
          .or(
            `first_name.ilike.%${query}%,last_name.ilike.%${query}%,email.ilike.%${query}%,phone.ilike.%${query}%`
          )
          .order("created_at", { ascending: false })
          .limit(5);

        if (clients) {
          clients.forEach((client) => {
            searchResults.push({
              id: `client-${client.id}`,
              type: "client",
              title: `${client.first_name} ${client.last_name}`,
              subtitle: client.email || client.phone || "",
              url: `/dashboard/clients/${client.id}`,
            });
          });
        }

        // Search consultations
        const { data: consultations } = await supabase
          .from("consultations")
          .select("*")
          .or(`notes.ilike.%${query}%`)
          .order("created_at", { ascending: false })
          .limit(5);

        if (consultations && consultations.length > 0) {
          // Get appointment and client info
          const appointmentIds = consultations.map((c) => c.appointment_id).filter(Boolean);
          const { data: consultationAppointments } = await supabase
            .from("appointments")
            .select("id, appointment_date, client_id")
            .in("id", appointmentIds);

          const clientIds = consultationAppointments?.map((a) => a.client_id).filter(Boolean) || [];
          const { data: consultationClients } = await supabase
            .from("profiles")
            .select("id, first_name, last_name")
            .in("id", clientIds);

          consultations.forEach((consultation) => {
            const appointment = consultationAppointments?.find(
              (a) => a.id === consultation.appointment_id
            );
            const client = appointment
              ? consultationClients?.find((c) => c.id === appointment.client_id)
              : null;
            const clientName = client
              ? `${client.first_name} ${client.last_name}`
              : "Unknown Client";

            searchResults.push({
              id: `consultation-${consultation.id}`,
              type: "consultation",
              title: `${clientName} - ${consultation.consultation_type} Consultation`,
              subtitle: consultation.created_at
                ? format(new Date(consultation.created_at), "MMM d, yyyy")
                : "",
              url: `/dashboard/consultations/${consultation.id}`,
              status: consultation.consultation_status,
            });
          });
        }

        // Search services
        const { data: services } = await supabase
          .from("services")
          .select("id, name, description, price_cents, duration_minutes")
          .or(`name.ilike.%${query}%,description.ilike.%${query}%`)
          .order("name")
          .limit(5);

        if (services) {
          services.forEach((service) => {
            searchResults.push({
              id: `service-${service.id}`,
              type: "service",
              title: service.name,
              subtitle: `$${(service.price_cents / 100).toFixed(2)} • ${service.duration_minutes} min`,
              url: `/dashboard/services/${service.id}`,
            });
          });
        }

        setResults(searchResults);
      } catch (error) {
        console.error("Search error:", error);
        setResults([]);
      } finally {
        setLoading(false);
      }
    },
    [supabase]
  );

  // Debounced search
  React.useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(search);
    }, 300);

    return () => clearTimeout(timer);
  }, [search, performSearch]);

  const handleSelect = (result: SearchResult) => {
    addToRecentSearches(result);
    router.push(result.url);
    setOpen(false);
    setSearch("");
  };

  const getIcon = (type: SearchResult["type"]) => {
    switch (type) {
      case "appointment":
        return Calendar;
      case "client":
        return User;
      case "consultation":
        return FileText;
      case "service":
        return SearchIcon;
      default:
        return SearchIcon;
    }
  };

  const getStatusBadge = (status?: string) => {
    if (!status) return null;

    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      scheduled: "secondary",
      confirmed: "default",
      completed: "outline",
      cancelled: "destructive",
      no_show: "destructive",
    };

    return (
      <Badge variant={variants[status] || "secondary"} className="text-xs">
        {status.replace("_", " ")}
      </Badge>
    );
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors border rounded-md hover:border-muted-foreground/50"
      >
        <SearchIcon className="h-4 w-4" />
        <span className="hidden sm:inline">Search...</span>
        <kbd className="pointer-events-none hidden h-5 select-none items-center gap-1 rounded border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100 sm:flex">
          <span className="text-xs">⌘</span>K
        </kbd>
      </button>
      <CommandDialog open={open} onOpenChange={setOpen}>
        <CommandInput
          placeholder="Search appointments, clients, consultations..."
          value={search}
          onValueChange={setSearch}
        />
        <CommandList>
          {loading && (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          )}

          {!loading && search.length === 0 && recentSearches.length > 0 && (
            <CommandGroup heading="Recent Searches">
              {recentSearches.map((result) => {
                const Icon = getIcon(result.type);
                return (
                  <CommandItem
                    key={result.id}
                    value={result.title}
                    onSelect={() => handleSelect(result)}
                    className="flex items-center gap-2"
                  >
                    <Icon className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span>{result.title}</span>
                        {getStatusBadge(result.status)}
                      </div>
                      {result.subtitle && (
                        <span className="text-xs text-muted-foreground">{result.subtitle}</span>
                      )}
                    </div>
                  </CommandItem>
                );
              })}
            </CommandGroup>
          )}

          {!loading && search.length > 0 && results.length === 0 && (
            <CommandEmpty>No results found.</CommandEmpty>
          )}

          {!loading && results.length > 0 && (
            <>
              {["appointment", "client", "consultation", "service"].map((type) => {
                const typeResults = results.filter((r) => r.type === type);
                if (typeResults.length === 0) return null;

                const headings = {
                  appointment: "Appointments",
                  client: "Clients",
                  consultation: "Consultations",
                  service: "Services",
                };

                return (
                  <CommandGroup key={type} heading={headings[type as keyof typeof headings]}>
                    {typeResults.map((result) => {
                      const Icon = getIcon(result.type);
                      return (
                        <CommandItem
                          key={result.id}
                          value={result.title}
                          onSelect={() => handleSelect(result)}
                          className="flex items-center gap-2"
                        >
                          <Icon className="h-4 w-4 text-muted-foreground" />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span>{result.title}</span>
                              {getStatusBadge(result.status)}
                            </div>
                            {result.subtitle && (
                              <span className="text-xs text-muted-foreground">
                                {result.subtitle}
                              </span>
                            )}
                          </div>
                        </CommandItem>
                      );
                    })}
                  </CommandGroup>
                );
              })}
            </>
          )}

          {!loading && search.length === 0 && (
            <>
              <CommandSeparator />
              <CommandGroup heading="Quick Actions">
                <CommandItem
                  onSelect={() => {
                    router.push("/dashboard/appointments/new");
                    setOpen(false);
                  }}
                >
                  <Calendar className="mr-2 h-4 w-4" />
                  Create New Appointment
                </CommandItem>
                <CommandItem
                  onSelect={() => {
                    router.push("/dashboard/clients/new");
                    setOpen(false);
                  }}
                >
                  <User className="mr-2 h-4 w-4" />
                  Add New Client
                </CommandItem>
                <CommandItem
                  onSelect={() => {
                    router.push("/dashboard/consultations");
                    setOpen(false);
                  }}
                >
                  <FileText className="mr-2 h-4 w-4" />
                  View All Consultations
                </CommandItem>
              </CommandGroup>
            </>
          )}
        </CommandList>
      </CommandDialog>
    </>
  );
}
