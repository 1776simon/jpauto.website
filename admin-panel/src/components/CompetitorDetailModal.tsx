import { useQuery } from "@tantml:invoke name="@tanstack/react-query";
import api from "@/services/api";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, TrendingDown, TrendingUp, AlertCircle, Info } from "lucide-react";

interface CompetitorDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  competitor: any;
}

export function CompetitorDetailModal({ open, onOpenChange, competitor }: CompetitorDetailModalProps) {
  // Fetch detailed competitor data
  const { data: competitorDetail } = useQuery({
    queryKey: ["competitor", competitor.id],
    queryFn: () => api.getCompetitorById(competitor.id),
    enabled: open,
  });

  // Fetch current inventory
  const { data: inventoryData } = useQuery({
    queryKey: ["competitorInventory", competitor.id],
    queryFn: () => api.getCompetitorInventory(competitor.id, 1, 100),
    enabled: open,
  });

  // Fetch sales
  const { data: salesData } = useQuery({
    queryKey: ["competitorSales", competitor.id],
    queryFn: () => api.getCompetitorSales(competitor.id),
    enabled: open,
  });

  const formatCurrency = (value: number | null | undefined) => {
    if (value === null || value === undefined) return "N/A";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const calculateDaysOnMarket = (firstSeen: string) => {
    const days = Math.floor((new Date().getTime() - new Date(firstSeen).getTime()) / (1000 * 60 * 60 * 24));
    return days;
  };

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

  const stats = competitorDetail?.stats || competitor.stats || {};

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{competitor.name}</DialogTitle>
          <DialogDescription>
            Competitor inventory and sales tracking
          </DialogDescription>
        </DialogHeader>

        {/* Summary Stats */}
        <div className="grid grid-cols-4 gap-4 mb-4">
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground">Total Inventory</div>
              <div className="text-3xl font-bold">{stats.totalInventory || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground">This Month Sales</div>
              <div className="text-3xl font-bold">{stats.monthlySales || 0}</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground">Avg Days on Market</div>
              <div className="text-3xl font-bold">{stats.avgDaysOnMarket || 0}<span className="text-lg text-muted-foreground"> days</span></div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="text-sm text-muted-foreground">Avg Sale Price</div>
              <div className="text-2xl font-bold">{formatCurrency(stats.avgSalePrice)}</div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="current" className="w-full">
          <TabsList>
            <TabsTrigger value="current">
              Current Inventory ({inventoryData?.vehicles?.length || 0})
            </TabsTrigger>
            <TabsTrigger value="sold">
              Sold This Month ({salesData?.vehicles?.length || 0})
            </TabsTrigger>
          </TabsList>

          {/* Current Inventory Tab */}
          <TabsContent value="current" className="space-y-4">
            {inventoryData?.vehicles && inventoryData.vehicles.length > 0 ? (
              <>
                {/* Desktop Table */}
                <div className="hidden md:block border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>VIN/Stock#</TableHead>
                        <TableHead>Vehicle</TableHead>
                        <TableHead>Mileage</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Days Listed</TableHead>
                        <TableHead>Last Updated</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {inventoryData.vehicles.map((vehicle: any) => (
                        <TableRow key={vehicle.id}>
                          <TableCell className="font-mono text-xs">
                            <div className="flex items-center gap-2">
                              {vehicle.vin || vehicle.stockNumber || "N/A"}
                              {!vehicle.hasVin && (
                                <Badge variant="secondary" className="text-xs">Stock# Only</Badge>
                              )}
                              {vehicle.isDuplicateVin && (
                                <AlertCircle className="h-4 w-4 text-amber-500" title={vehicle.duplicateWarning} />
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              {vehicle.year} {vehicle.make} {vehicle.model}
                              {vehicle.trim && <div className="text-xs text-muted-foreground">{vehicle.trim}</div>}
                            </div>
                          </TableCell>
                          <TableCell>{vehicle.mileage ? vehicle.mileage.toLocaleString() : "N/A"}</TableCell>
                          <TableCell className="font-semibold">{formatCurrency(vehicle.currentPrice)}</TableCell>
                          <TableCell>{calculateDaysOnMarket(vehicle.firstSeenAt)} days</TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {timeAgo(vehicle.lastUpdatedAt)}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden space-y-3">
                  {inventoryData.vehicles.map((vehicle: any) => (
                    <Card key={vehicle.id}>
                      <CardContent className="p-4">
                        <div className="mb-2">
                          <div className="text-sm font-medium mb-1">
                            {vehicle.year} {vehicle.make} {vehicle.model}
                          </div>
                          {vehicle.trim && (
                            <div className="text-xs text-muted-foreground">{vehicle.trim}</div>
                          )}
                          <div className="font-mono text-xs text-muted-foreground mt-1">
                            {vehicle.vin || vehicle.stockNumber}
                          </div>
                        </div>

                        <div className="text-2xl font-bold mb-3">
                          {formatCurrency(vehicle.currentPrice)}
                        </div>

                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div>
                            <div className="text-muted-foreground">Mileage</div>
                            <div className="font-medium">{vehicle.mileage?.toLocaleString() || "N/A"}</div>
                          </div>
                          <div>
                            <div className="text-muted-foreground">Days Listed</div>
                            <div className="font-medium">{calculateDaysOnMarket(vehicle.firstSeenAt)} days</div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <RefreshCw className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No current inventory data</p>
                <p className="text-sm mt-2">Trigger a scrape to fetch inventory</p>
              </div>
            )}
          </TabsContent>

          {/* Sold Vehicles Tab */}
          <TabsContent value="sold" className="space-y-4">
            {salesData?.vehicles && salesData.vehicles.length > 0 ? (
              <>
                {/* Desktop Table */}
                <div className="hidden md:block border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>VIN/Stock#</TableHead>
                        <TableHead>Vehicle</TableHead>
                        <TableHead>Mileage</TableHead>
                        <TableHead>Initial Price</TableHead>
                        <TableHead>Sale Price</TableHead>
                        <TableHead>Price Change</TableHead>
                        <TableHead>Days on Market</TableHead>
                        <TableHead>Sold Date</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {salesData.vehicles.map((vehicle: any) => {
                        const priceChange = parseFloat(vehicle.currentPrice || 0) - parseFloat(vehicle.initialPrice || 0);
                        return (
                          <TableRow key={vehicle.id}>
                            <TableCell className="font-mono text-xs">
                              {vehicle.vin || vehicle.stockNumber || "N/A"}
                            </TableCell>
                            <TableCell>
                              <div>
                                {vehicle.year} {vehicle.make} {vehicle.model}
                                {vehicle.trim && <div className="text-xs text-muted-foreground">{vehicle.trim}</div>}
                              </div>
                            </TableCell>
                            <TableCell>{vehicle.mileage ? vehicle.mileage.toLocaleString() : "N/A"}</TableCell>
                            <TableCell>{formatCurrency(vehicle.initialPrice)}</TableCell>
                            <TableCell className="font-semibold">{formatCurrency(vehicle.currentPrice)}</TableCell>
                            <TableCell>
                              {priceChange !== 0 ? (
                                <span className={priceChange < 0 ? "text-red-500 flex items-center gap-1" : "text-green-500 flex items-center gap-1"}>
                                  {priceChange < 0 ? <TrendingDown className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />}
                                  {formatCurrency(Math.abs(priceChange))}
                                </span>
                              ) : (
                                <span className="text-muted-foreground">No change</span>
                              )}
                            </TableCell>
                            <TableCell>{vehicle.daysOnMarket || 0} days</TableCell>
                            <TableCell className="text-sm">
                              {vehicle.soldAt ? new Date(vehicle.soldAt).toLocaleDateString() : "N/A"}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>

                {/* Mobile Cards */}
                <div className="md:hidden space-y-3">
                  {salesData.vehicles.map((vehicle: any) => {
                    const priceChange = parseFloat(vehicle.currentPrice || 0) - parseFloat(vehicle.initialPrice || 0);
                    return (
                      <Card key={vehicle.id}>
                        <CardContent className="p-4">
                          <div className="mb-2">
                            <div className="text-sm font-medium mb-1">
                              {vehicle.year} {vehicle.make} {vehicle.model}
                            </div>
                            {vehicle.trim && (
                              <div className="text-xs text-muted-foreground">{vehicle.trim}</div>
                            )}
                          </div>

                          <div className="flex items-center justify-between mb-3">
                            <div>
                              <div className="text-xs text-muted-foreground">Sale Price</div>
                              <div className="text-2xl font-bold">{formatCurrency(vehicle.currentPrice)}</div>
                            </div>
                            {priceChange !== 0 && (
                              <Badge variant="outline" className={priceChange < 0 ? "text-red-600 border-red-600" : "text-green-600 border-green-600"}>
                                {priceChange < 0 ? "-" : "+"}{formatCurrency(Math.abs(priceChange))}
                              </Badge>
                            )}
                          </div>

                          <div className="grid grid-cols-2 gap-2 text-sm">
                            <div>
                              <div className="text-muted-foreground">Mileage</div>
                              <div className="font-medium">{vehicle.mileage?.toLocaleString() || "N/A"}</div>
                            </div>
                            <div>
                              <div className="text-muted-foreground">Days on Market</div>
                              <div className="font-medium">{vehicle.daysOnMarket || 0} days</div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <p>No sales recorded this month</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
