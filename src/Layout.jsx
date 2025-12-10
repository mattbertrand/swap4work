import React from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { base44 } from "@/api/base44Client";
import {
  Home,
  Package,
  User,
  Shield,
  Briefcase,
  Plus,
  LogOut,
  Bell
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import NotificationBell from "@/components/notifications/NotificationBell";

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const [user, setUser] = React.useState(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const checkAuth = async () => {
      try {
        const userData = await base44.auth.me();
        setUser(userData);

        if (userData && !userData.profile_completed && !window.location.pathname.includes('CompleteProfile')) {
          const protectedPages = [
            createPageUrl('CreateItem'),
            createPageUrl('MyListings'),
            createPageUrl('MyAgreements')
          ].map(url => new URL(url, window.location.origin).pathname);

          const currentPath = window.location.pathname;

          if (protectedPages.some(pagePath => currentPath.startsWith(pagePath))) {
            window.location.href = createPageUrl(`CompleteProfile?returnUrl=${encodeURIComponent(window.location.pathname + window.location.search)}`);
          }
        }
      } catch (error) {
        setUser(null);
      } finally {
        setLoading(false);
      }
    };

    checkAuth();
  }, [location.pathname]);

  const isAdmin = user?.role === 'admin';

  const navigationItems = [
    {
      title: "Home",
      url: createPageUrl("Home"),
      icon: Home,
    },
    {
      title: "Browse Items",
      url: createPageUrl("Browse"),
      icon: Package,
    },
    {
      title: "Find People",
      url: createPageUrl("BrowseUsers"),
      icon: Users,
    },
    {
      title: "My Listings",
      url: createPageUrl("MyListings"),
      icon: Package,
    },
    {
      title: "My Agreements",
      url: createPageUrl("MyAgreements"),
      icon: Briefcase,
    },
    {
      title: "Notifications",
      url: createPageUrl("Notifications"),
      icon: Bell,
    },
    {
      title: "Profile",
      url: createPageUrl("Profile"),
      icon: User,
    },
  ];

  if (isAdmin) {
    navigationItems.push({
      title: "Admin Dashboard",
      url: createPageUrl("AdminDashboard"),
      icon: Shield,
    });
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
    </div>;
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-gradient-to-br from-orange-50 via-amber-50 to-yellow-50">
        <Sidebar className="border-r border-orange-100">
          <SidebarHeader className="border-b border-orange-100 p-6">
            <Link to={createPageUrl("Home")} className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-amber-600 rounded-xl flex items-center justify-center shadow-md">
                <Briefcase className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="font-bold text-xl text-gray-900">WorkSwap</h2>
                <p className="text-xs text-gray-500">Trade work for items</p>
              </div>
            </Link>
          </SidebarHeader>

          <SidebarContent className="p-3">
            <SidebarGroup>
              <SidebarGroupContent>
                <SidebarMenu>
                  {navigationItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton
                        asChild
                        className={`hover:bg-orange-100 hover:text-orange-700 transition-colors duration-200 rounded-xl mb-1 ${
                          location.pathname === item.url ? 'bg-orange-100 text-orange-700' : ''
                        }`}
                      >
                        <Link to={item.url} className="flex items-center gap-3 px-4 py-3">
                          <item.icon className="w-5 h-5 flex-shrink-0" />
                          <span className="font-medium">{item.title}</span>
                        </Link>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <div className="px-4 py-6">
              <Link to={createPageUrl("CreateItem")} className="block">
                <button className="w-full bg-gradient-to-r from-orange-500 to-amber-600 text-white font-semibold py-3 px-4 rounded-xl hover:from-orange-600 hover:to-amber-700 transition-all shadow-md flex items-center justify-center gap-2">
                  <Plus className="w-5 h-5 flex-shrink-0" />
                  <span className="font-semibold text-white">List an Item</span>
                </button>
              </Link>
            </div>
          </SidebarContent>

          <SidebarFooter className="border-t border-orange-100 p-4">
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-3 w-full hover:bg-orange-50 p-2 rounded-lg transition-colors">
                    {user.photo_url ? (
                      <img
                        src={user.photo_url}
                        alt={user.full_name}
                        className="w-10 h-10 rounded-full object-cover border-2 border-orange-200"
                      />
                    ) : (
                      <div className="w-10 h-10 bg-gradient-to-br from-orange-400 to-amber-500 rounded-full flex items-center justify-center">
                        <span className="text-white font-semibold text-sm">
                          {user.full_name?.[0]?.toUpperCase() || 'U'}
                        </span>
                      </div>
                    )}
                    <div className="flex-1 min-w-0 text-left">
                      <p className="font-medium text-gray-900 text-sm truncate">{user.full_name}</p>
                      <p className="text-xs text-gray-500 truncate">{user.email}</p>
                    </div>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem asChild>
                    <Link to={createPageUrl("Profile")} className="flex items-center cursor-pointer">
                      <User className="w-4 h-4 mr-2" />
                      Profile Settings
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => {
                      base44.auth.logout(createPageUrl("Home"));
                    }}
                    className="text-red-600 focus:text-red-600 cursor-pointer"
                  >
                    <LogOut className="w-4 h-4 mr-2" />
                    Sign Out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button
                onClick={() => base44.auth.redirectToLogin()}
                className="w-full bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700"
              >
                Sign In
              </Button>
            )}
          </SidebarFooter>
        </Sidebar>

        <main className="flex-1 flex flex-col">
          <header className="bg-white/80 backdrop-blur-sm border-b border-orange-100 px-6 py-4 sticky top-0 z-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <SidebarTrigger className="md:hidden hover:bg-orange-100 p-2 rounded-lg transition-colors duration-200" />
                <h1 className="text-xl font-bold text-gray-900 hidden md:block">WorkSwap</h1>
              </div>
              {user && <NotificationBell user={user} />}
            </div>
          </header>

          <div className="flex-1 overflow-auto">
            {children}
          </div>

          <footer className="bg-white border-t border-orange-100 mt-auto">
            <div className="max-w-7xl mx-auto px-4 py-12 md:px-8">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-amber-600 rounded-lg flex items-center justify-center">
                      <Briefcase className="w-5 h-5 text-white" />
                    </div>
                    <h3 className="font-bold text-lg text-gray-900">WorkSwap</h3>
                  </div>
                  <p className="text-sm text-gray-600 mb-4">
                    A local marketplace to trade work and time for physical items — no money required.
                  </p>
                  <p className="text-xs text-gray-500">
                    Building stronger communities through skill exchange.
                  </p>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-4">Quick Links</h4>
                  <ul className="space-y-2">
                    <li>
                      <Link to={createPageUrl("Browse")} className="text-sm text-gray-600 hover:text-orange-600 transition-colors">
                        Browse Items
                      </Link>
                    </li>
                    <li>
                      <Link to={createPageUrl("CreateItem")} className="text-sm text-gray-600 hover:text-orange-600 transition-colors">
                        List an Item
                      </Link>
                    </li>
                    <li>
                      <Link to={createPageUrl("MyAgreements")} className="text-sm text-gray-600 hover:text-orange-600 transition-colors">
                        My Agreements
                      </Link>
                    </li>
                    <li>
                      <Link to={createPageUrl("Profile")} className="text-sm text-gray-600 hover:text-orange-600 transition-colors">
                        My Profile
                      </Link>
                    </li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-4">Resources</h4>
                  <ul className="space-y-2">
                    <li>
                      <a href="#" className="text-sm text-gray-600 hover:text-orange-600 transition-colors">
                        How It Works
                      </a>
                    </li>
                    <li>
                      <a href="#" className="text-sm text-gray-600 hover:text-orange-600 transition-colors">
                        Safety Guidelines
                      </a>
                    </li>
                    <li>
                      <a href="#" className="text-sm text-gray-600 hover:text-orange-600 transition-colors">
                        Community Rules
                      </a>
                    </li>
                    <li>
                      <a href="#" className="text-sm text-gray-600 hover:text-orange-600 transition-colors">
                        FAQ
                      </a>
                    </li>
                    <li>
                      <a href="#" className="text-sm text-gray-600 hover:text-orange-600 transition-colors">
                        Help Center
                      </a>
                    </li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold text-gray-900 mb-4">Legal</h4>
                  <ul className="space-y-2">
                    <li>
                      <a href="#" className="text-sm text-gray-600 hover:text-orange-600 transition-colors">
                        Terms of Service
                      </a>
                    </li>
                    <li>
                      <a href="#" className="text-sm text-gray-600 hover:text-orange-600 transition-colors">
                        Privacy Policy
                      </a>
                    </li>
                    <li>
                      <a href="#" className="text-sm text-gray-600 hover:text-orange-600 transition-colors">
                        Cookie Policy
                      </a>
                    </li>
                    <li>
                      <a href="#" className="text-sm text-gray-600 hover:text-orange-600 transition-colors">
                        Contact Us
                      </a>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="pt-8 border-t border-gray-200">
                <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                  <p className="text-sm text-gray-500">
                    © {new Date().getFullYear()} WorkSwap. All rights reserved.
                  </p>
                  <div className="flex items-center gap-6">
                    <a href="#" className="text-sm text-gray-500 hover:text-orange-600 transition-colors">
                      Follow us on Twitter
                    </a>
                    <a href="#" className="text-sm text-gray-500 hover:text-orange-600 transition-colors">
                      Join our Community
                    </a>
                    <a href="#" className="text-sm text-gray-500 hover:text-orange-600 transition-colors">
                      Report an Issue
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </footer>
        </main>
      </div>
    </SidebarProvider>
  );
}