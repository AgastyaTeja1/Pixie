import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ThemeProvider } from "@/components/ui/theme-provider";
import { AuthProvider } from "./context/AuthContext";
import { WebSocketProvider } from "./context/WebSocketContext";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import Signup from "@/pages/Signup";
import ProfileSetup from "@/pages/ProfileSetup";
import Feed from "@/pages/Feed";
import Chat from "@/pages/Chat";
import Post from "@/pages/Post";
import Profile from "@/pages/Profile";
import AI from "@/pages/AI";
import Search from "@/pages/Search";
import PostDetail from "@/pages/PostDetail";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={Login} />
      <Route path="/signup" component={Signup} />
      <Route path="/profile-setup" component={ProfileSetup} />
      <Route path="/feed" component={Feed} />
      <Route path="/chat" component={Chat} />
      <Route path="/post" component={Post} />
      <Route path="/profile" component={Profile} />
      <Route path="/profile/:username" component={Profile} />
      <Route path="/ai" component={AI} />
      <Route path="/search" component={Search} />
      <Route path="/post/:id" component={PostDetail} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ThemeProvider defaultTheme="light" storageKey="pixie-theme">
        <AuthProvider>
          <WebSocketProvider>
            <TooltipProvider>
              <Toaster />
              <Router />
            </TooltipProvider>
          </WebSocketProvider>
        </AuthProvider>
      </ThemeProvider>
    </QueryClientProvider>
  );
}

export default App;
