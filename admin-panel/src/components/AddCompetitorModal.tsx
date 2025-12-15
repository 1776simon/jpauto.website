import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/services/api";
import { useToast } from "@/hooks/use-toast";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { RefreshCw, CheckCircle2, AlertCircle, ExternalLink } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

interface AddCompetitorModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddCompetitorModal({ open, onOpenChange }: AddCompetitorModalProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [step, setStep] = useState<"input" | "validating" | "preview">("input");
  const [formData, setFormData] = useState({
    name: "",
    websiteUrl: "",
    inventoryUrl: "",
  });
  const [validationResult, setValidationResult] = useState<any | null>(null);

  // Validate URL mutation
  const validateMutation = useMutation({
    mutationFn: (inventoryUrl: string) => api.validateCompetitorUrl(inventoryUrl),
    onSuccess: (data) => {
      setValidationResult(data);
      if (data.success) {
        setStep("preview");
      } else {
        toast({
          title: "Validation Failed",
          description: data.message,
          variant: "destructive",
        });
        setStep("input");
      }
    },
    onError: (error: Error) => {
      toast({
        title: "Validation Error",
        description: error.message,
        variant: "destructive",
      });
      setStep("input");
    },
  });

  // Create competitor mutation
  const createMutation = useMutation({
    mutationFn: (data: any) => api.createCompetitor(data),
    onSuccess: () => {
      toast({
        title: "Competitor Added",
        description: "Competitor has been added successfully. Initial scrape will start automatically.",
      });
      queryClient.invalidateQueries({ queryKey: ["competitors"] });
      handleClose();

      // Trigger initial scrape after 2 seconds
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["competitors"] });
      }, 2000);
    },
    onError: (error: Error) => {
      toast({
        title: "Failed to Add Competitor",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleClose = () => {
    setStep("input");
    setFormData({ name: "", websiteUrl: "", inventoryUrl: "" });
    setValidationResult(null);
    onOpenChange(false);
  };

  const handleValidate = () => {
    if (!formData.inventoryUrl) {
      toast({
        title: "Validation Error",
        description: "Inventory URL is required",
        variant: "destructive",
      });
      return;
    }

    setStep("validating");
    validateMutation.mutate(formData.inventoryUrl);
  };

  const handleCreate = () => {
    if (!formData.name) {
      toast({
        title: "Validation Error",
        description: "Dealer name is required",
        variant: "destructive",
      });
      return;
    }

    createMutation.mutate(formData);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Add Competitor</DialogTitle>
          <DialogDescription>
            Add a competitor's inventory URL to start tracking their listings
          </DialogDescription>
        </DialogHeader>

        {step === "input" && (
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="inventoryUrl">Inventory Page URL *</Label>
              <Input
                id="inventoryUrl"
                placeholder="https://www.example-dealer.com/inventory"
                value={formData.inventoryUrl}
                onChange={(e) => setFormData({ ...formData, inventoryUrl: e.target.value })}
              />
              <p className="text-xs text-muted-foreground">
                Enter the URL that shows all their vehicles (usually /inventory or /pre-owned-cars)
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="name">Dealer Name *</Label>
              <Input
                id="name"
                placeholder="e.g., ABC Auto Sales"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="websiteUrl">Website URL (Optional)</Label>
              <Input
                id="websiteUrl"
                placeholder="https://www.example-dealer.com"
                value={formData.websiteUrl}
                onChange={(e) => setFormData({ ...formData, websiteUrl: e.target.value })}
              />
            </div>

            <Alert>
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>
                We'll test scrape the URL to verify we can extract vehicle data before adding.
              </AlertDescription>
            </Alert>
          </div>
        )}

        {step === "validating" && (
          <div className="flex flex-col items-center justify-center py-12">
            <RefreshCw className="h-12 w-12 animate-spin text-primary mb-4" />
            <h3 className="text-lg font-semibold mb-2">Validating URL...</h3>
            <p className="text-sm text-muted-foreground">
              Testing scrape and detecting platform
            </p>
          </div>
        )}

        {step === "preview" && validationResult && (
          <div className="space-y-4 py-4">
            <Alert className="border-green-500 bg-green-50">
              <CheckCircle2 className="h-4 w-4 text-green-600" />
              <AlertDescription className="text-green-800">
                Successfully found {validationResult.totalVehicles} vehicles on this page
              </AlertDescription>
            </Alert>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-xs text-muted-foreground">Platform Detected</Label>
                <Badge className="mt-1">{validationResult.platformType}</Badge>
              </div>
              {validationResult.requiresPlaywright && (
                <div>
                  <Label className="text-xs text-muted-foreground">Scraper Type</Label>
                  <Badge variant="secondary" className="mt-1">Playwright (Heavy)</Badge>
                </div>
              )}
            </div>

            {validationResult.preview && validationResult.preview.length > 0 && (
              <div>
                <Label className="mb-2 block">Preview (First 5 Vehicles)</Label>
                <Card>
                  <CardContent className="p-0">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>VIN/Stock#</TableHead>
                          <TableHead>Vehicle</TableHead>
                          <TableHead>Price</TableHead>
                          <TableHead>Mileage</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {validationResult.preview.map((vehicle: any, index: number) => (
                          <TableRow key={index}>
                            <TableCell className="font-mono text-xs">
                              {vehicle.vin || vehicle.stock_number || "N/A"}
                            </TableCell>
                            <TableCell>
                              {vehicle.year} {vehicle.make} {vehicle.model}
                            </TableCell>
                            <TableCell>
                              {vehicle.price ? `$${vehicle.price.toLocaleString()}` : "N/A"}
                            </TableCell>
                            <TableCell>
                              {vehicle.mileage ? `${vehicle.mileage.toLocaleString()} mi` : "N/A"}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        )}

        <DialogFooter>
          {step === "input" && (
            <>
              <Button variant="outline" onClick={handleClose}>
                Cancel
              </Button>
              <Button onClick={handleValidate} disabled={!formData.inventoryUrl}>
                Validate & Preview
              </Button>
            </>
          )}

          {step === "preview" && (
            <>
              <Button variant="outline" onClick={() => setStep("input")}>
                Back
              </Button>
              <Button
                onClick={handleCreate}
                disabled={createMutation.isPending}
              >
                {createMutation.isPending && <RefreshCw className="mr-2 h-4 w-4 animate-spin" />}
                Add Competitor
              </Button>
            </>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
