import { AdminLayout } from "@/components/AdminLayout";
import {
  TrendingUp,
  Users,
  ShoppingCart,
  AlertCircle,
  ArrowUpRight,
  ArrowDownRight,
  Car,
  Clock,
  DollarSign,
  CheckCircle,
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import api from "@/services/api";

export default function Dashboard() {
  const navigate = useNavigate();

  // Fetch inventory stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["inventoryStats"],
    queryFn: () => api.getInventoryStats(),
  });

  // Fetch recent submissions
  const { data: submissionsData, isLoading: submissionsLoading } = useQuery({
    queryKey: ["recentSubmissions"],
    queryFn: () => api.getSubmissions("all", 1, 5),
  });

  // Format currency
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Format time ago
  const timeAgo = (date: string) => {
    const now = new Date();
    const past = new Date(date);
    const diffMs = now.getTime() - past.getTime();
    const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
    if (diffHrs > 0) return `${diffHrs} hour${diffHrs > 1 ? "s" : ""} ago`;
    return "Just now";
  };

  const statCards = [
    {
      title: "Total Inventory",
      value: statsLoading ? "..." : (stats?.total ?? 0).toString(),
      change: "",
      isPositive: true,
      icon: Car,
    },
    {
      title: "Available Vehicles",
      value: statsLoading ? "..." : (stats?.available ?? 0).toString(),
      change: "",
      isPositive: true,
      icon: CheckCircle,
    },
    {
      title: "Total Value",
      value: statsLoading ? "..." : formatCurrency(stats?.totalValue ?? 0),
      change: "",
      isPositive: true,
      icon: DollarSign,
    },
    {
      title: "Pending Submissions",
      value: statsLoading ? "..." : (stats?.pending ?? 0).toString(),
      change: "",
      isPositive: false,
      icon: Clock,
    },
  ];

  const recentActivity =
    submissionsData?.submissions?.map((submission) => ({
      id: submission.id,
      title: "New vehicle submission",
      description: `${submission.year} ${submission.make} ${submission.model} - ${submission.customerName}`,
      time: timeAgo(submission.submittedAt),
      status: submission.submissionStatus || submission.status,
    })) || [];

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

                {stat.change && (
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
                )}
              </div>
            );
          })}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Recent Activity - Takes 3 columns on desktop */}
          <div className="lg:col-span-3 m3-card p-6">
            <h3 className="text-lg font-semibold text-foreground mb-6">
              Recent Submissions
            </h3>

            {submissionsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div
                    key={i}
                    className="flex gap-4 pb-4 border-b border-border last:border-b-0"
                  >
                    <div className="w-2 h-2 bg-muted rounded-full mt-2 flex-shrink-0" />
                    <div className="flex-1 min-w-0 space-y-2">
                      <div className="h-4 bg-muted rounded w-3/4 animate-pulse" />
                      <div className="h-3 bg-muted rounded w-1/2 animate-pulse" />
                    </div>
                    <div className="h-3 bg-muted rounded w-16 animate-pulse" />
                  </div>
                ))}
              </div>
            ) : recentActivity.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                No recent submissions
              </div>
            ) : (
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div
                    key={activity.id}
                    className="flex gap-4 pb-4 border-b border-border last:border-b-0 last:pb-0"
                  >
                    <div className="w-2 h-2 bg-primary rounded-full mt-2 flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-medium text-foreground">
                          {activity.title}
                        </p>
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full ${
                            activity.status === "pending"
                              ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
                              : activity.status === "approved"
                              ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
                              : "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400"
                          }`}
                        >
                          {activity.status}
                        </span>
                      </div>
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
            )}
          </div>

          {/* Inventory Breakdown Card */}
          <div className="m3-card p-6">
            <h3 className="text-lg font-semibold text-foreground mb-6">
              Inventory Breakdown
            </h3>

            {statsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="space-y-2">
                    <div className="h-4 bg-muted rounded w-3/4 animate-pulse" />
                    <div className="h-2 bg-muted rounded animate-pulse" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-foreground">
                      Available
                    </span>
                    <span className="text-sm font-bold text-green-600">
                      {stats?.available ?? 0} (
                      {stats?.total && stats.total > 0
                        ? Math.round(((stats.available ?? 0) / stats.total) * 100)
                        : 0}
                      %)
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-green-600 h-2 rounded-full transition-all"
                      style={{
                        width: `${
                          stats?.total && stats.total > 0
                            ? ((stats.available ?? 0) / stats.total) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-foreground">
                      Pending
                    </span>
                    <span className="text-sm font-bold text-yellow-600">
                      {stats?.pending ?? 0} (
                      {stats?.total && stats.total > 0
                        ? Math.round(((stats.pending ?? 0) / stats.total) * 100)
                        : 0}
                      %)
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-yellow-600 h-2 rounded-full transition-all"
                      style={{
                        width: `${
                          stats?.total && stats.total > 0
                            ? ((stats.pending ?? 0) / stats.total) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-foreground">
                      Sold
                    </span>
                    <span className="text-sm font-bold text-primary">
                      {stats?.sold ?? 0} (
                      {stats?.total && stats.total > 0
                        ? Math.round(((stats.sold ?? 0) / stats.total) * 100)
                        : 0}
                      %)
                    </span>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{
                        width: `${
                          stats?.total && stats.total > 0
                            ? ((stats.sold ?? 0) / stats.total) * 100
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
