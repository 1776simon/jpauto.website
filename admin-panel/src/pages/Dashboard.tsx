import { AdminLayout } from "@/components/AdminLayout";
import {
  TrendingUp,
  Users,
  ShoppingCart,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

export default function Dashboard() {
  const statCards = [
    {
      title: "Total Revenue",
      value: "$45,231.89",
      change: "+20.1%",
      isPositive: true,
      icon: TrendingUp,
    },
    {
      title: "Active Users",
      value: "2,543",
      change: "+15.3%",
      isPositive: true,
      icon: Users,
    },
    {
      title: "Total Orders",
      value: "1,286",
      change: "-4.3%",
      isPositive: false,
      icon: ShoppingCart,
    },
    {
      title: "Pending Issues",
      value: "23",
      change: "+2.5%",
      isPositive: false,
      icon: AlertCircle,
    },
  ];

  const recentActivity = [
    {
      id: 1,
      title: "New order received",
      description: "Order #5234 from John Doe",
      time: "2 hours ago",
    },
    {
      id: 2,
      title: "User registered",
      description: "Jane Smith just signed up",
      time: "4 hours ago",
    },
    {
      id: 3,
      title: "Payment processed",
      description: "Invoice #INV-2024-001 completed",
      time: "6 hours ago",
    },
    {
      id: 4,
      title: "New submission",
      description: "Form submission from customer",
      time: "8 hours ago",
    },
  ];

  return (
    <AdminLayout
      title="Dashboard"
      description="Welcome back! Here's what's happening with your business today."
    >
      <div className="space-y-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <div
                key={stat.title}
                className="m3-card p-6 hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-start justify-between mb-4">
                  <h3 className="text-sm font-medium text-muted-foreground">
                    {stat.title}
                  </h3>
                  <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                </div>

                <div className="mb-3">
                  <p className="text-2xl font-bold text-foreground">
                    {stat.value}
                  </p>
                </div>

                <div
                  className={`flex items-center gap-1 text-sm font-medium ${
                    stat.isPositive ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {stat.isPositive ? (
                    <ArrowUpRight className="w-4 h-4" />
                  ) : (
                    <ArrowDownRight className="w-4 h-4" />
                  )}
                  <span>{stat.change}</span>
                </div>
              </div>
            );
          })}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Activity - Takes 2 columns on desktop */}
          <div className="lg:col-span-2 m3-card p-6">
            <h3 className="text-lg font-semibold text-foreground mb-6">
              Recent Activity
            </h3>

            <div className="space-y-4">
              {recentActivity.map((activity) => (
                <div
                  key={activity.id}
                  className="flex gap-4 pb-4 border-b border-border last:border-b-0 last:pb-0"
                >
                  <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground">
                      {activity.title}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {activity.description}
                    </p>
                  </div>
                  <p className="text-xs text-muted-foreground flex-shrink-0 whitespace-nowrap">
                    {activity.time}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="space-y-6">
            {/* Performance Card */}
            <div className="m3-card p-6">
              <h3 className="text-lg font-semibold text-foreground mb-6">
                Performance
              </h3>

              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-foreground">
                      Conversion Rate
                    </span>
                    <span className="text-sm font-bold text-primary">
                      72%
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full"
                      style={{ width: "72%" }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-foreground">
                      Load Time
                    </span>
                    <span className="text-sm font-bold text-secondary">
                      68%
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-secondary h-2 rounded-full"
                      style={{ width: "68%" }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-foreground">
                      Uptime
                    </span>
                    <span className="text-sm font-bold text-accent">
                      99.8%
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-accent h-2 rounded-full"
                      style={{ width: "99.8%" }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="m3-card p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">
                Quick Actions
              </h3>

              <div className="space-y-3">
                <button className="m3-button-filled w-full">
                  Generate Report
                </button>
                <button className="m3-button-outlined w-full">
                  View Analytics
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
