import { AdminLayout } from "@/components/AdminLayout";
import { CompetitorDetailModal } from "@/components/CompetitorDetailModal";
import { AddCompetitorModal } from "@/components/AddCompetitorModal";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  RefreshCw,
  Plus,
  MoreVertical,
  ExternalLink,
  Trash2,
  Edit,
  Eye,
  Users
} from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/services/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

export default function CompetitorTracking() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [addModalOpen, setAddModalOpen] = useState(false);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  const [selectedCompetitor, setSelectedCompetitor] = useState<any | null>(null);
  const [errorDialogOpen, setErrorDialogOpen] = useState(false);
  const [selectedError, setSelectedError] = useState<{ competitorName: string; errorType: string; errorMessage: string } | null>(null);

  // Fetch competitors
  const { data: competitors, isLoading } = useQuery({
    queryKey: ["competitors"],
    queryFn: () => api.getCompetitors(),
  });

  // Delete competitor mutation
  const deleteCompetitorMutation = useMutation({
    mutationFn: (id: string) => api.deleteCompetitor(id),
    onSuccess: () => {
      toast({
        title: "Competitor Deleted",
        description: "Competitor has been removed successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["competitors"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Delete Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Scrape competitor mutation
  const scrapeCompetitorMutation = useMutation({
    mutationFn: (id: string) => api.scrapeCompetitor(id),
    onSuccess: () => {
      toast({
        title: "Scrape Started",
        description: "Competitor inventory scraping has been queued.",
      });
      // Refetch after 30 seconds to see updates
      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ["competitors"] });
      }, 30000);
    },
    onError: (error: Error) => {
      toast({
        title: "Scrape Failed",
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

  const handleDeleteCompetitor = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete ${name}? All associated data will be removed.`)) {
      deleteCompetitorMutation.mutate(id);
    }
  };

  return (
    <AdminLayout
      title="Competitor Tracking"
      description="Track and analyze competitor inventory and pricing"
    >
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-muted-foreground">
              {competitors?.length || 0} competitor{competitors?.length !== 1 ? "s" : ""} tracked
            </p>
          </div>
          <Button onClick={() => setAddModalOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add Competitor
          </Button>
        </div>

        {/* Competitor Cards Grid */}
        {isLoading ? (
          <div className="flex justify-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
          </div>
        ) : competitors && competitors.length > 0 ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {competitors.map((competitor: any) => (
              <Card
                key={competitor.id}
                className="hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => {
                  setSelectedCompetitor(competitor);
                  setDetailModalOpen(true);
                }}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <CardTitle className="text-lg">{competitor.name}</CardTitle>
                      {competitor.websiteUrl && (
                        <CardDescription className="flex items-center gap-1 mt-1">
                          <ExternalLink className="h-3 w-3" />
                          <span className="text-xs truncate">{new URL(competitor.websiteUrl).hostname}</span>
                        </CardDescription>
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            setSelectedCompetitor(competitor);
                            setDetailModalOpen(true);
                          }}
                        >
                          <Eye className="mr-2 h-4 w-4" />
                          View Details
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            scrapeCompetitorMutation.mutate(competitor.id);
                          }}
                          disabled={scrapeCompetitorMutation.isPending}
                        >
                          <RefreshCw className="mr-2 h-4 w-4" />
                          Scrape Now
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteCompetitor(competitor.id, competitor.name);
                          }}
                          className="text-red-600"
                        >
                          <Trash2 className="mr-2 h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Platform & Last Scrape Info */}
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Platform</span>
                    <Badge variant="secondary">{competitor.platformType || "Unknown"}</Badge>
                  </div>

                  {competitor.lastSuccessfulScrapeAt && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Last Scraped</span>
                      <span>{timeAgo(competitor.lastSuccessfulScrapeAt)}</span>
                    </div>
                  )}

                  {/* Stats Grid */}
                  <div className="grid grid-cols-2 gap-3 pt-3 border-t">
                    <div>
                      <div className="text-xs text-muted-foreground">Inventory</div>
                      <div className="text-2xl font-bold">
                        {competitor.stats?.totalInventory || 0}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Monthly Sales</div>
                      <div className="text-2xl font-bold">
                        {competitor.stats?.monthlySales || 0}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Avg DOM</div>
                      <div className="text-lg font-semibold">
                        {competitor.stats?.avgDaysOnMarket || 0} days
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-muted-foreground">Avg Sale Price</div>
                      <div className="text-lg font-semibold">
                        {formatCurrency(competitor.stats?.avgSalePrice)}
                      </div>
                    </div>
                  </div>

                  {/* Error Display */}
                  {competitor.scrapeError && (
                    <div
                      className="pt-3 border-t cursor-pointer hover:bg-muted/50 -mx-6 px-6 py-3 transition-colors"
                      onClick={(e) => {
                        e.stopPropagation();
                        setErrorDialogOpen(true);
                        setSelectedError({
                          competitorName: competitor.name,
                          errorType: competitor.scrapeErrorType || "Error",
                          errorMessage: competitor.scrapeError
                        });
                      }}
                      title="Click to view full error message"
                    >
                      <div className="flex items-center justify-between">
                        <Badge variant="destructive" className="text-xs">
                          {competitor.scrapeErrorType || "Error"}
                        </Badge>
                        <span className="text-xs text-muted-foreground">Click for details</span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                        {competitor.scrapeError}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-12">
              <Users className="h-16 w-16 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Competitors Yet</h3>
              <p className="text-sm text-muted-foreground text-center mb-4">
                Start tracking competitor inventory by adding their website URL
              </p>
              <Button onClick={() => setAddModalOpen(true)}>
                <Plus className="mr-2 h-4 w-4" />
                Add Your First Competitor
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Add Competitor Modal */}
      <AddCompetitorModal
        open={addModalOpen}
        onOpenChange={setAddModalOpen}
      />

      {/* Competitor Detail Modal */}
      {selectedCompetitor && (
        <CompetitorDetailModal
          open={detailModalOpen}
          onOpenChange={setDetailModalOpen}
          competitor={selectedCompetitor}
        />
      )}

      {/* Error Detail Dialog */}
      <Dialog open={errorDialogOpen} onOpenChange={setErrorDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Scrape Error Details</DialogTitle>
            <DialogDescription>
              {selectedError?.competitorName} - {selectedError?.errorType}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Error Message:</label>
              <div className="mt-2 p-4 bg-muted rounded-md">
                <pre className="text-xs font-mono whitespace-pre-wrap break-words">
                  {selectedError?.errorMessage}
                </pre>
              </div>
            </div>
            <div className="flex justify-end">
              <Button
                variant="outline"
                onClick={() => {
                  navigator.clipboard.writeText(selectedError?.errorMessage || "");
                  toast({
                    title: "Copied!",
                    description: "Error message copied to clipboard",
                  });
                }}
              >
                Copy to Clipboard
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}
