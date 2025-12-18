import { useQuery } from "@tanstack/react-query";
import api from "@/services/api";
import { useState, useMemo, useEffect } from "react";
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
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RefreshCw, TrendingDown, TrendingUp, AlertCircle, Info, ChevronLeft, ChevronRight } from "lucide-react";

interface CompetitorDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  competitor: any;
}

export function CompetitorDetailModal({ open, onOpenChange, competitor }: CompetitorDetailModalProps) {
  // Filter and pagination state
  const [currentTab, setCurrentTab] = useState("current");
  const [yearFilter, setYearFilter] = useState<string>("all");
  const [makeFilter, setMakeFilter] = useState<string>("all");
  const [modelFilter, setModelFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [soldCurrentPage, setSoldCurrentPage] = useState(1);
  const pageSize = 20;

  // Fetch detailed competitor data
  const { data: competitorDetail } = useQuery({
    queryKey: ["competitor", competitor.id],
    queryFn: () => api.getCompetitorById(competitor.id),
    enabled: open,
  });

  // Fetch current inventory
  const { data: inventoryData } = useQuery({
    queryKey: ["competitorInventory", competitor.id],
    queryFn: () => api.getCompetitorInventory(competitor.id, 1, 1000), // Fetch all for client-side filtering
    enabled: open,
  });

  // Fetch sales
  const { data: salesData } = useQuery({
    queryKey: ["competitorSales", competitor.id],
    queryFn: () => api.getCompetitorSales(competitor.id),
    enabled: open,
  });

  // Reset filters when modal closes
  useEffect(() => {
    if (!open) {
      setYearFilter("all");
      setMakeFilter("all");
      setModelFilter("all");
      setCurrentPage(1);
      setSoldCurrentPage(1);
    }
  }, [open]);

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

  // Extract unique values for filters with counts
  const { years, makes, models } = useMemo(() => {
    const vehicles = inventoryData?.vehicles || [];
    const yearCounts: Record<number, number> = {};
    const makeCounts: Record<string, number> = {};
    const modelCounts: Record<string, number> = {};

    // Count occurrences considering current filters
    vehicles.forEach((v: any) => {
      // Year counts (consider make and model filters)
      if (v.year && (makeFilter === "all" || v.make === makeFilter) && (modelFilter === "all" || v.model === modelFilter)) {
        yearCounts[v.year] = (yearCounts[v.year] || 0) + 1;
      }

      // Make counts (consider year and model filters)
      if (v.make && (yearFilter === "all" || v.year === parseInt(yearFilter)) && (modelFilter === "all" || v.model === modelFilter)) {
        makeCounts[v.make] = (makeCounts[v.make] || 0) + 1;
      }

      // Model counts (consider year and make filters)
      if (v.model && (yearFilter === "all" || v.year === parseInt(yearFilter)) && (makeFilter === "all" || v.make === makeFilter)) {
        modelCounts[v.model] = (modelCounts[v.model] || 0) + 1;
      }
    });

    return {
      years: Object.entries(yearCounts)
        .map(([year, count]) => ({ value: parseInt(year), count }))
        .sort((a, b) => b.value - a.value),
      makes: Object.entries(makeCounts)
        .map(([make, count]) => ({ value: make, count }))
        .sort((a, b) => a.value.localeCompare(b.value)),
      models: Object.entries(modelCounts)
        .map(([model, count]) => ({ value: model, count }))
        .sort((a, b) => a.value.localeCompare(b.value)),
    };
  }, [inventoryData, yearFilter, makeFilter, modelFilter]);

  // Filter and paginate current inventory
  const { filteredInventory, totalPages, paginatedInventory } = useMemo(() => {
    let filtered = inventoryData?.vehicles || [];

    // Apply filters
    if (yearFilter !== "all") {
      filtered = filtered.filter((v: any) => v.year === parseInt(yearFilter));
    }
    if (makeFilter !== "all") {
      filtered = filtered.filter((v: any) => v.make === makeFilter);
    }
    if (modelFilter !== "all") {
      filtered = filtered.filter((v: any) => v.model === modelFilter);
    }

    // Sort by price (ascending)
    filtered = filtered.sort((a: any, b: any) => {
      const priceA = parseFloat(a.currentPrice || 0);
      const priceB = parseFloat(b.currentPrice || 0);
      return priceA - priceB;
    });

    // Calculate pagination
    const total = Math.ceil(filtered.length / pageSize);
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginated = filtered.slice(startIndex, endIndex);

    return {
      filteredInventory: filtered,
      totalPages: total,
      paginatedInventory: paginated,
    };
  }, [inventoryData, yearFilter, makeFilter, modelFilter, currentPage, pageSize]);

  // Paginate sold vehicles
  const { paginatedSales, soldTotalPages } = useMemo(() => {
    const sales = salesData?.vehicles || [];
    const total = Math.ceil(sales.length / pageSize);
    const startIndex = (soldCurrentPage - 1) * pageSize;
    const endIndex = startIndex + pageSize;
    const paginated = sales.slice(startIndex, endIndex);

    return {
      paginatedSales: paginated,
      soldTotalPages: total,
    };
  }, [salesData, soldCurrentPage, pageSize]);

  // Reset to page 1 when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [yearFilter, makeFilter, modelFilter]);

  // Pagination component
  const PaginationControls = ({ currentPage, totalPages, onPageChange }: { currentPage: number; totalPages: number; onPageChange: (page: number) => void }) => {
    if (totalPages <= 1) return null;

    return (
      <div className="flex items-center justify-end gap-3 mb-4">
        <div className="text-sm text-muted-foreground">
          Page {currentPage} of {totalPages}
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage === 1}
          >
            <ChevronLeft className="h-4 w-4" />
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage === totalPages}
          >
            Next
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };

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

        {/* Filters */}
        <Card className="mb-4">
          <CardContent className="pt-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">Year</label>
                <Select value={yearFilter} onValueChange={setYearFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Years" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Years</SelectItem>
                    {years.map((year) => (
                      <SelectItem key={year.value} value={year.value.toString()}>
                        {year.value} ({year.count})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">Make</label>
                <Select value={makeFilter} onValueChange={setMakeFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Makes" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Makes</SelectItem>
                    {makes.map((make) => (
                      <SelectItem key={make.value} value={make.value}>
                        {make.value} ({make.count})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1">
                <label className="text-sm font-medium mb-2 block">Model</label>
                <Select value={modelFilter} onValueChange={setModelFilter}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Models" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Models</SelectItem>
                    {models.map((model) => (
                      <SelectItem key={model.value} value={model.value}>
                        {model.value} ({model.count})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {(yearFilter !== "all" || makeFilter !== "all" || modelFilter !== "all") && (
                <div className="flex items-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setYearFilter("all");
                      setMakeFilter("all");
                      setModelFilter("all");
                    }}
                  >
                    Clear Filters
                  </Button>
                </div>
              )}
            </div>
            {filteredInventory.length !== inventoryData?.vehicles?.length && (
              <div className="mt-3 text-sm text-muted-foreground">
                Showing {filteredInventory.length} of {inventoryData?.vehicles?.length || 0} vehicles
              </div>
            )}
          </CardContent>
        </Card>

        {/* Tabs */}
        <Tabs defaultValue="current" className="w-full" onValueChange={setCurrentTab}>
          <TabsList>
            <TabsTrigger value="current">
              Current Inventory ({filteredInventory.length})
            </TabsTrigger>
            <TabsTrigger value="sold">
              Sold This Month ({salesData?.vehicles?.length || 0})
            </TabsTrigger>
          </TabsList>

          {/* Current Inventory Tab */}
          <TabsContent value="current" className="space-y-4">
            {paginatedInventory && paginatedInventory.length > 0 ? (
              <>
                {/* Pagination */}
                <PaginationControls
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={setCurrentPage}
                />

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
                      {paginatedInventory.map((vehicle: any) => (
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
                  {paginatedInventory.map((vehicle: any) => (
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
            {paginatedSales && paginatedSales.length > 0 ? (
              <>
                {/* Pagination */}
                <PaginationControls
                  currentPage={soldCurrentPage}
                  totalPages={soldTotalPages}
                  onPageChange={setSoldCurrentPage}
                />

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
                      {paginatedSales.map((vehicle: any) => {
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
                  {paginatedSales.map((vehicle: any) => {
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
