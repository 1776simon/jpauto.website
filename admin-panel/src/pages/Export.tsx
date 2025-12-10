import { AdminLayout } from "@/components/AdminLayout";
import {
  Download,
  Building2,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { useState } from "react";
import api from "@/services/api";
import { toast } from "sonner";

export default function Export() {
  const [loadingExport, setLoadingExport] = useState<string | null>(null);

  const handleExport = async (
    type: string,
    exportFn: () => Promise<void>
  ) => {
    setLoadingExport(type);
    try {
      await exportFn();
      toast.success(`${type} export completed successfully`);
    } catch (error) {
      toast.error(
        `Failed to export to ${type}: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    } finally {
      setLoadingExport(null);
    }
  };

  const exportOptions = [
    {
      id: "dealer-center-upload",
      name: "Export to Dealer Center",
      description: "Export and upload inventory to Dealer Management System via FTP",
      icon: Building2,
      color: "text-purple-600",
      bgColor: "bg-purple-50",
      borderColor: "border-purple-200",
      exportFn: () => api.exportAndUploadToDealerCenter(),
      fileFormat: "CSV",
    },
    {
      id: "dealer-center-download",
      name: "Download export file",
      description: "Download Dealer Center CSV file to your computer",
      icon: Download,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      exportFn: () => api.exportToDealerCenter(),
      fileFormat: "CSV",
    },
  ];

  return (
    <AdminLayout
      title="Export Inventory"
      description="Export your vehicle inventory to various platforms and formats"
    >
      <div className="space-y-6">
        {/* Info Card */}
        <div className="m3-card p-6 border-l-4 border-primary">
          <div className="flex items-start gap-3">
            <CheckCircle className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-semibold text-foreground mb-1">
                Export Options Available
              </h3>
              <p className="text-sm text-muted-foreground">
                Choose from multiple export formats below. Each export will
                download a file containing your current inventory data formatted
                for the selected platform. Exports include only vehicles with
                "available" status.
              </p>
            </div>
          </div>
        </div>

        {/* Export Options Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {exportOptions.map((option) => {
            const Icon = option.icon;
            const isLoading = loadingExport === option.id;

            return (
              <div
                key={option.id}
                className={`m3-card p-6 border-2 ${option.borderColor} hover:shadow-lg transition-all duration-200`}
              >
                <div className="flex items-start gap-4">
                  <div
                    className={`w-12 h-12 ${option.bgColor} rounded-lg flex items-center justify-center flex-shrink-0`}
                  >
                    <Icon className={`w-6 h-6 ${option.color}`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg font-semibold text-foreground mb-1">
                      {option.name}
                    </h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      {option.description}
                    </p>

                    <div className="flex items-center gap-3 mb-4">
                      <span className="text-xs px-2 py-1 bg-muted rounded-md font-medium text-muted-foreground">
                        Format: {option.fileFormat}
                      </span>
                    </div>

                    <button
                      onClick={() =>
                        handleExport(option.name, option.exportFn)
                      }
                      disabled={isLoading || loadingExport !== null}
                      className={`m3-button-filled w-full flex items-center justify-center gap-2 ${option.color} disabled:opacity-50 disabled:cursor-not-allowed`}
                      style={{
                        backgroundColor: isLoading
                          ? undefined
                          : option.bgColor,
                        color: isLoading ? undefined : option.color,
                        borderColor: option.borderColor,
                      }}
                    >
                      {isLoading ? (
                        <>
                          <Loader2 className="w-5 h-5 animate-spin" />
                          Exporting...
                        </>
                      ) : (
                        <>
                          <Download className="w-5 h-5" />
                          {option.name}
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Help Section */}
        <div className="m3-card p-6">
          <h3 className="font-semibold text-foreground mb-4">Export Guide</h3>

          <div className="space-y-4 text-sm">
            <div>
              <h4 className="font-medium text-foreground mb-2">
                Export to Dealer Center
              </h4>
              <p className="text-muted-foreground">
                Automatically exports and uploads your inventory to the Dealer Management System via FTP.
                This is the same process that runs on the scheduled daily export at 2:00 AM.
                Use this option to manually trigger an immediate export and upload.
              </p>
            </div>

            <div>
              <h4 className="font-medium text-foreground mb-2">
                Download export file
              </h4>
              <p className="text-muted-foreground">
                Downloads a CSV file compatible with Dealer Center format to your computer.
                Use this option if you need to manually review the export file or upload it yourself
                through your DMS's inventory import tool.
              </p>
            </div>
          </div>
        </div>

        {/* Best Practices */}
        <div className="m3-card p-6 bg-muted/50">
          <h3 className="font-semibold text-foreground mb-3">
            Best Practices
          </h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>
                The scheduled export runs daily at 2:00 AM - use manual export only when immediate updates are needed
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>
                Verify vehicle data is complete before exporting to avoid errors in the DMS
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>
                Only vehicles marked as "available" or "pending" will be included in exports
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>
                Download the export file occasionally to review data quality and accuracy
              </span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-primary mt-1">•</span>
              <span>
                Keep backups of exported files for your records and audit trail
              </span>
            </li>
          </ul>
        </div>

        {/* Technical Details */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
          <div className="m3-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <Building2 className="w-4 h-4 text-primary" />
              <span className="font-semibold text-foreground">
                Inventory Synced
              </span>
            </div>
            <p className="text-muted-foreground">
              Exports reflect real-time inventory data at the moment of export
            </p>
          </div>

          <div className="m3-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-4 h-4 text-green-600" />
              <span className="font-semibold text-foreground">
                Quality Checked
              </span>
            </div>
            <p className="text-muted-foreground">
              All exports are validated against Dealer Center format requirements
            </p>
          </div>

          <div className="m3-card p-4">
            <div className="flex items-center gap-2 mb-2">
              <Download className="w-4 h-4 text-blue-600" />
              <span className="font-semibold text-foreground">
                Instant Processing
              </span>
            </div>
            <p className="text-muted-foreground">
              Files are generated on-demand and processed immediately
            </p>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
