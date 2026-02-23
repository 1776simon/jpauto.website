import { useQuery } from "@tanstack/react-query";
import api from "@/services/api";
import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  RefreshCw,
  TrendingDown,
  TrendingUp,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface CompetitorDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  competitor: any;
}

const MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

export function CompetitorDetailModal({ open, onOpenChange, competitor }: CompetitorDetailModalProps) {
  // Inventory tab state
  const [currentPage, setCurrentPage] = useState(1);
  const [yearFilter, setYearFilter] = useState("all");
  const [makeFilter, setMakeFilter] = useState("all");
  const [modelFilter, setModelFilter] = useState("all");
  const [sortBy, setSortBy] = useState("days-newest");

  // Sales tab state
  const now = new Date();
  const [salesMonth, setSalesMonth] = useState(now.getMonth() + 1);
  const [salesYear, setSalesYear] = useState(now.getFullYear());
  const [soldCurrentPage, setSoldCurrentPage] = useState(1);
  const SOLD_PAGE_SIZE = 20;

  // Sales chart state
  const [chartMake, setChartMake] = useState("all");
  const [chartModel, setChartModel] = useState("all");

  // Trends state
  const [trendDays, setTrendDays] = useState<number>(90);
  const [activeTab, setActiveTab] = useState("inventory");

  // Reset all state when modal closes
  useEffect(() => {
    if (!open) {
      setCurrentPage(1);
      setYearFilter("all");
      setMakeFilter("all");
      setModelFilter("all");
      setSortBy("days-newest");
      setSalesMonth(new Date().getMonth() + 1);
      setSalesYear(new Date().getFullYear());
      setSoldCurrentPage(1);
      setChartMake("all");
      setChartModel("all");
      setTrendDays(90);
      setActiveTab("inventory");
    }
  }, [open]);

  // Reset page when inventory filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [yearFilter, makeFilter, modelFilter, sortBy]);

  // Reset sold page when month changes
  useEffect(() => {
    setSoldCurrentPage(1);
  }, [salesMonth, salesYear]);

  // ── Queries ──────────────────────────────────────────────────────────────

  const { data: competitorDetail } = useQuery({
    queryKey: ["competitor", competitor.id],
    queryFn: () => api.getCompetitorById(competitor.id),
    enabled: open,
  });

  const { data: inventoryFilters } = useQuery({
    queryKey: ["competitorInventoryFilters", competitor.id],
    queryFn: () => api.getCompetitorInventoryFilters(competitor.id),
    enabled: open,
  });

  const { data: inventoryData, isLoading: inventoryLoading } = useQuery({
    queryKey: ["competitorInventory", competitor.id, currentPage, yearFilter, makeFilter, modelFilter, sortBy],
    queryFn: () =>
      api.getCompetitorInventory(competitor.id, currentPage, 20, {
        year: yearFilter !== "all" ? yearFilter : undefined,
        make: makeFilter !== "all" ? makeFilter : undefined,
        model: modelFilter !== "all" ? modelFilter : undefined,
        sortBy,
      }),
    enabled: open,
  });

  const { data: salesData, isLoading: salesLoading } = useQuery({
    queryKey: ["competitorSales", competitor.id, salesMonth, salesYear],
    queryFn: () => api.getCompetitorSales(competitor.id, salesMonth, salesYear),
    enabled: open,
  });

  const { data: salesSummary, isLoading: chartLoading } = useQuery({
    queryKey: ["competitorSalesSummary", competitor.id, chartMake, chartModel],
    queryFn: () =>
      api.getCompetitorSalesSummary(competitor.id, {
        months: 12,
        make: chartMake !== "all" ? chartMake : undefined,
        model: chartModel !== "all" ? chartModel : undefined,
      }),
    enabled: open,
  });

  const { data: metricsData, isLoading: metricsLoading } = useQuery({
    queryKey: ["competitorMetrics", competitor.id, trendDays],
    queryFn: () => api.getCompetitorMetrics(competitor.id, trendDays),
    enabled: open && activeTab === "trends",
  });

  // ── Helpers ───────────────────────────────────────────────────────────────

  const formatCurrency = (value: number | null | undefined) => {
    if (value === null || value === undefined) return "N/A";
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value);
  };

  const formatDate = (date: string | null | undefined) => {
    if (!date) return "N/A";
    return new Date(date).toLocaleDateString();
  };

  const timeAgo = (date: string | null | undefined) => {
    if (!date) return "Never";
    try {
      const diffMs = Date.now() - new Date(date).getTime();
      const diffDays = Math.floor(diffMs / 86400000);
      const diffHrs = Math.floor(diffMs / 3600000);
      if (diffDays > 0) return `${diffDays}d ago`;
      if (diffHrs > 0) return `${diffHrs}h ago`;
      return "Just now";
    } catch {
      return "Never";
    }
  };

  const calcDaysOnMarket = (firstSeen: string) =>
    Math.floor((Date.now() - new Date(firstSeen).getTime()) / 86400000);

  const navigateMonth = (direction: number) => {
    const d = new Date(salesYear, salesMonth - 1 + direction, 1);
    setSalesMonth(d.getMonth() + 1);
    setSalesYear(d.getFullYear());
  };

  const isCurrentMonth = salesMonth === now.getMonth() + 1 && salesYear === now.getFullYear();

  // ── Derived data ──────────────────────────────────────────────────────────

  const stats = competitorDetail?.stats || competitor.stats || {};

  const inventoryTotal = inventoryData?.total ?? 0;
  const inventoryTotalPages = Math.ceil(inventoryTotal / 20);

  const soldVehicles = salesData?.vehicles || [];
  const soldTotalPages = Math.ceil(soldVehicles.length / SOLD_PAGE_SIZE);
  const paginatedSales = soldVehicles.slice(
    (soldCurrentPage - 1) * SOLD_PAGE_SIZE,
    soldCurrentPage * SOLD_PAGE_SIZE
  );

  const salesChartData = (salesSummary?.months || []).map((m: any) => ({
    name: m.label,
    "Under $10k": m.buckets.under10k,
    "$10k-$20k": m.buckets.from10to20k,
    "$20k-$30k": m.buckets.from20to30k,
    "Over $30k": m.buckets.over30k,
    total: m.count,
    avgPrice: m.avgSalePrice,
  }));

  const trendChartData = (metricsData || []).map((m: any) => ({
    date: new Date(m.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    inventory: m.totalInventory,
    dom: m.avgDaysOnMarket ? parseFloat(m.avgDaysOnMarket) : null,
    price: m.avgSalePrice ? Math.round(parseFloat(m.avgSalePrice)) : null,
  }));

  // ── Reusable pagination ───────────────────────────────────────────────────

  const PaginationControls = ({
    current,
    total,
    onChange,
  }: {
    current: number;
    total: number;
    onChange: (p: number) => void;
  }) => {
    if (total <= 1) return null;
    return (
      <div className="flex items-center justify-end gap-3 mb-3">
        <span className="text-sm text-muted-foreground">
          Page {current} of {total}
        </span>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => onChange(current - 1)} disabled={current === 1}>
            <ChevronLeft className="h-4 w-4" /> Previous
          </Button>
          <Button variant="outline" size="sm" onClick={() => onChange(current + 1)} disabled={current === total}>
            Next <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  };

  // ── Render ────────────────────────────────────────────────────────────────

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{competitor.name}</DialogTitle>
          <DialogDescription>Competitor inventory and sales tracking</DialogDescription>
        </DialogHeader>

        {/* Summary Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
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
              <div className="text-3xl font-bold">
                {stats.avgDaysOnMarket || 0}
                <span className="text-lg text-muted-foreground"> days</span>
              </div>
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
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList>
            <TabsTrigger value="inventory">
              Current Inventory {inventoryTotal > 0 ? `(${inventoryTotal})` : ""}
            </TabsTrigger>
            <TabsTrigger value="sales">Sales</TabsTrigger>
            <TabsTrigger value="trends">Trends</TabsTrigger>
          </TabsList>

          {/* ── Current Inventory Tab ── */}
          <TabsContent value="inventory" className="space-y-4 mt-4">
            {/* Filter bar */}
            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="flex flex-col md:flex-row gap-3 flex-wrap">
                  <div className="flex-1 min-w-[120px]">
                    <label className="text-xs font-medium mb-1 block text-muted-foreground">Year</label>
                    <Select value={yearFilter} onValueChange={setYearFilter}>
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="All Years" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Years</SelectItem>
                        {(inventoryFilters?.years || []).map((y: any) => (
                          <SelectItem key={y.year} value={y.year.toString()}>
                            {y.year} ({y.count})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1 min-w-[140px]">
                    <label className="text-xs font-medium mb-1 block text-muted-foreground">Make</label>
                    <Select value={makeFilter} onValueChange={setMakeFilter}>
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="All Makes" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Makes</SelectItem>
                        {(inventoryFilters?.makes || []).map((m: any) => (
                          <SelectItem key={m.make} value={m.make}>
                            {m.make} ({m.count})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1 min-w-[140px]">
                    <label className="text-xs font-medium mb-1 block text-muted-foreground">Model</label>
                    <Select value={modelFilter} onValueChange={setModelFilter}>
                      <SelectTrigger className="h-9">
                        <SelectValue placeholder="All Models" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Models</SelectItem>
                        {(inventoryFilters?.models || []).map((m: any) => (
                          <SelectItem key={m.model} value={m.model}>
                            {m.model} ({m.count})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex-1 min-w-[180px]">
                    <label className="text-xs font-medium mb-1 block text-muted-foreground">Sort By</label>
                    <Select value={sortBy} onValueChange={setSortBy}>
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="days-newest">Newest First</SelectItem>
                        <SelectItem value="days-oldest">Oldest First</SelectItem>
                        <SelectItem value="price-asc">Price: Low to High</SelectItem>
                        <SelectItem value="price-desc">Price: High to Low</SelectItem>
                        <SelectItem value="mileage-asc">Mileage: Low to High</SelectItem>
                        <SelectItem value="mileage-desc">Mileage: High to Low</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {(yearFilter !== "all" || makeFilter !== "all" || modelFilter !== "all") && (
                    <div className="flex items-end">
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-9"
                        onClick={() => {
                          setYearFilter("all");
                          setMakeFilter("all");
                          setModelFilter("all");
                        }}
                      >
                        Clear
                      </Button>
                    </div>
                  )}
                </div>
                {inventoryTotal > 0 && (
                  <p className="text-xs text-muted-foreground mt-2">
                    {inventoryTotal} vehicle{inventoryTotal !== 1 ? "s" : ""}
                    {yearFilter !== "all" || makeFilter !== "all" || modelFilter !== "all" ? " matching filters" : " total"}
                  </p>
                )}
              </CardContent>
            </Card>

            {inventoryLoading ? (
              <div className="flex justify-center py-12">
                <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : (inventoryData?.vehicles || []).length > 0 ? (
              <>
                <PaginationControls current={currentPage} total={inventoryTotalPages} onChange={setCurrentPage} />
                {/* Desktop */}
                <div className="hidden md:block border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date Added</TableHead>
                        <TableHead>VIN/Stock#</TableHead>
                        <TableHead>Vehicle</TableHead>
                        <TableHead>Mileage</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Days Listed</TableHead>
                        <TableHead>Last Updated</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {(inventoryData?.vehicles || []).map((v: any) => (
                        <TableRow key={v.id}>
                          <TableCell className="text-sm">{formatDate(v.firstSeenAt)}</TableCell>
                          <TableCell className="font-mono text-xs">
                            <div className="flex items-center gap-2">
                              {v.vin || v.stockNumber || "N/A"}
                              {!v.hasVin && <Badge variant="secondary" className="text-xs">Stock# Only</Badge>}
                              {v.isDuplicateVin && (
                                <AlertCircle className="h-4 w-4 text-amber-500" title={v.duplicateWarning} />
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div>
                              {v.year} {v.make} {v.model}
                              {v.trim && <div className="text-xs text-muted-foreground">{v.trim}</div>}
                            </div>
                          </TableCell>
                          <TableCell>{v.mileage ? v.mileage.toLocaleString() : "N/A"}</TableCell>
                          <TableCell className="font-semibold">{formatCurrency(v.currentPrice)}</TableCell>
                          <TableCell>{calcDaysOnMarket(v.firstSeenAt)} days</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{timeAgo(v.lastUpdatedAt)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
                {/* Mobile */}
                <div className="md:hidden space-y-3">
                  {(inventoryData?.vehicles || []).map((v: any) => (
                    <Card key={v.id}>
                      <CardContent className="p-4">
                        <div className="font-medium mb-1">{v.year} {v.make} {v.model}</div>
                        {v.trim && <div className="text-xs text-muted-foreground mb-1">{v.trim}</div>}
                        <div className="text-2xl font-bold mb-3">{formatCurrency(v.currentPrice)}</div>
                        <div className="grid grid-cols-2 gap-2 text-sm">
                          <div><div className="text-muted-foreground">Mileage</div><div>{v.mileage?.toLocaleString() || "N/A"}</div></div>
                          <div><div className="text-muted-foreground">Days Listed</div><div>{calcDaysOnMarket(v.firstSeenAt)} days</div></div>
                        </div>
                        <div className="text-xs text-muted-foreground mt-2">Added: {formatDate(v.firstSeenAt)}</div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              </>
            ) : (
              <div className="text-center py-12 text-muted-foreground">
                <RefreshCw className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>No inventory matching filters</p>
              </div>
            )}
          </TabsContent>

          {/* ── Sales Tab ── */}
          <TabsContent value="sales" className="space-y-6 mt-4">

            {/* Sales Analytics Chart */}
            <Card>
              <CardHeader className="pb-3">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                  <CardTitle className="text-base">Monthly Sales — Last 12 Months</CardTitle>
                  <div className="flex gap-2">
                    <Select value={chartMake} onValueChange={(v) => { setChartMake(v); setChartModel("all"); }}>
                      <SelectTrigger className="h-8 w-[130px]">
                        <SelectValue placeholder="All Makes" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Makes</SelectItem>
                        {(salesSummary?.filters?.makes || []).map((m: string) => (
                          <SelectItem key={m} value={m}>{m}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select value={chartModel} onValueChange={setChartModel}>
                      <SelectTrigger className="h-8 w-[130px]">
                        <SelectValue placeholder="All Models" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Models</SelectItem>
                        {(salesSummary?.filters?.models || []).map((m: string) => (
                          <SelectItem key={m} value={m}>{m}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                {chartLoading ? (
                  <div className="flex justify-center py-8">
                    <RefreshCw className="h-6 w-6 animate-spin text-muted-foreground" />
                  </div>
                ) : salesChartData.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground text-sm">
                    No sales data available
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={260}>
                    <BarChart data={salesChartData} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
                      <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                      <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                      <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                      <Tooltip
                        formatter={(value: any, name: string) => [value, name]}
                        labelFormatter={(label) => `${label}`}
                        content={({ active, payload, label }) => {
                          if (!active || !payload?.length) return null;
                          const total = payload.reduce((s: number, p: any) => s + (p.value || 0), 0);
                          const avgPrice = payload[0]?.payload?.avgPrice;
                          return (
                            <div className="bg-background border rounded-lg p-3 shadow-md text-sm">
                              <p className="font-semibold mb-2">{label}</p>
                              {payload.map((p: any) => (
                                <div key={p.name} className="flex items-center gap-2">
                                  <div className="w-2 h-2 rounded-full" style={{ background: p.fill }} />
                                  <span className="text-muted-foreground">{p.name}:</span>
                                  <span className="font-medium">{p.value}</span>
                                </div>
                              ))}
                              <div className="border-t mt-2 pt-2 space-y-1">
                                <div className="flex justify-between gap-4">
                                  <span className="text-muted-foreground">Total sold:</span>
                                  <span className="font-semibold">{total}</span>
                                </div>
                                {avgPrice && (
                                  <div className="flex justify-between gap-4">
                                    <span className="text-muted-foreground">Avg price:</span>
                                    <span className="font-semibold">
                                      {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(avgPrice)}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </div>
                          );
                        }}
                      />
                      <Legend wrapperStyle={{ fontSize: 12 }} />
                      <Bar dataKey="Under $10k" stackId="a" fill="#3b82f6" />
                      <Bar dataKey="$10k-$20k" stackId="a" fill="#22c55e" />
                      <Bar dataKey="$20k-$30k" stackId="a" fill="#eab308" />
                      <Bar dataKey="Over $30k" stackId="a" fill="#ef4444" radius={[3, 3, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Month Navigator + Sold Table */}
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Button variant="outline" size="sm" onClick={() => navigateMonth(-1)}>
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="font-semibold text-base min-w-[120px] text-center">
                  {MONTH_NAMES[salesMonth - 1]} {salesYear}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => navigateMonth(1)}
                  disabled={isCurrentMonth}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
                {salesLoading && <RefreshCw className="h-4 w-4 animate-spin text-muted-foreground" />}
                <span className="text-sm text-muted-foreground ml-auto">
                  {soldVehicles.length} sold
                </span>
              </div>

              {soldVehicles.length > 0 ? (
                <>
                  <PaginationControls current={soldCurrentPage} total={soldTotalPages} onChange={setSoldCurrentPage} />
                  {/* Desktop */}
                  <div className="hidden md:block border rounded-lg">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Sold Date</TableHead>
                          <TableHead>VIN/Stock#</TableHead>
                          <TableHead>Vehicle</TableHead>
                          <TableHead>Mileage</TableHead>
                          <TableHead>Initial Price</TableHead>
                          <TableHead>Sale Price</TableHead>
                          <TableHead>Price Change</TableHead>
                          <TableHead>Days on Market</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {paginatedSales.map((v: any) => {
                          const priceChange = parseFloat(v.currentPrice || 0) - parseFloat(v.initialPrice || 0);
                          return (
                            <TableRow key={v.id}>
                              <TableCell className="text-sm">{formatDate(v.soldAt)}</TableCell>
                              <TableCell className="font-mono text-xs">{v.vin || v.stockNumber || "N/A"}</TableCell>
                              <TableCell>
                                <div>
                                  {v.year} {v.make} {v.model}
                                  {v.trim && <div className="text-xs text-muted-foreground">{v.trim}</div>}
                                </div>
                              </TableCell>
                              <TableCell>{v.mileage ? v.mileage.toLocaleString() : "N/A"}</TableCell>
                              <TableCell>{formatCurrency(v.initialPrice)}</TableCell>
                              <TableCell className="font-semibold">{formatCurrency(v.currentPrice)}</TableCell>
                              <TableCell>
                                {priceChange !== 0 ? (
                                  <span className={`flex items-center gap-1 ${priceChange < 0 ? "text-red-500" : "text-green-500"}`}>
                                    {priceChange < 0 ? <TrendingDown className="h-3 w-3" /> : <TrendingUp className="h-3 w-3" />}
                                    {formatCurrency(Math.abs(priceChange))}
                                  </span>
                                ) : (
                                  <span className="text-muted-foreground">No change</span>
                                )}
                              </TableCell>
                              <TableCell>{v.daysOnMarket || 0} days</TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  </div>
                  {/* Mobile */}
                  <div className="md:hidden space-y-3">
                    {paginatedSales.map((v: any) => {
                      const priceChange = parseFloat(v.currentPrice || 0) - parseFloat(v.initialPrice || 0);
                      return (
                        <Card key={v.id}>
                          <CardContent className="p-4">
                            <div className="font-medium mb-1">{v.year} {v.make} {v.model}</div>
                            <div className="flex items-center justify-between mb-3">
                              <div>
                                <div className="text-xs text-muted-foreground">Sale Price</div>
                                <div className="text-2xl font-bold">{formatCurrency(v.currentPrice)}</div>
                              </div>
                              {priceChange !== 0 && (
                                <Badge variant="outline" className={priceChange < 0 ? "text-red-600 border-red-600" : "text-green-600 border-green-600"}>
                                  {priceChange < 0 ? "-" : "+"}{formatCurrency(Math.abs(priceChange))}
                                </Badge>
                              )}
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div><div className="text-muted-foreground">Mileage</div><div>{v.mileage?.toLocaleString() || "N/A"}</div></div>
                              <div><div className="text-muted-foreground">Days on Market</div><div>{v.daysOnMarket || 0} days</div></div>
                            </div>
                            <div className="text-xs text-muted-foreground mt-2">Sold: {formatDate(v.soldAt)}</div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                </>
              ) : (
                <div className="text-center py-8 text-muted-foreground text-sm">
                  {salesLoading ? "Loading..." : `No sales recorded for ${MONTH_NAMES[salesMonth - 1]} ${salesYear}`}
                </div>
              )}
            </div>
          </TabsContent>

          {/* ── Trends Tab ── */}
          <TabsContent value="trends" className="space-y-4 mt-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">Historical metrics from daily snapshots</p>
              <div className="flex gap-1">
                {[30, 60, 90].map((d) => (
                  <Button
                    key={d}
                    variant={trendDays === d ? "default" : "outline"}
                    size="sm"
                    onClick={() => setTrendDays(d)}
                  >
                    {d}d
                  </Button>
                ))}
              </div>
            </div>

            {metricsLoading ? (
              <div className="flex justify-center py-12">
                <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : trendChartData.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p className="font-medium">No trend data available yet</p>
                <p className="text-sm mt-1">Data accumulates from daily scrapes</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Inventory Size */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Inventory Size</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={180}>
                      <LineChart data={trendChartData} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="date" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                        <YAxis allowDecimals={false} tick={{ fontSize: 10 }} width={30} />
                        <Tooltip contentStyle={{ fontSize: 12 }} />
                        <Line type="monotone" dataKey="inventory" stroke="#3b82f6" strokeWidth={2} dot={false} name="Vehicles" />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Avg Days on Market */}
                <Card>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Avg Days on Market</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={180}>
                      <LineChart data={trendChartData} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="date" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                        <YAxis allowDecimals={false} tick={{ fontSize: 10 }} width={30} />
                        <Tooltip contentStyle={{ fontSize: 12 }} formatter={(v: any) => [`${Math.round(v)} days`, "Avg DOM"]} />
                        <Line type="monotone" dataKey="dom" stroke="#f59e0b" strokeWidth={2} dot={false} name="Avg DOM" connectNulls />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Avg Sale Price */}
                <Card className="md:col-span-2">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Avg Sale Price</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={180}>
                      <LineChart data={trendChartData} margin={{ top: 4, right: 16, left: 0, bottom: 4 }}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="date" tick={{ fontSize: 10 }} interval="preserveStartEnd" />
                        <YAxis
                          tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`}
                          tick={{ fontSize: 10 }}
                          width={40}
                        />
                        <Tooltip
                          contentStyle={{ fontSize: 12 }}
                          formatter={(v: any) => [
                            new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(v),
                            "Avg Sale Price",
                          ]}
                        />
                        <Line type="monotone" dataKey="price" stroke="#22c55e" strokeWidth={2} dot={false} name="Avg Sale Price" connectNulls />
                      </LineChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
