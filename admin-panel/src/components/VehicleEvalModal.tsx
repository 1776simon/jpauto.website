import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import api from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Search, ArrowLeft, TrendingUp, TrendingDown, ExternalLink } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface VehicleEvalModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function VehicleEvalModal({ open, onOpenChange }: VehicleEvalModalProps) {
  const { toast } = useToast();
  const [step, setStep] = useState<'form' | 'results'>('form');

  // Form state
  const [vin, setVin] = useState('');
  const [year, setYear] = useState('');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [trim, setTrim] = useState('');
  const [mileage, setMileage] = useState('');

  // Results state
  const [evaluationResults, setEvaluationResults] = useState<any>(null);

  // VIN decode mutation
  const vinDecodeMutation = useMutation({
    mutationFn: (vin: string) => api.decodeVIN(vin),
    onSuccess: (data) => {
      // Populate form fields from VIN decode (backend returns lowercase field names)
      if (data.year) setYear(data.year.toString());
      if (data.make) setMake(data.make);
      if (data.model) setModel(data.model);
      if (data.trim) setTrim(data.trim);

      toast({
        title: "VIN Decoded",
        description: `${data.year} ${data.make} ${data.model}`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "VIN Decode Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Evaluation mutation
  const evaluateMutation = useMutation({
    mutationFn: (data: any) => api.evaluateVIN(data),
    onSuccess: (data) => {
      setEvaluationResults(data);
      setStep('results');

      if (data.fromCache) {
        toast({
          title: "Loaded from Cache",
          description: "This VIN was evaluated recently. Data loaded from cache.",
        });
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Evaluation Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleVinDecode = () => {
    if (!vin || vin.length !== 17) {
      toast({
        title: "Invalid VIN",
        description: "VIN must be 17 characters",
        variant: "destructive",
      });
      return;
    }

    vinDecodeMutation.mutate(vin.toUpperCase());
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!vin || !year || !make || !model || !mileage) {
      toast({
        title: "Missing Fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    if (vin.length !== 17) {
      toast({
        title: "Invalid VIN",
        description: "VIN must be 17 characters",
        variant: "destructive",
      });
      return;
    }

    evaluateMutation.mutate({
      vin: vin.toUpperCase(),
      year: parseInt(year),
      make,
      model,
      trim: trim || undefined,
      mileage: parseInt(mileage.replace(/,/g, '')),
    });
  };

  const handleReset = () => {
    setStep('form');
    setEvaluationResults(null);
    setVin('');
    setYear('');
    setMake('');
    setModel('');
    setTrim('');
    setMileage('');
  };

  const handleClose = () => {
    handleReset();
    onOpenChange(false);
  };

  // Calculate price position for gradient display
  const getPricePosition = (price: number, min: number, max: number) => {
    if (!min || !max || max === min) return 50;
    return ((price - min) / (max - min)) * 100;
  };

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

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {step === 'form' ? 'Vehicle Evaluation' : 'Market Research Results'}
          </DialogTitle>
          <DialogDescription>
            {step === 'form'
              ? 'Enter vehicle details to research market pricing'
              : `${evaluationResults?.year} ${evaluationResults?.make} ${evaluationResults?.model}`}
          </DialogDescription>
        </DialogHeader>

        {step === 'form' && (
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* VIN Input with Decode Button */}
            <div className="space-y-2">
              <Label htmlFor="vin">VIN *</Label>
              <div className="flex gap-2">
                <Input
                  id="vin"
                  value={vin}
                  onChange={(e) => setVin(e.target.value.toUpperCase())}
                  placeholder="17-character VIN"
                  maxLength={17}
                  className="flex-1"
                  required
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleVinDecode}
                  disabled={vinDecodeMutation.isPending || vin.length !== 17}
                >
                  {vinDecodeMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Decoding...
                    </>
                  ) : (
                    <>
                      <Search className="h-4 w-4 mr-2" />
                      Decode VIN
                    </>
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Enter VIN and click "Decode VIN" to auto-fill vehicle details
              </p>
            </div>

            {/* Vehicle Details */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="year">Year *</Label>
                <Input
                  id="year"
                  type="number"
                  value={year}
                  onChange={(e) => setYear(e.target.value)}
                  placeholder="2020"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="make">Make *</Label>
                <Input
                  id="make"
                  value={make}
                  onChange={(e) => setMake(e.target.value)}
                  placeholder="Toyota"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="model">Model *</Label>
                <Input
                  id="model"
                  value={model}
                  onChange={(e) => setModel(e.target.value)}
                  placeholder="Camry"
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="trim">Trim</Label>
                <Input
                  id="trim"
                  value={trim}
                  onChange={(e) => setTrim(e.target.value)}
                  placeholder="SE (optional)"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="mileage">Mileage *</Label>
                <Input
                  id="mileage"
                  type="number"
                  value={mileage}
                  onChange={(e) => setMileage(e.target.value)}
                  placeholder="50000"
                  required
                />
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button type="submit" disabled={evaluateMutation.isPending}>
                {evaluateMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  'Evaluate Vehicle'
                )}
              </Button>
            </div>
          </form>
        )}

        {step === 'results' && evaluationResults && (
          <div className="space-y-6">
            {/* Back Button */}
            <Button variant="outline" size="sm" onClick={() => setStep('form')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Form
            </Button>

            {/* Cache Notice */}
            {evaluationResults.fromCache && (
              <div className="p-3 rounded-lg bg-blue-50 dark:bg-blue-950 text-blue-900 dark:text-blue-100 text-sm">
                <strong>Cached Data:</strong> This evaluation was loaded from cache. Data may be up to 1 week old.
              </div>
            )}

            {/* Market Summary */}
            <div className="grid grid-cols-3 gap-4">
              <div className="p-4 rounded-lg border">
                <div className="text-sm text-muted-foreground">Listings Found</div>
                <div className="text-2xl font-bold">{evaluationResults.marketData.uniqueListings}</div>
              </div>
              <div className="p-4 rounded-lg border">
                <div className="text-sm text-muted-foreground">Median Price</div>
                <div className="text-2xl font-bold">
                  {formatCurrency(evaluationResults.marketData.medianPrice)}
                </div>
              </div>
              <div className="p-4 rounded-lg border">
                <div className="text-sm text-muted-foreground">Price Range</div>
                <div className="text-2xl font-bold">
                  {formatCurrency(evaluationResults.marketData.minPrice)} - {formatCurrency(evaluationResults.marketData.maxPrice)}
                </div>
              </div>
            </div>

            {/* Price Position Gradient */}
            {evaluationResults.marketData.medianPrice && (
              <div className="space-y-2">
                <h3 className="font-semibold">Price Position</h3>
                <div className="relative h-12 bg-gradient-to-r from-green-500 via-yellow-500 to-red-500 rounded-lg">
                  {/* Min marker */}
                  <div className="absolute left-0 top-0 bottom-0 flex items-center">
                    <div className="bg-background px-2 py-1 rounded text-xs font-medium border">
                      Min: {formatCurrency(evaluationResults.marketData.minPrice)}
                    </div>
                  </div>

                  {/* Median marker */}
                  <div
                    className="absolute top-0 bottom-0 flex items-center"
                    style={{
                      left: `${getPricePosition(
                        evaluationResults.marketData.medianPrice,
                        evaluationResults.marketData.minPrice,
                        evaluationResults.marketData.maxPrice
                      )}%`,
                      transform: 'translateX(-50%)'
                    }}
                  >
                    <div className="bg-primary text-primary-foreground px-2 py-1 rounded text-xs font-bold border-2 border-primary-foreground">
                      Median: {formatCurrency(evaluationResults.marketData.medianPrice)}
                    </div>
                  </div>

                  {/* Max marker */}
                  <div className="absolute right-0 top-0 bottom-0 flex items-center">
                    <div className="bg-background px-2 py-1 rounded text-xs font-medium border">
                      Max: {formatCurrency(evaluationResults.marketData.maxPrice)}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Sample Listings */}
            {evaluationResults.marketData.sampleListings && evaluationResults.marketData.sampleListings.length > 0 && (
              <div className="space-y-2">
                <h3 className="font-semibold">Sample Competitor Listings</h3>
                <div className="border rounded-lg">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>VIN</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Δ from Median</TableHead>
                        <TableHead>Mileage</TableHead>
                        <TableHead>Trim</TableHead>
                        <TableHead>Location</TableHead>
                        <TableHead>VDP</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {evaluationResults.marketData.sampleListings.map((listing: any, index: number) => {
                        const price = listing.price || 0;
                        const medianPrice = evaluationResults.marketData.medianPrice || 0;
                        return (
                          <TableRow key={index}>
                            <TableCell className="font-mono text-xs">...{listing.vinLast4 || 'N/A'}</TableCell>
                            <TableCell className="font-semibold">{formatCurrency(price)}</TableCell>
                            <TableCell>
                              {price < medianPrice ? (
                                <span className="text-green-600 flex items-center gap-1">
                                  <TrendingDown className="h-3 w-3" />
                                  -{formatCurrency(medianPrice - price)}
                                </span>
                              ) : (
                                <span className="text-red-600 flex items-center gap-1">
                                  <TrendingUp className="h-3 w-3" />
                                  +{formatCurrency(price - medianPrice)}
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

            {/* No Listings Found */}
            {evaluationResults.marketData.uniqueListings === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <p className="font-medium">No comparable listings found</p>
                <p className="text-sm mt-2">Try adjusting the vehicle details or check back later</p>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={handleReset}>
                New Evaluation
              </Button>
              <Button onClick={handleClose}>Close</Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
