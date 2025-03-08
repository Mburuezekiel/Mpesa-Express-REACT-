import React, { useState, useEffect } from 'react';
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { 
  LayoutDashboard, Users, Settings, Shield, BarChart, 
  DollarSign, Home, MessageSquare, History, Heart, Bell, Send,
  MessageCircle, ChevronsLeft, ChevronsRight, LogOut, Menu,RefreshCw
} from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import axios from 'axios';
import moment from "moment";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
const API_URL_USERS = "https://api.inuafund.co.ke/api/users";
const API_URL_CAMPAIGNS = "https://api.inuafund.co.ke/api/campaigns";
const API_URL_DONATIONS = "https://api.inuafund.co.ke/api/donations";

type BadgeVariant = "default" | "secondary" | "destructive" | "outline";

interface NavLinkBadge {
  text: string;
  variant: BadgeVariant;
}

interface NavItem {
  to: string;
  icon: React.ComponentType;
  label: string;
  badge?: NavLinkBadge;
}

interface SidebarProps {
  type?: "admin" | "campaign";
  campaignId?: string;
}

export function Sidebar({ type = "admin", campaignId }: SidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [notifications] = useState(2);
  const [pendingDonations] = useState(5);
  const [unreadMessages, setUnreadMessages] = useState(0);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    await new Promise(resolve => setTimeout(resolve, 800));
    
    if (username === "Inua Fund" && password === "supporthope") {
      setIsAuthenticated(true);
      localStorage.setItem("adminAuthenticated", "true");
      toast.success("Welcome back, Inua Fund Admin!");
      navigate('/admin');
    } else {
      toast.error("Invalid credentials. Please try again.");
    }
    setIsLoading(false);
  };

  useEffect(() => {
    const fetchUnreadCount = async () => {
      try {
        const response = await axios.get("https://api.inuafund.co.ke/api/messages");
        setUnreadMessages(response.data.count);
      } catch (error) {
        console.error("Failed to fetch unread messages count:", error);
      }
    };

    fetchUnreadCount();
    const interval = setInterval(fetchUnreadCount, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
      if (window.innerWidth >= 768) {
        setIsOpen(false);
      }
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, []);

  const adminLinks: NavItem[] = [
    { 
      to: "/admin", 
      icon: LayoutDashboard, 
      label: "Dashboard",
      badge: { text: "New", variant: "default" }
    },
    { 
      to: "/admin/users", 
      icon: Users, 
      label: "Users",
      badge: { text: "+1", variant: "default" }
    },
    { 
      to: "/admin/campaigns", 
      icon: Shield, 
      label: "Campaigns" 
    },
    { 
      to: "/admin/donations", 
      icon: DollarSign, 
      label: "Donations",
    },
    { 
      to: "/admin/analytics", 
      icon: BarChart, 
      label: "Analytics",
    },
    { 
      to: "/admin/notifications", 
      icon: Send, 
      label: "Notifications",
    },
    {
      to: "/admin/contact/support",
      icon: MessageCircle,
      label: "Support",
      badge: unreadMessages > 0 ? { 
        text: unreadMessages.toString(), 
        variant: "destructive" 
      } : undefined
    },
    { 
      to: "/admin/settings", 
      icon: Settings, 
      label: "Settings" 
    }
  ];

  const campaignLinks: NavItem[] = [
    { 
      to: "", 
      icon: Home, 
      label: "Overview" 
    },
    { 
      to: "donations", 
      icon: Heart, 
      label: "Donations",
      badge: { text: "Active", variant: "default" }
    },
    { 
      to: "messages", 
      icon: MessageSquare, 
      label: "Messages" 
    },
    { 
      to: "history", 
      icon: History, 
      label: "History" 
    },
    { 
      to: "settings", 
      icon: Settings, 
      label: "Settings" 
    }
  ];
  const {
    data: users = [],
    isLoading: usersLoading,
    error: usersError,
    refetch: refetchUsers,
  } = useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const response = await axios.get(API_URL_USERS, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      return response.data;
    },
  });

  const {
    data: campaigns = [],
    isLoading: campaignsLoading,
    error: campaignsError,
    refetch: refetchCampaigns,
  } = useQuery({
    queryKey: ["campaigns"],
    queryFn: async () => {
      const response = await axios.get(API_URL_CAMPAIGNS, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
      });
      return response.data;
    },
  });

  const refreshData = async () => {
      setIsLoading(true);
      try {
        await Promise.all([refetchUsers(), refetchCampaigns()]);
        toast.success("Dashboard data refreshed", {
          description: moment().format("YYYY-MM-DD HH:mm:ss"),
        });
      } catch (error) {
        toast.error("Failed to refresh data");
      }
      setIsLoading(false);
    };

  const handleLogout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem("adminAuthenticated");
    navigate('/');
    toast.success("You have been successfully logged out");
  };

  const links = type === "admin" ? adminLinks : campaignLinks;

  const isLinkActive = (path: string) => {
    return location.pathname === path;
  };

  const SidebarContent = () => (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-4 border-b border-gray-200 light:border-neutral-800">
        <div className={`${isCollapsed ? 'text-center w-full' : ''}`}>
          {!isCollapsed ? (
            <div className="flex items-center space-x-3">
              <Avatar className="h-10 w-10 border-2 border-primary">
                <AvatarImage src="/avatar.png" />
                <AvatarFallback>IF</AvatarFallback>
              </Avatar>
              <div>
                <div className="flex items-center space-x-1">
                  <Shield className="w-3 h-3" />
                  <span className="font-semibold text-sm">Inua Fund</span>
                </div>
                <div className="text-xs text-muted-foreground">Admin Portal</div>
              </div>
            </div>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <Avatar className="h-10 w-10 mx-auto border-2 border-primary">
                  <AvatarImage src="/avatar.png" />
                  <AvatarFallback>IF</AvatarFallback>
                </Avatar>
              </TooltipTrigger>
              <TooltipContent side="right">Inua Fund</TooltipContent>
            </Tooltip>
          )}
        </div>
        {!isMobile && (
          <Button 
            variant="ghost" 
            size="icon" 
            className={`${isCollapsed ? 'absolute -right-4 top-6' : ''}`}
            onClick={() => setIsCollapsed(!isCollapsed)}
          >
            {isCollapsed ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
          </Button>
        )}
      </div>

      <nav className="p-2 flex-1 overflow-y-auto space-y-1">
        {links.map((link) => {
          const fullPath = type === "campaign" && campaignId ? `${campaignId}/${link.to}` : link.to;
          const active = isLinkActive(fullPath);

          return (
            <Tooltip key={link.to}>
              <TooltipTrigger asChild>
                <NavLink
                  to={fullPath}
                  className={`
                    group flex items-center 
                    ${isCollapsed ? 'justify-center' : 'justify-between'}
                    px-3 py-2.5
                    rounded-lg 
                    transition-all 
                    duration-200 
                    ${active 
                      ? 'bg-primary/10 text-primary font-medium' 
                      : 'hover:bg-accent/50 light:hover:bg-neutral-800'
                    }
                  `}
                  onClick={() => isMobile && setIsOpen(false)}
                >
                  <div className="flex items-center">
                    {link.icon && React.createElement(link.icon as React.ElementType, { className: `h-5 w-5 ${active ? 'text-primary' : ''}` })}


                    {!isCollapsed && (
                      <span className="ml-3 text-sm font-medium truncate">
                        {link.label}
                      </span>
                    )}
                  </div>
                  {!isCollapsed && link.badge && (
                    <Badge variant={link.badge.variant} className="ml-2">
                      {link.badge.text}
                    </Badge>
                  )}
                </NavLink>
              </TooltipTrigger>
              {isCollapsed && (
                <TooltipContent side="right">
                  <div className="flex items-center space-x-2">
                    <span>{link.label}</span>
                    {link.badge && (
                      <Badge variant={link.badge.variant} className="ml-2">
                        {link.badge.text}
                      </Badge>
                    )}
                  </div>
                </TooltipContent>
              )}
            </Tooltip>
          );
        })}
         <Separator />
         <br/>
        <Button
              onClick={refreshData}
              variant="outline"
              className="flex items-center border-primary text-primary hover:bg-primary/10"
              disabled={isLoading}
            >
              <RefreshCw
                className={`h-5 w-5 mr-2 ${isLoading ? "animate-spin" : ""}`}
              />
              Refresh
            </Button>

      </nav>
      
      <Separator />

      <div className="p-4">
        <Tooltip>
          <TooltipTrigger asChild>
            <div className={`
              flex items-center 
              ${isCollapsed ? 'justify-center' : 'space-x-3'}
              cursor-pointer
              hover:bg-accent/50 
              rounded-lg 
              p-2
            `}>
              {!isCollapsed && (
                <div className="flex items-center space-x-4">
                  <span className="text-gray-600">{username}</span>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleLogout}
                    className="flex items-center text-gray-600 hover:text-gray-900"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </Button>
                </div>
              )}
            </div>
          </TooltipTrigger>
          <TooltipContent side="top">
            <div className="text-sm">Inua Fund</div>
            <div className="text-xs text-muted-foreground">inuafund@gmail.com</div>
          </TooltipContent>
        </Tooltip>
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <>
        <Button
          variant="ghost"
          size="icon"
          className="relative top-4 left-4 z-50 md:hidden"
          onClick={() => setIsOpen(true)}
        >
          <Menu className="h-6 w-6" />
        </Button>
        
        <Sheet open={isOpen} onOpenChange={setIsOpen}>
          <SheetContent side="left" className="p-0 w-64">
            <SidebarContent />
            
          </SheetContent>
        </Sheet>
      </>
    );
  }

  return (
    <TooltipProvider>
      <aside className={`
        bg-white light:bg-neutral-900 
        border-r border-gray-200 light:border-neutral-800 
        h-screen 
        transition-all duration-300 
        ${isCollapsed ? 'w-20' : 'w-64'}
        flex flex-col
        relative
        shadow-lg
        hidden md:flex
      `}>
         
         
            <SidebarContent />
        
      </aside>
    </TooltipProvider>
  );
}

export default Sidebar;