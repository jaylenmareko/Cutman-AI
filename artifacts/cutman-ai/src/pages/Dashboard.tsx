import { Link } from "wouter";
import { useGetReports } from "@workspace/api-client-react";
import { Navbar } from "@/components/layout/Navbar";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";
import { Plus, User, Loader2 } from "lucide-react";

export function Dashboard() {
  const { data: reports, isLoading } = useGetReports();

  // Group reports by fighter name
  const fighters = Object.values(
    (reports || []).reduce((acc, report) => {
      const name = report.fighterName || "Unknown Fighter";
      if (!acc[name]) acc[name] = { name, reports: [] };
      acc[name].reports.push(report);
      return acc;
    }, {} as Record<string, { name: string; reports: typeof reports }>)
  );

  const container = { hidden: { opacity: 0 }, show: { opacity: 1, transition: { staggerChildren: 0.08 } } };
  const item = { hidden: { opacity: 0, y: 20 }, show: { opacity: 1, y: 0 } };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />

        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-10">
            <div>
              <h1 className="text-4xl sm:text-5xl font-display uppercase tracking-wider">FIGHTER ROSTER</h1>
              <p className="text-muted-foreground mt-2 text-lg">Select a fighter to view their scouting reports.</p>
            </div>
            <Link href="/new">
              <Button size="lg" className="font-display tracking-widest text-lg h-12 px-8 shadow-lg shadow-primary/20 hover:shadow-primary/40">
                <Plus className="w-5 h-5 mr-2" /> NEW REPORT
              </Button>
            </Link>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-20">
              <Loader2 className="w-12 h-12 text-primary animate-spin" />
            </div>
          ) : fighters.length > 0 ? (
            <motion.div variants={container} initial="hidden" animate="show" className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {fighters.map((fighter) => {
                const complete = fighter.reports!.filter((r) => r.status === "complete").length;
                const processing = fighter.reports!.filter((r) => r.status === "processing" || r.status === "pending").length;
                return (
                  <motion.div key={fighter.name} variants={item}>
                    <Link href={`/fighters/${encodeURIComponent(fighter.name)}`}>
                      <Card className="h-full cursor-pointer hover:border-primary transition-colors duration-300 group overflow-hidden relative">
                        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-border to-border group-hover:from-primary group-hover:to-primary/50 transition-all duration-300" />
                        <CardContent className="p-6 flex flex-col h-full gap-4">
                          <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center group-hover:bg-primary/10 transition-colors">
                            <User className="w-7 h-7 text-muted-foreground group-hover:text-primary transition-colors" />
                          </div>
                          <div>
                            <h3 className="text-2xl font-display uppercase tracking-wide truncate mb-2" title={fighter.name}>
                              {fighter.name}
                            </h3>
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge variant="outline" className="text-xs font-bold tracking-wide">
                                {fighter.reports!.length} REPORT{fighter.reports!.length !== 1 ? "S" : ""}
                              </Badge>
                              {complete > 0 && (
                                <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20 text-xs font-bold tracking-wide">
                                  {complete} COMPLETE
                                </Badge>
                              )}
                              {processing > 0 && (
                                <Badge variant="outline" className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20 text-xs font-bold tracking-wide animate-pulse">
                                  {processing} PROCESSING
                                </Badge>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                  </motion.div>
                );
              })}
            </motion.div>
          ) : (
            <div className="text-center py-24 bg-card rounded-lg border border-dashed border-border">
              <div className="w-20 h-20 bg-secondary rounded-full flex items-center justify-center mx-auto mb-6">
                <User className="w-10 h-10 text-muted-foreground" />
              </div>
              <h2 className="text-3xl font-display mb-3">NO FIGHTERS YET</h2>
              <p className="text-muted-foreground text-lg mb-8 max-w-md mx-auto">
                Upload your first fight video to start building your scouting roster.
              </p>
              <Link href="/new">
                <Button size="lg" className="font-display tracking-widest text-lg h-12 px-8">
                  <Plus className="w-5 h-5 mr-2" /> ADD FIRST FIGHTER
                </Button>
              </Link>
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
