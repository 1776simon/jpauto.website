import { AdminLayout } from "@/components/AdminLayout";
import { VehicleMarketDetail } from "@/components/VehicleMarketDetail";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
  XCircle,
  Clock,
  BarChart3,
  Activity,
  Play,
  Info,
  AlertCircle,
  X,
  History,
  Eye,
  Edit,
  Minus,
  Plus,
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/services/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export default function MarketResearch() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedVehicleId, setSelectedVehicleId] = useState<string | null>(null);
  const [showAllAlerts, setShowAllAlerts] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [detailVehicle, setDetailVehicle] = useState<{id: string; name: string; price: number} | null>(null);
  const [priceChangeModalOpen, setPriceChangeModalOpen] = useState(false);
  const [priceChangeVehicle, setPriceChangeVehicle] = useState<{
    id: string;
    name: string;
    currentPrice: number;
    medianMarketPrice: number | null;
  } | null>(null);
  const [newPrice, setNewPrice] = useState<number>(0);

  // Fetch market overview
  const { data: overview, isLoading: overviewLoading } = useQuery({
    queryKey: ["marketOverview"],
    queryFn: () => api.getMarketOverview(),
    refetchInterval: 60000, // Refetch every minute
  });

  // Fetch recent alerts
  const { data: alerts } = useQuery({
    queryKey: ["marketAlerts", showAllAlerts],
    queryFn: () => api.getMarketAlerts({ limit: showAllAlerts ? 100 : 10, includeDismissed: showAllAlerts }),
  });

  // Fetch job status
  const { data: jobsStatus } = useQuery({
    queryKey: ["marketJobsStatus"],
    queryFn: () => api.getMarketJobsStatus(),
    refetchInterval: 30000, // Refetch every 30 seconds
  });

  // Analyze all vehicles mutation
  const analyzeAllMutation = useMutation({
    mutationFn: () => api.analyzeAllVehicles(),
    onSuccess: () => {
      toast({
        title: "Analysis Started",
        description: "Market analysis has been queued for all vehicles.",
      });
      // Refetch overview after 10 seconds to see updates
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["marketOverview"] });
      }, 10000);
    },
    onError: (error: Error) => {
      toast({
        title: "Analysis Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Analyze single vehicle mutation
  const analyzeSingleMutation = useMutation({
    mutationFn: (vehicleId: string) => api.analyzeVehicle(vehicleId),
    onSuccess: () => {
      toast({
        title: "Analysis Complete",
        description: "Market analysis has been updated for this vehicle.",
      });
      setSelectedVehicleId(null);
      // Refetch overview to show updated data
      queryClient.invalidateQueries({ queryKey: ["marketOverview"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Analysis Failed",
        description: error.message,
        variant: "destructive",
      });
      setSelectedVehicleId(null);
    },
  });

  // Run job mutation
  const runJobMutation = useMutation({
    mutationFn: (jobName: string) => api.runMarketJob(jobName),
    onSuccess: () => {
      toast({
        title: "Job Started",
        description: "The scheduled job has been triggered manually.",
      });
      queryClient.invalidateQueries({ queryKey: ["marketJobsStatus"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Job Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Dismiss alert mutation
  const dismissAlertMutation = useMutation({
    mutationFn: (alertId: number) => api.dismissAlert(alertId),
    onSuccess: () => {
      toast({
        title: "Alert Dismissed",
        description: "The alert has been hidden.",
      });
      queryClient.invalidateQueries({ queryKey: ["marketAlerts"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Dismiss",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Update price mutation
  const updatePriceMutation = useMutation({
    mutationFn: ({ id, price }: { id: string; price: number }) =>
      api.updateInventoryItem(parseInt(id), { price }),
    onSuccess: () => {
      toast({
        title: "Price Updated",
        description: "Vehicle price has been updated successfully.",
      });
      setPriceChangeModalOpen(false);
      setPriceChangeVehicle(null);
      queryClient.invalidateQueries({ queryKey: ["marketOverview"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Update Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Format currency
  const formatCurrency = (value: number | null | undefined) => {
    if (value === null || value === undefined) return "N/A";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  // Format percentage
  const formatPercent = (value: number | null | undefined) => {
    if (value === null || value === undefined) return "N/A";
    const sign = value > 0 ? "+" : "";
    return `${sign}${value.toFixed(1)}%`;
  };

  // Get position badge variant
  const getPositionBadge = (position: string | null | undefined) => {
    if (!position) return <Badge variant="secondary">No Data</Badge>;

    switch (position) {
      case "below_market":
        return <Badge className="bg-green-500">Below Market</Badge>;
      case "competitive":
        return <Badge className="bg-blue-500">Competitive</Badge>;
      case "above_market":
        return <Badge className="bg-red-500">Above Market</Badge>;
      default:
        return <Badge variant="secondary">{position}</Badge>;
    }
  };

  // Get severity badge
  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case "critical":
        return <Badge variant="destructive">Critical</Badge>;
      case "warning":
        return <Badge className="bg-yellow-500">Warning</Badge>;
      case "info":
        return <Badge variant="secondary">Info</Badge>;
      default:
        return <Badge>{severity}</Badge>;
    }
  };

  // Format time ago
  const timeAgo = (date: string | null | undefined) => {
    if (!date) return "Never";
    try {
      const now = new Date();
      const past = new Date(date);
      const diffMs = now.getTime() - past.getTime();
      const diffHrs = Math.floor(diffMs / (1000 * 60 * 60));
      const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

      if (diffDays > 0) return `${diffDays} day${diffDays > 1 ? "s" : ""} ago`;
      if (diffHrs > 0) return `${diffHrs} hour${diffHrs > 1 ? "s" : ""} ago`;
      return "Just now";
    } catch {
      return "Never";
    }
  };

  const statCards = [
    {
      title: "Analyzed Vehicles",
      value: overviewLoading ? "..." : `${overview?.summary.analyzedVehicles ?? 0}/${overview?.summary.totalVehicles ?? 0}`,
      icon: BarChart3,
      description: "Vehicles with market data",
    },
    {
      title: "Below Market",
      value: overviewLoading ? "..." : (overview?.summary.belowMarket ?? 0).toString(),
      icon: TrendingDown,
      description: "Priced below market median",
      color: "text-green-500",
    },
    {
      title: "Competitive",
      value: overviewLoading ? "..." : (overview?.summary.competitive ?? 0).toString(),
      icon: Activity,
      description: "Within ±10% of market",
      color: "text-blue-500",
    },
    {
      title: "Above Market",
      value: overviewLoading ? "..." : (overview?.summary.aboveMarket ?? 0).toString(),
      icon: TrendingUp,
      description: "Priced above market median",
      color: "text-red-500",
    },
  ];

  return (
    <AdminLayout
      title="Market Research"
      description="Competitive pricing analysis powered by Auto.dev"
    >
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-muted-foreground">
              Last updated: {overview?.summary.lastUpdated ? timeAgo(overview.summary.lastUpdated) : "Never"}
            </p>
          </div>
          <Button
            onClick={() => analyzeAllMutation.mutate()}
            disabled={analyzeAllMutation.isPending}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${analyzeAllMutation.isPending ? "animate-spin" : ""}`} />
            Analyze All Vehicles
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {statCards.map((card, index) => {
            const Icon = card.icon;
            return (
              <Card key={index}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                  <Icon className={`h-4 w-4 ${card.color || "text-muted-foreground"}`} />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{card.value}</div>
                  <p className="text-xs text-muted-foreground">{card.description}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Recent Alerts - Always Show */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  {showAllAlerts ? "All Alerts" : "Recent Alerts"}
                </CardTitle>
                <CardDescription>Price changes and market alerts</CardDescription>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAllAlerts(!showAllAlerts)}
              >
                <History className="h-4 w-4 mr-2" />
                {showAllAlerts ? "Show Recent Only" : "View All History"}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {alerts && alerts.length > 0 ? (
              <div className="space-y-3">
                {alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="flex items-start gap-3 p-3 rounded-lg border bg-card"
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        {getSeverityBadge(alert.severity)}
                        <span className="text-sm font-medium">{alert.title}</span>
                      </div>
                      <p className="text-sm text-muted-foreground mb-1">
                        {alert.year} {alert.make} {alert.model} {alert.trim}
                      </p>
                      <p className="text-sm">{alert.message}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {timeAgo(alert.created_at)}
                      </p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => dismissAlertMutation.mutate(alert.id)}
                      disabled={dismissAlertMutation.isPending}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle2 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p className="font-medium">No {showAllAlerts ? '' : 'Recent '}Alerts</p>
                <p className="text-sm mt-1">
                  {showAllAlerts
                    ? "All alerts have been dismissed or there are no alerts yet."
                    : "All recent alerts have been dismissed. Click 'View All History' to see older alerts."}
                </p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Vehicles Table */}
        <Card>
          <CardHeader>
            <CardTitle>Vehicle Market Analysis</CardTitle>
            <CardDescription>
              Competitive pricing data for your inventory
            </CardDescription>
          </CardHeader>
          <CardContent>
            {overviewLoading ? (
              <div className="flex justify-center py-8">
                <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : overview?.vehicles && overview.vehicles.length > 0 ? (
              <>
                {/* Desktop: Table View */}
                <div className="hidden md:block rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Vehicle</TableHead>
                        <TableHead>Our Price</TableHead>
                        <TableHead>Market Median</TableHead>
                        <TableHead>Delta</TableHead>
                        <TableHead>Position</TableHead>
                        <TableHead>Listings</TableHead>
                        <TableHead>Last Analyzed</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {overview.vehicles.map((vehicle) => (
                        <TableRow key={vehicle.id} className="cursor-pointer hover:bg-muted/50">
                          <TableCell className="font-medium">
                            <div className="flex items-start gap-2">
                              <div>
                                <div className="flex items-center gap-1.5">
                                  {vehicle.year} {vehicle.make} {vehicle.model}
                                  <TooltipProvider>
                                    {vehicle.expandedSearch && (
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Info className="h-4 w-4 text-blue-500 cursor-help" />
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>Results include listings outside of normal ranges</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    )}
                                    {vehicle.titleStatus && vehicle.titleStatus.toLowerCase() !== 'clean' && (
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <AlertCircle className="h-4 w-4 text-amber-500 cursor-help" />
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>Non-clean title ({vehicle.titleStatus})</p>
                                          <p className="text-xs text-muted-foreground">Market prices shown are for clean title vehicles</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    )}
                                  </TooltipProvider>
                                </div>
                                {vehicle.trim && (
                                  <div className="text-xs text-muted-foreground">{vehicle.trim}</div>
                                )}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <span>{formatCurrency(vehicle.ourPrice)}</span>
                              <Button
                                size="sm"
                                variant="ghost"
                                className="h-6 w-6 p-0"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setPriceChangeVehicle({
                                    id: vehicle.id,
                                    name: `${vehicle.year} ${vehicle.make} ${vehicle.model}${vehicle.trim ? ' ' + vehicle.trim : ''}`,
                                    currentPrice: vehicle.ourPrice,
                                    medianMarketPrice: vehicle.medianMarketPrice,
                                  });
                                  setNewPrice(vehicle.ourPrice);
                                  setPriceChangeModalOpen(true);
                                }}
                              >
                                <Edit className="h-3 w-3" />
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell>{formatCurrency(vehicle.medianMarketPrice)}</TableCell>
                          <TableCell>
                            {vehicle.priceDeltaPercent !== null && vehicle.priceDeltaPercent !== undefined ? (
                              <span
                                className={
                                  vehicle.priceDeltaPercent < 0
                                    ? "text-green-500"
                                    : vehicle.priceDeltaPercent > 0
                                    ? "text-red-500"
                                    : ""
                                }
                              >
                                {formatCurrency(vehicle.priceDelta)} ({formatPercent(vehicle.priceDeltaPercent)})
                              </span>
                            ) : (
                              "N/A"
                            )}
                          </TableCell>
                          <TableCell>{getPositionBadge(vehicle.position)}</TableCell>
                          <TableCell>{vehicle.listingsFound || 0}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {timeAgo(vehicle.lastAnalyzed)}
                          </TableCell>
                          <TableCell>
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDetailVehicle({
                                    id: vehicle.id,
                                    name: `${vehicle.year} ${vehicle.make} ${vehicle.model}${vehicle.trim ? ' ' + vehicle.trim : ''}`,
                                    price: vehicle.ourPrice
                                  });
                                  setDetailModalOpen(true);
                                }}
                                disabled={!vehicle.lastAnalyzed}
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                Details
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setSelectedVehicleId(vehicle.id);
                                  analyzeSingleMutation.mutate(vehicle.id);
                                }}
                                disabled={analyzeSingleMutation.isPending && selectedVehicleId === vehicle.id}
                              >
                                {analyzeSingleMutation.isPending && selectedVehicleId === vehicle.id ? (
                                  <>
                                    <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                                    Analyzing...
                                  </>
                                ) : (
                                  <>
                                    <RefreshCw className="h-3 w-3 mr-1" />
                                    Analyze
                                  </>
                                )}
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile: Card View */}
                <div className="md:hidden space-y-3">
                  {overview.vehicles.map((vehicle) => (
                    <Card key={vehicle.id} className="overflow-hidden">
                      <CardContent className="p-4">
                        {/* Header: Vehicle Name and Our Price */}
                        <div className="mb-3">
                          <div className="flex items-center gap-1.5 text-sm font-medium mb-1">
                            {vehicle.year} {vehicle.make} {vehicle.model}
                            {vehicle.expandedSearch && (
                              <Info className="h-4 w-4 text-blue-500" />
                            )}
                            {vehicle.titleStatus && vehicle.titleStatus.toLowerCase() !== 'clean' && (
                              <AlertCircle className="h-4 w-4 text-amber-500" />
                            )}
                          </div>
                          {vehicle.trim && (
                            <div className="text-xs text-muted-foreground mb-2">{vehicle.trim}</div>
                          )}
                          <div className="text-2xl font-bold">{formatCurrency(vehicle.ourPrice)}</div>
                        </div>

                        {/* Price Delta Badge */}
                        {vehicle.priceDeltaPercent !== null && vehicle.priceDeltaPercent !== undefined ? (
                          <div className="mb-3">
                            {vehicle.priceDeltaPercent < 0 ? (
                              <Badge variant="outline" className="text-green-600 border-green-600">
                                <TrendingDown className="h-3 w-3 mr-1" />
                                {formatCurrency(Math.abs(vehicle.priceDelta))} below median ({formatPercent(vehicle.priceDeltaPercent)})
                              </Badge>
                            ) : vehicle.priceDeltaPercent > 0 ? (
                              <Badge variant="outline" className="text-red-600 border-red-600">
                                <TrendingUp className="h-3 w-3 mr-1" />
                                {formatCurrency(vehicle.priceDelta)} above median ({formatPercent(vehicle.priceDeltaPercent)})
                              </Badge>
                            ) : (
                              <Badge variant="outline">
                                At median price
                              </Badge>
                            )}
                          </div>
                        ) : (
                          <div className="mb-3">
                            <Badge variant="secondary">No market data</Badge>
                          </div>
                        )}

                        {/* Details Grid */}
                        <div className="grid grid-cols-2 gap-3 text-sm mb-3">
                          <div>
                            <div className="text-muted-foreground">Market Median</div>
                            <div className="font-medium">{formatCurrency(vehicle.medianMarketPrice)}</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Position</div>
                            <div className="font-medium">{getPositionBadge(vehicle.position)}</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Listings Found</div>
                            <div className="font-medium">{vehicle.listingsFound || 0}</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Last Analyzed</div>
                            <div className="font-medium">{timeAgo(vehicle.lastAnalyzed)}</div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1"
                            onClick={() => {
                              setDetailVehicle({
                                id: vehicle.id,
                                name: `${vehicle.year} ${vehicle.make} ${vehicle.model}${vehicle.trim ? ' ' + vehicle.trim : ''}`,
                                price: vehicle.ourPrice
                              });
                              setDetailModalOpen(true);
                            }}
                            disabled={!vehicle.lastAnalyzed}
                          >
                            <Eye className="h-3 w-3 mr-1" />
                            Details
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex-1"
                            onClick={() => {
                              setSelectedVehicleId(vehicle.id);
                              analyzeSingleMutation.mutate(vehicle.id);
                            }}
                            disabled={analyzeSingleMutation.isPending && selectedVehicleId === vehicle.id}
                          >
                            {analyzeSingleMutation.isPending && selectedVehicleId === vehicle.id ? (
                              <>
                                <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                                Analyzing...
                              </>
                            ) : (
                              <>
                                <RefreshCw className="h-3 w-3 mr-1" />
                                Analyze
                              </>
                            )}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <p>No market data available</p>
                <p className="text-sm mt-2">Click "Analyze All Vehicles" to start</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Job Status */}
        {jobsStatus && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="h-5 w-5" />
                Scheduled Jobs
              </CardTitle>
              <CardDescription>Automated market research tasks</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {Object.entries(jobsStatus).map(([jobName, status]) => (
                  <div key={jobName} className="flex items-center justify-between p-4 rounded-lg border">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium capitalize">
                          {jobName.replace(/([A-Z])/g, " $1").trim()}
                        </span>
                        {status.enabled ? (
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                        ) : (
                          <XCircle className="h-4 w-4 text-red-500" />
                        )}
                      </div>
                      <div className="text-sm space-y-1">
                        {status.nextRun ? (
                          <p className="text-primary font-medium">
                            <Clock className="h-3 w-3 inline mr-1" />
                            Next run: {new Date(status.nextRun).toLocaleString('en-US', {
                              month: 'short',
                              day: 'numeric',
                              year: 'numeric',
                              hour: 'numeric',
                              minute: '2-digit',
                              hour12: true,
                              timeZone: 'America/Los_Angeles',
                              timeZoneName: 'short'
                            })}
                          </p>
                        ) : (
                          <p className="text-muted-foreground">
                            <span className="font-medium">Schedule:</span> {status.humanReadableSchedule || status.schedule}
                          </p>
                        )}
                        <p className="text-muted-foreground">
                          Last run: {timeAgo(status.lastRun)}
                        </p>
                        {status.lastResult && (
                          <p className="text-muted-foreground">
                            Status: {status.lastResult.success ? "✓ Success" : "✗ Failed"}
                            {status.lastResult.vehiclesAnalyzed !== undefined &&
                              ` - ${status.lastResult.vehiclesAnalyzed} vehicles analyzed`}
                          </p>
                        )}
                      </div>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => runJobMutation.mutate(jobName)}
                      disabled={runJobMutation.isPending || status.isRunning}
                    >
                      <Play className="h-4 w-4 mr-1" />
                      Run Now
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Vehicle Market Detail Modal */}
      {detailVehicle && (
        <VehicleMarketDetail
          open={detailModalOpen}
          onOpenChange={setDetailModalOpen}
          vehicleId={detailVehicle.id}
          vehicleName={detailVehicle.name}
          ourPrice={detailVehicle.price}
        />
      )}

      {/* Price Change Modal */}
      <Dialog open={priceChangeModalOpen} onOpenChange={setPriceChangeModalOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update Price for {priceChangeVehicle?.name}</DialogTitle>
            <DialogDescription>
              Adjust the price using quick actions or enter a custom amount
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Current Price Display */}
            <div className="flex items-center justify-between p-3 bg-muted rounded-lg">
              <span className="text-sm text-muted-foreground">Current Price</span>
              <span className="text-lg font-bold">{formatCurrency(priceChangeVehicle?.currentPrice)}</span>
            </div>

            {/* Manual Price Input */}
            <div className="space-y-2">
              <label className="text-sm font-medium">New Price</label>
              <div className="relative">
                <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  type="number"
                  value={newPrice}
                  onChange={(e) => setNewPrice(parseFloat(e.target.value) || 0)}
                  onWheel={(e) => e.currentTarget.blur()} // Disable scroll to change value
                  className="pl-9 text-lg font-semibold"
                  placeholder="Enter price"
                />
              </div>
            </div>

            {/* Quick Action Buttons */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Quick Actions</label>
              <div className="grid grid-cols-5 gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setNewPrice(Math.max(0, newPrice - 1))}
                  className="flex flex-col h-auto py-2"
                >
                  <Minus className="h-3 w-3 mb-1" />
                  <span className="text-xs">$1</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setNewPrice(Math.max(0, newPrice - 500))}
                  className="flex flex-col h-auto py-2"
                >
                  <Minus className="h-3 w-3 mb-1" />
                  <span className="text-xs">$500</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setNewPrice(newPrice + 500)}
                  className="flex flex-col h-auto py-2"
                >
                  <Plus className="h-3 w-3 mb-1" />
                  <span className="text-xs">$500</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setNewPrice(Math.max(0, newPrice - 1000))}
                  className="flex flex-col h-auto py-2"
                >
                  <Minus className="h-3 w-3 mb-1" />
                  <span className="text-xs">$1k</span>
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setNewPrice(newPrice + 1000)}
                  className="flex flex-col h-auto py-2"
                >
                  <Plus className="h-3 w-3 mb-1" />
                  <span className="text-xs">$1k</span>
                </Button>
              </div>
            </div>

            {/* Price Delta Preview */}
            {priceChangeVehicle?.medianMarketPrice !== null && priceChangeVehicle?.medianMarketPrice !== undefined && (
              <div className="p-3 bg-muted rounded-lg space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">Market Median</span>
                  <span className="font-medium">{formatCurrency(priceChangeVehicle.medianMarketPrice)}</span>
                </div>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">New Delta</span>
                  <span className={`font-semibold ${
                    newPrice < priceChangeVehicle.medianMarketPrice
                      ? "text-green-600"
                      : newPrice > priceChangeVehicle.medianMarketPrice
                      ? "text-red-600"
                      : ""
                  }`}>
                    {formatCurrency(newPrice - priceChangeVehicle.medianMarketPrice)}
                    ({formatPercent(((newPrice - priceChangeVehicle.medianMarketPrice) / priceChangeVehicle.medianMarketPrice) * 100)})
                  </span>
                </div>
              </div>
            )}
          </div>

          <DialogFooter className="gap-2 sm:gap-0">
            <Button
              variant="outline"
              onClick={() => {
                setPriceChangeModalOpen(false);
                setPriceChangeVehicle(null);
              }}
              disabled={updatePriceMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={() => {
                if (priceChangeVehicle) {
                  updatePriceMutation.mutate({
                    id: priceChangeVehicle.id,
                    price: newPrice,
                  });
                }
              }}
              disabled={updatePriceMutation.isPending || newPrice <= 0}
            >
              {updatePriceMutation.isPending ? (
                <>
                  <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>Save Price</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
