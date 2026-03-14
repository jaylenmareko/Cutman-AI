import { useState, useCallback } from "react";
import { useLocation } from "wouter";
import { Navbar } from "@/components/layout/Navbar";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useDropzone } from "react-dropzone";
import { Upload, Youtube, FileVideo, X, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useToast } from "@/hooks/use-toast";

// Manual fetch for multipart/form-data to avoid JSON stringify issue
async function uploadAndAnalyze(data: { file?: File, youtubeUrl?: string, fighterName: string }) {
  const formData = new FormData();
  formData.append("fighterName", data.fighterName);
  
  if (data.file) {
    formData.append("video", data.file);
  } else if (data.youtubeUrl) {
    formData.append("youtubeUrl", data.youtubeUrl);
  }

  const uploadRes = await fetch('/api/upload', {
    method: 'POST',
    body: formData,
  });

  if (!uploadRes.ok) {
    const errorData = await uploadRes.json().catch(() => ({}));
    throw new Error(errorData.error || "Upload failed");
  }

  const report = await uploadRes.json();
  
  // Trigger analysis immediately after upload
  const analyzeRes = await fetch(`/api/analyze/${report.id}`, { method: 'POST' });
  if (!analyzeRes.ok) {
    // If analysis trigger fails, we still created the report. We'll let the user retry from the processing screen.
    console.error("Analysis trigger failed, but report created");
  }

  return report;
}

