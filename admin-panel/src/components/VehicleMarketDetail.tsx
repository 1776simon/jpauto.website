import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import api from "@/services/api";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, TrendingUp, TrendingDown, AlertTriangle, CheckCircle, ExternalLink, ChevronLeft, ChevronRight } from "lucide-react";
import { useState, useMemo } from "react";

interface VehicleMarketDetailProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicleId: string;
  vehicleName: string;
  ourPrice: number;
}

const COLORS = ['#ff6b35', '#f7931e', '#fdc500', '#7cb342', '#0288d1', '#5e35b1'];

// Format currency for charts
const formatCurrency = (value: number) => {
  return `$${value.toLocaleString()}`;
};

export function VehicleMarketDetail({ open, onOpenChange, vehicleId, vehicleName, ourPrice }: VehicleMarketDetailProps) {
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 20;

  const { data, isLoading } = useQuery({
    queryKey: ["vehicleMarketDetail", vehicleId],
    queryFn: () => api.getVehicleMarketDetail(vehicleId),
    enabled: open && !!vehicleId,
  });

  if (isLoading) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  if (!data || !data.hasMarketData) {
    return (
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{vehicleName}</DialogTitle>
            <DialogDescription>
              No market data available for this vehicle yet. Run an analysis to generate market insights.
            </DialogDescription>
          </DialogHeader>
        </DialogContent>
      </Dialog>
    );
  }

  const { snapshot, priceHistory, domAnalysis, competitorListings, marketVelocity } = data;

  // Pagination
  const totalPages = Math.ceil((competitorListings?.length || 0) / pageSize);
  const paginatedListings = useMemo(() => {
    if (!competitorListings) return [];
    const start = (currentPage - 1) * pageSize;
    return competitorListings.slice(start, start + pageSize);
  }, [competitorListings, currentPage, pageSize]);

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

  // Prepare price history for chart
  const priceChartData = (priceHistory || []).map((item: any) => ({
    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    Minimum: parseFloat(item.min_price || 0),
    Median: parseFloat(item.median_price || 0),
    Maximum: parseFloat(item.max_price || 0),
    'Our Price': ourPrice
  }));

  // Price position calculation
  const priceRange = (snapshot?.maxPrice || 0) - (snapshot?.minPrice || 0);
  const ourPosition = priceRange > 0 ? ((ourPrice - (snapshot?.minPrice || 0)) / priceRange) * 100 : 50;
  const medianPosition = priceRange > 0 ? (((snapshot?.medianPrice || 0) - (snapshot?.minPrice || 0)) / priceRange) * 100 : 50;

  // DOM histogram data
  const domChartData = domAnalysis?.histogram || [];

  // Market velocity badge
  const getVelocityBadge = () => {
    switch (marketVelocity?.trend) {
      case 'buyers_market':
        return <Badge variant="destructive" className="text-sm"><AlertTriangle className="h-3 w-3 mr-1" />Buyer's Market</Badge>;
      case 'sellers_market':
        return <Badge variant="default" className="text-sm bg-green-600"><TrendingUp className="h-3 w-3 mr-1" />Seller's Market</Badge>;
      default:
        return <Badge variant="secondary" className="text-sm"><CheckCircle className="h-3 w-3 mr-1" />Stable Market</Badge>;
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">{vehicleName} - Market Analysis</DialogTitle>
          <DialogDescription>
            Comprehensive market intelligence • {snapshot?.uniqueListings || 0} competitor listings
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Market Velocity Alert */}
          {marketVelocity && (
            <div className="p-4 rounded-lg border bg-muted/50">
              <div className="flex items-start gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    {getVelocityBadge()}
                  </div>
                  <p className="text-sm">{marketVelocity.message || 'No market velocity data available'}</p>
                </div>
              </div>
            </div>
          )}

          {/* Price Position Indicator */}
          {snapshot && snapshot.minPrice !== undefined && snapshot.maxPrice !== undefined && (
            <div className="space-y-2">
              <h3 className="font-semibold">Price Position</h3>
              <div className="relative h-12 bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 rounded-lg">
                {/* Min marker */}
                <div className="absolute left-0 top-0 bottom-0 flex items-center">
                  <div className="bg-background px-2 py-1 rounded text-xs font-medium border">
                    Min: ${(snapshot.minPrice || 0).toLocaleString()}
                  </div>
                </div>

                {/* Our price marker */}
                <div className="absolute top-0 bottom-0 flex items-center" style={{ left: `${ourPosition}%`, transform: 'translateX(-50%)' }}>
                  <div className="bg-primary text-primary-foreground px-2 py-1 rounded text-xs font-bold border-2 border-primary-foreground">
                    Us: ${ourPrice.toLocaleString()}
                  </div>
                </div>

                {/* Median marker */}
                <div className="absolute top-0 bottom-0 flex items-center" style={{ left: `${medianPosition}%`, transform: 'translateX(-50%)' }}>
                  <div className="bg-background px-2 py-1 rounded text-xs font-medium border">
                    Median: ${(snapshot.medianPrice || 0).toLocaleString()}
                  </div>
                </div>

                {/* Max marker */}
                <div className="absolute right-0 top-0 bottom-0 flex items-center">
                  <div className="bg-background px-2 py-1 rounded text-xs font-medium border">
                    Max: ${(snapshot.maxPrice || 0).toLocaleString()}
                  </div>
                </div>
              </div>
              <div className="flex justify-between text-xs text-muted-foreground mt-1">
                <span>{ourPrice < (snapshot.medianPrice || 0) ? `$${((snapshot.medianPrice || 0) - ourPrice).toLocaleString()} below median` : `$${(ourPrice - (snapshot.medianPrice || 0)).toLocaleString()} above median`}</span>
                <span>{ourPrice < (snapshot.minPrice || 0) ? `$${((snapshot.minPrice || 0) - ourPrice).toLocaleString()} below minimum` : ourPrice > (snapshot.minPrice || 0) ? `$${(ourPrice - (snapshot.minPrice || 0)).toLocaleString()} above minimum` : 'At minimum price'}</span>
              </div>
            </div>
          )}

          {/* Price Trend Chart */}
          {priceChartData.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold">30-Day Price Trends</h3>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={priceChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} tickFormatter={formatCurrency} />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Legend />
                  <Line type="monotone" dataKey="Minimum" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="Median" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="Maximum" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                  <Line type="monotone" dataKey="Our Price" stroke="#ff6b35" strokeWidth={3} strokeDasharray="5 5" dot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}

          {/* Days on Market Analysis */}
          {domAnalysis?.average && (
            <div className="space-y-2">
              <h3 className="font-semibold">Days on Market Distribution</h3>
              <div className="mb-3 grid grid-cols-3 gap-2 text-sm">
                <div className="text-center p-2 rounded border">
                  <div className="text-2xl font-bold">{domAnalysis.average}</div>
                  <div className="text-muted-foreground">Avg Days</div>
                </div>
                <div className="text-center p-2 rounded border">
                  <div className="text-2xl font-bold">{domAnalysis.min}</div>
                  <div className="text-muted-foreground">Fastest</div>
                </div>
                <div className="text-center p-2 rounded border">
                  <div className="text-2xl font-bold">{domAnalysis.max}</div>
                  <div className="text-muted-foreground">Slowest</div>
                </div>
              </div>
              {domChartData.length > 0 && (
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={domChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="range" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#7cb342" name="Listings" />
                  </BarChart>
                </ResponsiveContainer>
              )}
            </div>
          )}

          {/* Competitor Listings Table */}
          {competitorListings && competitorListings.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold">Competitor Listings ({competitorListings.length})</h3>

              {/* Pagination */}
              <PaginationControls
                currentPage={currentPage}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
              />

              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>VIN</TableHead>
                      <TableHead>Price</TableHead>
                      <TableHead>Δ from Ours</TableHead>
                      <TableHead>Mileage</TableHead>
                      <TableHead>Trim</TableHead>
                      <TableHead>Location</TableHead>
                      <TableHead>VDP</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paginatedListings.map((listing: any, index: number) => {
                      const price = listing.price || 0;
                      return (
                        <TableRow key={index}>
                          <TableCell className="font-mono text-xs">...{listing.vinLast4 || 'N/A'}</TableCell>
                          <TableCell className="font-semibold">${price.toLocaleString()}</TableCell>
                          <TableCell>
                            {price < ourPrice ? (
                              <span className="text-red-600 flex items-center gap-1">
                                <TrendingDown className="h-3 w-3" />
                                -${(ourPrice - price).toLocaleString()}
                              </span>
                            ) : (
                              <span className="text-green-600 flex items-center gap-1">
                                <TrendingUp className="h-3 w-3" />
                                +${(price - ourPrice).toLocaleString()}
                              </span>
                            )}
                          </TableCell>
                          <TableCell>{listing.mileage?.toLocaleString() || 'N/A'}</TableCell>
                          <TableCell>{listing.trim || 'N/A'}</TableCell>
                          <TableCell>{listing.location || 'N/A'}</TableCell>
                          <TableCell>
                            {listing.url ? (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 px-2"
                                onClick={() => window.open(listing.url, '_blank')}
                              >
                                <ExternalLink className="h-3 w-3" />
                              </Button>
                            ) : (
                              <span className="text-xs text-muted-foreground">N/A</span>
                            )}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
