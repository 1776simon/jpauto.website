import { AdminLayout } from "@/components/AdminLayout";
import { Package, Plus } from "lucide-react";

export default function Inventory() {
  return (
    <AdminLayout
      title="Inventory"
      description="Manage your product inventory and stock levels"
    >
      <div className="space-y-6">
        {/* Header Actions */}
        <div className="flex items-center justify-between">
          <div className="flex-1"></div>
          <button className="m3-button-filled flex items-center gap-2">
            <Plus className="w-5 h-5" />
            Add Item
          </button>
        </div>

        {/* Main Content Area */}
        <div className="m3-card p-12 text-center">
          <div className="w-16 h-16 bg-secondary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <Package className="w-8 h-8 text-secondary" />
          </div>
          <h3 className="text-xl font-semibold text-foreground mb-2">
            Inventory Page
          </h3>
          <p className="text-muted-foreground max-w-md mx-auto mb-6">
            This page will display your inventory items, stock levels, and
            product management tools. Keep prompting to build out the full
            inventory system.
          </p>
          <button className="m3-button-text">
            Ask to fill in this page →
          </button>
        </div>
      </div>
    </AdminLayout>
  );
}
