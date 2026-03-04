import { AdminLayout } from "@/components/AdminLayout";
import { Mail, Loader2 } from "lucide-react";
import { useState } from "react";
import api from "@/services/api";
import { toast } from "sonner";

export default function Settings() {
  const [testingEmail, setTestingEmail] = useState(false);

  const handleTestFinancingEmail = async () => {
    setTestingEmail(true);
    try {
      await api.testFinancingEmail();
      toast.success("Test financing email sent successfully");
    } catch (error) {
      toast.error(
        `Failed to send test email: ${error instanceof Error ? error.message : "Unknown error"}`
      );
    } finally {
      setTestingEmail(false);
    }
  };

  return (
    <AdminLayout>
      <div className="p-6">
        <h1 className="text-2xl font-bold mb-2">Settings</h1>
        <p className="text-muted-foreground mb-8">Manage system configuration and run diagnostic tests.</p>

        <div className="max-w-2xl space-y-6">
          {/* Email Testing */}
          <div className="border rounded-lg p-6">
            <h2 className="text-lg font-semibold mb-1">Email Testing</h2>
            <p className="text-sm text-muted-foreground mb-6">
              Send a test email to verify the financing application email is working correctly and includes all fields.
            </p>

            <div className="flex items-center justify-between p-4 bg-muted/40 rounded-lg">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center">
                  <Mail className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium text-sm">Finance Application Email</p>
                  <p className="text-xs text-muted-foreground">Sends a full test application with all fields populated</p>
                </div>
              </div>
              <button
                onClick={handleTestFinancingEmail}
                disabled={testingEmail}
                className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {testingEmail ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  <>
                    <Mail className="w-4 h-4" />
                    Send Test Email
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
