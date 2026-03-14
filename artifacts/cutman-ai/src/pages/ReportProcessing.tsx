import { useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { useGetReportStatus, useAnalyzeReport } from "@workspace/api-client-react";
import { Navbar } from "@/components/layout/Navbar";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { AlertCircle, RefreshCcw } from "lucide-react";
import { motion } from "framer-motion";

export function ReportProcessing() {
  const [, params] = useRoute("/reports/:id/processing");
  const id = Number(params?.id);
  const [, setLocation] = useLocation();

  const { data: status, refetch } = useGetReportStatus(id, {
    query: {
      refetchInterval: (query) => {
        const state = query.state.data?.status;
        return state === "complete" || state === "error" ? false : 4000;
      },
      enabled: !!id
    }
  });

  const analyzeMutation = useAnalyzeReport();

  useEffect(() => {
    if (status?.status === "complete") {
      setLocation(`/reports/${id}`);
    }
  }, [status, id, setLocation]);

  const handleRetry = () => {
    analyzeMutation.mutate(
      { reportId: id },
      { onSuccess: () => refetch() }
    );
  };

  const isError = status?.status === "error";

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        
        <main className="flex-1 flex items-center justify-center p-4">
          <div className="max-w-md w-full text-center">
            {isError ? (
              <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
                <div className="w-24 h-24 bg-destructive/10 rounded-full flex items-center justify-center mx-auto mb-6">
                  <AlertCircle className="w-12 h-12 text-destructive" />
                </div>
                <h1 className="text-4xl font-display text-destructive mb-4">ANALYSIS FAILED</h1>
                <p className="text-muted-foreground mb-8">
                  {status?.errorMessage || "There was an issue communicating with the AI. Please try again."}
                </p>
                <Button 
                  size="lg" 
                  onClick={handleRetry} 
                  disabled={analyzeMutation.isPending}
                  className="font-display text-xl tracking-widest h-14 px-10"
                >
                  <RefreshCcw className={`w-5 h-5 mr-2 ${analyzeMutation.isPending ? "animate-spin" : ""}`} />
                  RETRY ANALYSIS
                </Button>
              </motion.div>
            ) : (
              <div className="flex flex-col items-center">
                <div className="relative w-32 h-32 mb-10">
                  <div className="absolute inset-0 rounded-full border-4 border-secondary"></div>
                  <div className="absolute inset-0 rounded-full border-4 border-primary border-t-transparent animate-spin"></div>
                  <div className="absolute inset-0 rounded-full pulse-red"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="font-display text-2xl text-primary">AI</span>
                  </div>
                </div>
                
                <h1 className="text-3xl sm:text-4xl font-display uppercase tracking-widest mb-4">
                  ANALYZING FOOTAGE
                </h1>
                
                <div className="space-y-3 text-muted-foreground font-semibold">
                  <p className="animate-pulse">Extracting biomechanical data...</p>
                  <p className="animate-pulse animation-delay-500">Mapping punch tendencies...</p>
                  <p className="animate-pulse animation-delay-1000">Generating strategic blueprint...</p>
                </div>
              </div>
            )}
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
