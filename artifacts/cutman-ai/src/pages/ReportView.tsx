import { useState, useMemo } from "react";
import { useRoute, useLocation } from "wouter";
import { useGetReport, useDeleteReport, useUpdateReportName } from "@workspace/api-client-react";
import { Navbar } from "@/components/layout/Navbar";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { format } from "date-fns";
import { motion } from "framer-motion";
import { ArrowLeft, Edit2, Check, Trash2, ShieldAlert, Crosshair, Move, Activity, Zap, ShieldX, Skull } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export function ReportView() {
  const [, params] = useRoute("/reports/:id");
  const id = Number(params?.id);
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const { data: report, isLoading } = useGetReport(id);
  const updateNameMutation = useUpdateReportName();
  const deleteMutation = useDeleteReport();

  const [isEditingName, setIsEditingName] = useState(false);
  const [editNameValue, setEditNameValue] = useState("");

  const parsedContent = useMemo(() => {
    if (!report?.reportContent) return null;
    try {
      return JSON.parse(report.reportContent);
    } catch (e) {
      console.error("Failed to parse report content", e);
      return null;
    }
  }, [report?.reportContent]);

  if (isLoading || !report) return (
    <ProtectedRoute><div className="min-h-screen bg-background"><Navbar /></div></ProtectedRoute>
  );

  const handleSaveName = () => {
    if (editNameValue.trim() && editNameValue !== report.fighterName) {
      updateNameMutation.mutate({ 
        id, 
        data: { fighterName: editNameValue } 
      }, {
        onSuccess: () => {
          setIsEditingName(false);
          queryClient.invalidateQueries({ queryKey: [`/api/reports/${id}`] });
          queryClient.invalidateQueries({ queryKey: [`/api/reports`] });
        }
      });
    } else {
      setIsEditingName(false);
    }
  };

  const handleDelete = () => {
    deleteMutation.mutate({ id }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: [`/api/reports`] });
        setLocation("/dashboard");
      }
    });
  };

  const sections = [
    { key: 'fighterStyleProfile', title: 'Fighter Style Profile', icon: Activity },
    { key: 'punchTendencies', title: 'Punch Tendencies', icon: Crosshair },
    { key: 'defensiveHabits', title: 'Defensive Habits', icon: ShieldAlert },
    { key: 'behaviorUnderPressure', title: 'Behavior Under Pressure', icon: Zap },
    { key: 'ringMovementPatterns', title: 'Ring Movement Patterns', icon: Move },
    { key: 'setupPatterns', title: 'Setup Patterns', icon: Activity },
    { key: 'bodyShotUsage', title: 'Body Shot Usage', icon: Crosshair },
    { key: 'aggressionPatterns', title: 'Aggression Patterns', icon: Zap },
    { key: 'defensiveWeaknesses', title: 'Defensive Weaknesses', icon: ShieldX },
  ];

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background flex flex-col pb-24">
        <Navbar />
        
        <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 mt-8">
          <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-12">
            <div>
              <Button variant="ghost" className="mb-4 text-muted-foreground hover:text-foreground pl-0" onClick={() => setLocation("/dashboard")}>
                <ArrowLeft className="w-4 h-4 mr-2" /> Back to Dashboard
              </Button>
              
              <div className="flex items-center space-x-3 mb-2">
                {isEditingName ? (
                  <div className="flex items-center space-x-2">
                    <Input 
                      value={editNameValue}
                      onChange={(e) => setEditNameValue(e.target.value)}
                      className="text-3xl font-display uppercase h-14 max-w-sm"
                      autoFocus
                      onKeyDown={(e) => e.key === 'Enter' && handleSaveName()}
                    />
                    <Button size="icon" onClick={handleSaveName} disabled={updateNameMutation.isPending}>
                      <Check className="w-5 h-5" />
                    </Button>
                  </div>
                ) : (
                  <div className="flex items-center group">
                    <h1 className="text-5xl font-display uppercase tracking-wider">{report.fighterName || "UNNAMED FIGHTER"}</h1>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      className="ml-2 opacity-0 group-hover:opacity-100 transition-opacity"
                      onClick={() => {
                        setEditNameValue(report.fighterName || "");
                        setIsEditingName(true);
                      }}
                    >
                      <Edit2 className="w-4 h-4 text-muted-foreground" />
                    </Button>
                  </div>
                )}
              </div>
              <p className="text-muted-foreground text-lg">
                Generated on {format(new Date(report.createdAt), "MMMM do, yyyy")}
              </p>
            </div>

            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" className="font-display tracking-widest shrink-0">
                  <Trash2 className="w-4 h-4 mr-2" /> DELETE REPORT
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-card border-border">
                <AlertDialogHeader>
                  <AlertDialogTitle className="font-display text-2xl">DELETE SCOUTING REPORT?</AlertDialogTitle>
                  <AlertDialogDescription>
                    This action cannot be undone. This will permanently delete the analysis for {report.fighterName}.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="font-display tracking-widest border-border">CANCEL</AlertDialogCancel>
                  <AlertDialogAction onClick={handleDelete} className="bg-destructive text-destructive-foreground font-display tracking-widest hover:bg-destructive/90">
                    CONFIRM DELETE
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          {!parsedContent ? (
            <Card className="border-t-4 border-t-destructive">
              <CardContent className="p-8">
                <p className="text-destructive font-bold text-lg mb-2">Failed to parse report content.</p>
                <pre className="whitespace-pre-wrap text-sm text-muted-foreground bg-secondary/50 p-4 rounded-md overflow-auto">
                  {report.reportContent || "No content generated."}
                </pre>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              
              {/* Recommended Game Plan gets prime real estate */}
              {parsedContent.recommendedGamePlan && (
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="md:col-span-2 lg:col-span-3 mb-4"
                >
                  <Card className="border border-primary/30 shadow-2xl shadow-primary/10 overflow-hidden relative group">
                    <div className="absolute inset-0 bg-gradient-to-br from-primary/10 to-transparent pointer-events-none" />
                    <CardHeader className="bg-primary/5 pb-4 border-b border-primary/10">
                      <CardTitle className="text-3xl font-display text-primary flex items-center">
                        <Skull className="w-7 h-7 mr-3" />
                        RECOMMENDED GAME PLAN
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-6 sm:p-8">
                      <div className="prose prose-invert max-w-none text-foreground/90 text-lg leading-relaxed space-y-4">
                        {String(parsedContent.recommendedGamePlan).split('\n').map((para, i) => (
                          <p key={i}>{para}</p>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              )}

              {/* Standard sections */}
              {sections.map((sec, idx) => {
                const content = parsedContent[sec.key];
                if (!content) return null;
                const Icon = sec.icon;

                return (
                  <motion.div 
                    key={sec.key}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.05 }}
                  >
                    <Card className="h-full border-l-4 border-l-border hover:border-l-primary transition-colors bg-card/80 backdrop-blur">
                      <CardHeader className="pb-3">
                        <CardTitle className="text-2xl font-display flex items-center text-foreground">
                          <Icon className="w-5 h-5 mr-2 text-muted-foreground" />
                          {sec.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-muted-foreground text-base leading-relaxed">
                          {String(content)}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </ProtectedRoute>
  );
}
