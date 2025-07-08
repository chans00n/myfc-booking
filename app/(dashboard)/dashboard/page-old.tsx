"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Calendar, DollarSign, Users, Activity } from "lucide-react";

export default function DashboardPage() {
  // These would be fetched from the database in a real implementation
  const stats = [
    {
      title: "Today's Appointments",
      value: "8",
      icon: Calendar,
      description: "3 confirmed, 5 scheduled",
      color: "text-blue-600",
    },
    {
      title: "Weekly Revenue",
      value: "$2,450",
      icon: DollarSign,
      description: "+12% from last week",
      color: "text-green-600",
    },
    {
      title: "Active Clients",
      value: "124",
      icon: Users,
      description: "15 new this month",
      color: "text-purple-600",
    },
    {
      title: "Completion Rate",
      value: "94%",
      icon: Activity,
      description: "Last 30 days",
      color: "text-orange-600",
    },
  ];

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl sm:text-3xl font-bold">Dashboard Overview</h1>
        <p className="text-sm sm:text-base text-muted-foreground mt-1">
          Welcome back! Here's what's happening today.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <Icon className={`h-4 w-4 ${stat.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">{stat.description}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Recent Activity</CardTitle>
            <CardDescription>Latest updates from your practice</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b">
                <div className="space-y-1">
                  <p className="text-sm font-medium">New appointment booked</p>
                  <p className="text-xs text-muted-foreground">John Doe - Swedish Massage</p>
                </div>
                <span className="text-xs text-muted-foreground">2 min ago</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Payment received</p>
                  <p className="text-xs text-muted-foreground">Sarah Smith - $120.00</p>
                </div>
                <span className="text-xs text-muted-foreground">1 hour ago</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Appointment completed</p>
                  <p className="text-xs text-muted-foreground">Mike Johnson - Deep Tissue</p>
                </div>
                <span className="text-xs text-muted-foreground">3 hours ago</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg sm:text-xl">Upcoming Appointments</CardTitle>
            <CardDescription>Your schedule for the next 24 hours</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between py-2 border-b">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Emily Brown</p>
                  <p className="text-xs text-muted-foreground">Relaxation Massage - 60 min</p>
                </div>
                <span className="text-xs font-medium">2:00 PM</span>
              </div>
              <div className="flex items-center justify-between py-2 border-b">
                <div className="space-y-1">
                  <p className="text-sm font-medium">David Wilson</p>
                  <p className="text-xs text-muted-foreground">Sports Massage - 90 min</p>
                </div>
                <span className="text-xs font-medium">3:30 PM</span>
              </div>
              <div className="flex items-center justify-between py-2">
                <div className="space-y-1">
                  <p className="text-sm font-medium">Lisa Anderson</p>
                  <p className="text-xs text-muted-foreground">Swedish Massage - 60 min</p>
                </div>
                <span className="text-xs font-medium">5:00 PM</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
