import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Navbar } from "@/components/layout/Navbar";
import { motion } from "framer-motion";
import { Activity, ShieldAlert, Target } from "lucide-react";

export function Landing() {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Navbar />
      
      <main className="flex-1">
        {/* Hero Section */}
        <section className="relative w-full h-[90vh] flex items-center justify-center overflow-hidden">
          {/* Background Image with Dark Wash */}
          <div className="absolute inset-0 z-0">
            <img 
              src={`${import.meta.env.BASE_URL}images/hero-bg.png`} 
              alt="Dark gritty boxing gym" 
              className="w-full h-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-background/40 via-background/80 to-background z-10" />
            <div className="absolute inset-0 bg-black/50 z-10" />
          </div>

          <div className="relative z-20 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <h1 className="text-5xl sm:text-7xl md:text-8xl lg:text-9xl font-display text-white mb-4 drop-shadow-2xl">
                KNOW YOUR <span className="text-primary">ENEMY.</span>
              </h1>
              <p className="mt-6 max-w-2xl mx-auto text-xl sm:text-2xl text-gray-300 font-sans drop-shadow-md">
                AI-powered scouting reports for boxing coaches and fighters. Upload fight footage and instantly expose weaknesses, habits, and optimal game plans.
              </p>
              
              <div className="mt-12 flex flex-col sm:flex-row gap-6 justify-center">
                <Link href="/register">
                  <Button size="lg" className="w-full sm:w-auto h-14 px-10 text-lg font-bold tracking-widest font-display shadow-lg shadow-primary/25 hover:shadow-primary/40 hover:-translate-y-1 transition-all">
                    START SCOUTING
                  </Button>
                </Link>
                <Link href="/login">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto h-14 px-10 text-lg font-bold tracking-widest font-display bg-background/20 backdrop-blur-md hover:bg-background/40">
                    MEMBER LOGIN
                  </Button>
                </Link>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-24 bg-background relative z-20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-16">
              <h2 className="text-4xl font-display text-white">THE ULTIMATE CORNERMAN</h2>
              <div className="w-24 h-1 bg-primary mx-auto mt-4" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
              <motion.div 
                whileHover={{ y: -5 }}
                className="bg-card p-8 rounded-lg border border-border hover:border-primary/50 transition-colors"
              >
                <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                  <Activity className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-2xl font-display text-white mb-3">TENDENCY ANALYSIS</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Our vision AI tracks every punch thrown, identifying combinations, preferred ranges, and predictable rhythmic patterns.
                </p>
              </motion.div>

              <motion.div 
                whileHover={{ y: -5 }}
                className="bg-card p-8 rounded-lg border border-border hover:border-primary/50 transition-colors"
              >
                <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                  <ShieldAlert className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-2xl font-display text-white mb-3">EXPOSE WEAKNESSES</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Discover dropped hands, poor footwork retreats, and vulnerabilities to specific counters under pressure.
                </p>
              </motion.div>

              <motion.div 
                whileHover={{ y: -5 }}
                className="bg-card p-8 rounded-lg border border-border hover:border-primary/50 transition-colors"
              >
                <div className="w-14 h-14 bg-primary/10 rounded-full flex items-center justify-center mb-6">
                  <Target className="w-7 h-7 text-primary" />
                </div>
                <h3 className="text-2xl font-display text-white mb-3">ACTIONABLE GAMEPLANS</h3>
                <p className="text-muted-foreground leading-relaxed">
                  Get a generated, step-by-step strategic blueprint optimized to dismantle your opponent's specific style.
                </p>
              </motion.div>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
