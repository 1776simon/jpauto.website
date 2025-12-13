import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useQuery } from "@tanstack/react-query";
import api from "@/services/api";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Loader2, TrendingUp, TrendingDown, AlertTriangle, CheckCircle } from "lucide-react";

interface VehicleMarketDetailProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  vehicleId: string;
  vehicleName: string;
  ourPrice: number;
}

const COLORS = ['#ff6b35', '#f7931e', '#fdc500', '#7cb342', '#0288d1', '#5e35b1'];

export function VehicleMarketDetail({ open, onOpenChange, vehicleId, vehicleName, ourPrice }: VehicleMarketDetailProps) {
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

  const { snapshot, priceHistory, platformDistribution, domAnalysis, competitorListings, marketVelocity } = data;

  // Prepare price history for chart
  const priceChartData = priceHistory.map((item: any) => ({
    date: new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    Minimum: parseFloat(item.min_price || 0),
    Median: parseFloat(item.median_price || 0),
    Maximum: parseFloat(item.max_price || 0),
    'Our Price': ourPrice
  }));

  // Price position calculation
  const priceRange = snapshot.maxPrice - snapshot.minPrice;
  const ourPosition = ((ourPrice - snapshot.minPrice) / priceRange) * 100;
  const medianPosition = ((snapshot.medianPrice - snapshot.minPrice) / priceRange) * 100;

  // Platform chart data
  const platformChartData = platformDistribution.distribution.map((item: any) => ({
    name: item.platform,
    listings: item.listingCount,
    uniqueVINs: item.uniqueVINs
  }));

  // DOM histogram data
  const domChartData = domAnalysis.histogram || [];

  // Market velocity badge
  const getVelocityBadge = () => {
    switch (marketVelocity.trend) {
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
            Comprehensive market intelligence • {snapshot.uniqueListings} competitor listings
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 mt-4">
          {/* Market Velocity Alert */}
          <div className="p-4 rounded-lg border bg-muted/50">
            <div className="flex items-start gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-2">
                  {getVelocityBadge()}
                </div>
                <p className="text-sm">{marketVelocity.message}</p>
              </div>
            </div>
          </div>

          {/* Price Position Indicator */}
          <div className="space-y-2">
            <h3 className="font-semibold">Price Position</h3>
            <div className="relative h-12 bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 rounded-lg">
              {/* Min marker */}
              <div className="absolute left-0 top-0 bottom-0 flex items-center">
                <div className="bg-background px-2 py-1 rounded text-xs font-medium border">
                  Min: ${snapshot.minPrice.toLocaleString()}
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
                  Median: ${snapshot.medianPrice.toLocaleString()}
                </div>
              </div>

              {/* Max marker */}
              <div className="absolute right-0 top-0 bottom-0 flex items-center">
                <div className="bg-background px-2 py-1 rounded text-xs font-medium border">
                  Max: ${snapshot.maxPrice.toLocaleString()}
                </div>
              </div>
            </div>
            <div className="flex justify-between text-xs text-muted-foreground mt-1">
              <span>{ourPrice < snapshot.medianPrice ? `$${(snapshot.medianPrice - ourPrice).toLocaleString()} below median` : `$${(ourPrice - snapshot.medianPrice).toLocaleString()} above median`}</span>
              <span>{ourPrice < snapshot.minPrice ? `$${(snapshot.minPrice - ourPrice).toLocaleString()} below minimum` : ourPrice > snapshot.minPrice ? `$${(ourPrice - snapshot.minPrice).toLocaleString()} above minimum` : 'At minimum price'}</span>
            </div>
          </div>

          {/* Price Trend Chart */}
          <div className="space-y-2">
            <h3 className="font-semibold">30-Day Price Trends</h3>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={priceChartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="Minimum" stroke="#ef4444" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="Median" stroke="#3b82f6" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="Maximum" stroke="#10b981" strokeWidth={2} dot={{ r: 3 }} />
                <Line type="monotone" dataKey="Our Price" stroke="#ff6b35" strokeWidth={3} strokeDasharray="5 5" dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Platform Distribution & DOM Analysis */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Platform Distribution */}
            <div className="space-y-2">
              <h3 className="font-semibold">Platform Distribution</h3>
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={platformChartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} angle={-45} textAnchor="end" height={80} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="listings" fill="#ff6b35" name="Total Listings" />
                  <Bar dataKey="uniqueVINs" fill="#0288d1" name="Unique VINs" />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Days on Market */}
            {domAnalysis.average && (
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
                <ResponsiveContainer width="100%" height={150}>
                  <BarChart data={domChartData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="range" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 12 }} />
                    <Tooltip />
                    <Bar dataKey="count" fill="#7cb342" name="Listings" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* Competitor Listings Table */}
          <div className="space-y-2">
            <h3 className="font-semibold">Competitor Listings ({competitorListings.length})</h3>
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
                    <TableHead>Platforms</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {competitorListings.map((listing: any, index: number) => (
                    <TableRow key={index}>
                      <TableCell className="font-mono text-xs">...{listing.vinLast4}</TableCell>
                      <TableCell className="font-semibold">${listing.price.toLocaleString()}</TableCell>
                      <TableCell>
                        {listing.price < ourPrice ? (
                          <span className="text-red-600 flex items-center gap-1">
                            <TrendingDown className="h-3 w-3" />
                            -${(ourPrice - listing.price).toLocaleString()}
                          </span>
                        ) : (
                          <span className="text-green-600 flex items-center gap-1">
                            <TrendingUp className="h-3 w-3" />
                            +${(listing.price - ourPrice).toLocaleString()}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>{listing.mileage?.toLocaleString() || 'N/A'}</TableCell>
                      <TableCell>{listing.trim}</TableCell>
                      <TableCell>{listing.location}</TableCell>
                      <TableCell className="text-xs">
                        <Badge variant="outline" className="text-xs">{listing.platformCount} sites</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Cross-posting Matrix */}
          {platformDistribution.crossPostingMatrix.length > 0 && (
            <div className="space-y-2">
              <h3 className="font-semibold">Cross-Posting Patterns</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {platformDistribution.crossPostingMatrix.slice(0, 6).map((item: any, index: number) => (
                  <div key={index} className="p-3 border rounded-lg text-sm">
                    <div className="font-mono text-xs mb-1">VIN ...{item.vin}</div>
                    <div className="font-semibold mb-1">${item.price.toLocaleString()}</div>
                    <div className="text-xs text-muted-foreground flex flex-wrap gap-1">
                      {item.platforms.map((p: string, i: number) => (
                        <Badge key={i} variant="secondary" className="text-xs">{p}</Badge>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
