import { Link, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useGetMe, useLogout } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { LogOut } from "lucide-react";
import { motion } from "framer-motion";

export function Navbar() {
  const { data: user } = useGetMe();
  const logout = useLogout();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const handleLogout = () => {
    logout.mutate(undefined, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["/api/auth/me"] });
        setLocation("/");
      },
    });
  };

  return (
    <motion.nav 
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-0 z-50 w-full border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60"
    >
      <div className="max-w-7xl mx-auto flex h-16 items-center px-4 sm:px-6 lg:px-8">
        <Link href={user ? "/dashboard" : "/"} className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-sm bg-primary flex items-center justify-center">
            <span className="font-display text-primary-foreground text-xl leading-none pt-1">C</span>
          </div>
          <span className="font-display text-2xl tracking-wider pt-1">
            CUTMAN<span className="text-primary">AI</span>
          </span>
        </Link>

        <div className="ml-auto flex items-center space-x-4">
          {user ? (
            <>
              <span className="text-sm text-muted-foreground hidden sm:inline-block">
                {user.email}
              </span>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleLogout}
                className="text-muted-foreground hover:text-foreground"
              >
                <LogOut className="w-4 h-4 mr-2" />
                SIGN OUT
              </Button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-sm font-semibold hover:text-primary transition-colors">
                LOG IN
              </Link>
              <Link href="/register">
                <Button size="sm" className="font-bold tracking-wide">
                  SIGN UP
                </Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </motion.nav>
  );
}
