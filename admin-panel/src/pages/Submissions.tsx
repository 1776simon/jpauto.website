import { AdminLayout } from "@/components/AdminLayout";
import { FileText, Plus } from "lucide-react";

export default function Submissions() {
  return (
    <AdminLayout
      title="Submissions"
      description="Manage and review all form submissions"
    >
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex items-center justify-between">
          <div className="flex-1"></div>
          <button className="m3-button-filled flex items-center gap-2">
            <Plus className="w-5 h-5" />
            New Submission
          </button>
        </div>

        {/* Main Content Area */}
        <div className="m3-card p-12 text-center">
          <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-primary" />
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-2">
            Submissions Page
          </h3>
          <p className="text-muted-foreground max-w-md mx-auto mb-6">
            This page will display all form submissions from your users. Keep
            prompting to build out the full submissions management interface.
          </p>
          <button className="m3-button-text">
            Ask to fill in this page →
          </button>
        </div>
      </div>
    </AdminLayout>
  );
}