export function NewReport() {
  const [fighterName, setFighterName] = useState("");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const onDrop = useCallback((acceptedFiles: File[]) => {
    if (acceptedFiles.length > 0) {
      setFile(acceptedFiles[0]);
    }
  }, []);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'video/*': ['.mp4', '.mov', '.avi', '.mkv']
    },
    maxFiles: 1
  });

  const handleSubmit = async (e: React.FormEvent, mode: "upload" | "youtube") => {
    e.preventDefault();
    if (!fighterName.trim()) {
      toast({ title: "Error", description: "Fighter name is required", variant: "destructive" });
      return;
    }
    
    if (mode === "upload" && !file) {
      toast({ title: "Error", description: "Please select a video file", variant: "destructive" });
      return;
    }
    if (mode === "youtube" && !youtubeUrl.trim()) {
      toast({ title: "Error", description: "Please enter a YouTube URL", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    try {
      const report = await uploadAndAnalyze({ 
        fighterName, 
        file: mode === "upload" ? file! : undefined,
        youtubeUrl: mode === "youtube" ? youtubeUrl : undefined 
      });
      setLocation(`/reports/${report.id}/processing`);
    } catch (error: any) {
      toast({ 
        title: "Submission Failed", 
        description: error.message || "An unexpected error occurred", 
        variant: "destructive" 
      });
      setIsSubmitting(false);
    }
  };

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-background flex flex-col">
        <Navbar />
        
        <main className="flex-1 max-w-4xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="mb-10 text-center">
              <h1 className="text-4xl sm:text-5xl font-display uppercase tracking-wider">NEW SCOUTING REPORT</h1>
              <p className="text-muted-foreground mt-2 text-lg">Provide fight footage and let AI analyze the tendencies.</p>
            </div>

            <Card className="border-t-4 border-t-primary shadow-2xl">
              <CardContent className="p-6 sm:p-10">
                <div className="space-y-8">
                  <div className="space-y-3">
                    <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Fighter's Name</label>
                    <Input 
                      value={fighterName}
                      onChange={e => setFighterName(e.target.value)}
                      placeholder="e.g., Canelo Alvarez"
                      className="h-14 text-lg bg-background"
                      disabled={isSubmitting}
                    />
                  </div>

                  <Tabs defaultValue="upload" className="w-full">
                    <TabsList className="grid w-full grid-cols-2 mb-8 h-14 bg-secondary">
                      <TabsTrigger value="upload" className="text-lg font-display tracking-widest data-[state=active]:bg-card">
                        <Upload className="w-4 h-4 mr-2" /> FILE UPLOAD
                      </TabsTrigger>
                      <TabsTrigger value="youtube" className="text-lg font-display tracking-widest data-[state=active]:bg-card">
                        <Youtube className="w-4 h-4 mr-2" /> YOUTUBE LINK
                      </TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="upload">
                      <form onSubmit={(e) => handleSubmit(e, "upload")} className="space-y-8">
                        {!file ? (
                          <div 
                            {...getRootProps()} 
                            className={`border-2 border-dashed rounded-lg p-12 text-center cursor-pointer transition-colors duration-200
                              ${isDragActive ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50 hover:bg-secondary/50'}`}
                          >
                            <input {...getInputProps()} />
                            <div className="w-16 h-16 bg-secondary rounded-full flex items-center justify-center mx-auto mb-4">
                              <FileVideo className="w-8 h-8 text-muted-foreground" />
                            </div>
                            <h3 className="text-2xl font-display mb-2">DRAG & DROP VIDEO</h3>
                            <p className="text-muted-foreground mb-4">or click to browse your files</p>
                            <p className="text-sm text-muted-foreground/60">Supports MP4, MOV, AVI up to 2GB</p>
                          </div>
                        ) : (
                          <div className="border border-border rounded-lg p-6 bg-secondary/30 flex items-center justify-between">
                            <div className="flex items-center space-x-4">
                              <div className="w-12 h-12 bg-primary/20 rounded-full flex items-center justify-center">
                                <FileVideo className="w-6 h-6 text-primary" />
                              </div>
                              <div>
                                <p className="font-bold text-foreground truncate max-w-[200px] sm:max-w-md">{file.name}</p>
                                <p className="text-sm text-muted-foreground">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                              </div>
                            </div>
                            <Button 
                              type="button" 
                              variant="ghost" 
                              size="icon"
                              onClick={() => setFile(null)}
                              className="text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                            >
                              <X className="w-5 h-5" />
                            </Button>
                          </div>
                        )}
                        
                        <Button 
                          type="submit" 
                          size="lg" 
                          className="w-full h-14 font-display text-xl tracking-widest"
                          disabled={isSubmitting || !file}
                        >
                          {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin mr-2" /> : <ActivityIcon />}
                          {isSubmitting ? "UPLOADING & ANALYZING..." : "ANALYZE FIGHTER"}
                        </Button>
                      </form>
                    </TabsContent>

                    <TabsContent value="youtube">
                      <form onSubmit={(e) => handleSubmit(e, "youtube")} className="space-y-8">
                        <div className="space-y-3">
                          <label className="text-sm font-bold uppercase tracking-wider text-muted-foreground">YouTube URL</label>
                          <Input 
                            value={youtubeUrl}
                            onChange={e => setYoutubeUrl(e.target.value)}
                            placeholder="https://youtube.com/watch?v=..."
                            className="h-14 text-lg bg-background"
                            disabled={isSubmitting}
                          />
                        </div>
                        <Button 
                          type="submit" 
                          size="lg" 
                          className="w-full h-14 font-display text-xl tracking-widest"
                          disabled={isSubmitting || !youtubeUrl}
                        >
                          {isSubmitting ? <Loader2 className="w-6 h-6 animate-spin mr-2" /> : <ActivityIcon />}
                          {isSubmitting ? "PROCESSING LINK..." : "ANALYZE FIGHTER"}
                        </Button>
                      </form>
                    </TabsContent>
                  </Tabs>

                </div>
              </CardContent>
            </Card>
          </motion.div>
        </main>
      </div>
    </ProtectedRoute>
  );
}

function ActivityIcon() {
  return <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-activity mr-2"><path d="M22 12h-2.48a2 2 0 0 0-1.93 1.46l-2.35 8.36a.25.25 0 0 1-.48 0L9.24 2.18a.25.25 0 0 0-.48 0l-2.35 8.36A2 2 0 0 1 4.49 12H2"/></svg>;
}
