import { Link, useParams } from "wouter";
import { useGetReports } from "@workspace/api-client-react";
import { format } from "date-fns";
import { Navbar } from "@/components/layout/Navbar";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Plus, Video, AlertTriangle, FileText, Loader2, ChevronLeft } from "lucide-react";

export function FighterProfile() {
  const { name } = useParams<{ name: string }>();
  const fighterName = decodeURIComponent(name || "");
  const { data: reports, isLoading } = useGetReports();

  const fighterReports = (reports || []).filter(
    (r) => (r.fighterName || "").toLowerCase() === fighterName.toLowerCase()
  );

  const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.1 } } };
  const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="mb-10">
              <Link href="/dashboard">
                <button className="flex items-center text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
                  <ChevronLeft className="w-4 h-4 mr-1" /> BACK TO ROSTER
                </button>
              </Link>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h1 className="text-4xl sm:text-5xl font-display uppercase tracking-wider">{fighterName}</h1>
                  <p className="text-muted-foreground mt-2 text-lg">{fighterReports.length} scouting report{fighterReports.length !== 1 ? "s" : ""}</p>
                </div>
                <Link href={`/new?fighter=${encodeURIComponent(fighterName)}`}>
                  <Button size="lg" className="font-display tracking-widest text-lg h-12 px-8 shadow-lg shadow-primary/20 hover:shadow-primary/40">
                    <Plus className="w-5 h-5 mr-2" /> NEW REPORT
                  </Button>
                </Link>
              </div>
            </div>

            {isLoading ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-12 h-12 text-primary animate-spin" />
              </div>
            ) : fighterReports.length > 0 ? (
              <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {fighterReports.map((report) => (
                  <motion.div key={report.id} variants={item}>
                    <Link href={report.status === "processing" || report.status === "pending" ? `/reports/${report.id}/processing` : `/reports/${report.id}`}>
                      <Card className="h-full cursor-pointer hover:border-primary transition-colors duration-300 group overflow-hidden relative">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-border to-border group-hover:from-primary group-hover:to-primary/50 transition-all duration-300" />
                        <CardContent className="p-6 flex flex-col h-full">
                          <div className="flex justify-between items-start mb-4">
                            <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                              <Video className="w-6 h-6 text-muted-foreground group-hover:text-primary transition-colors" />
                            </div>
                            <StatusBadge status={report.status} />
                          </div>
                          <div className="mt-auto">
                            <h3 className="text-xl font-display uppercase tracking-wide mb-1">Report #{report.id}</h3>
                            <div className="flex items-center text-sm text-muted-foreground">
                              <FileText className="w-4 h-4 mr-2" />
                              {format(new Date(report.createdAt), "MMM d, yyyy")}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  </motion.div>
                ))}
              </motion.div>
            ) : (
              <div className="text-center py-24 bg-card rounded-lg border border-dashed border-border">
                <h2 className="text-3xl font-display mb-3">NO REPORTS YET</h2>
                <p className="text-muted-foreground text-lg mb-8">Upload footage to generate a scouting report for {fighterName}.</p>
                <Link href={`/new?fighter=${encodeURIComponent(fighterName)}`}>
                  <Button size="lg" className="font-display tracking-widest text-lg h-12 px-8">
                    <Plus className="w-5 h-5 mr-2" /> ADD FOOTAGE
                  </Button>
                </Link>
              </div>
            )}
          </motion.div>
        </main>
      </div>
    </ProtectedRoute>
  );
}

function StatusBadge({ status }: { status: string }) {
  switch (status) {
    case "complete":
      return <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 hover:bg-emerald-500/20 font-bold tracking-wide">COMPLETE</Badge>;
    case "error":
      return <Badge variant="destructive" className="font-bold tracking-wide"><AlertTriangle className="w-3 h-3 mr-1" /> ERROR</Badge>;
    default:
      return <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20 font-bold tracking-wide animate-pulse">PROCESSING</Badge>;
  }
}
