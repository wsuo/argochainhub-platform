import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/MockAuthContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Suspense } from "react";
import Index from "./pages/Index";
import AuthPage from "./pages/AuthPage";
import SupplierDashboard from "./pages/SupplierDashboard";
import ProductsPage from "./pages/ProductsPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import ConversationHistoryPage from "./pages/ConversationHistoryPage";
import InquiryManagementPage from "./pages/InquiryManagementPage";
import InquiryDetailPage from "./pages/InquiryDetailPage";
import InquiryResponsePage from "./pages/InquiryResponsePage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <NotificationProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <Suspense fallback={<div className="flex items-center justify-center min-h-screen">加载中...</div>}>
              <BrowserRouter>
                <ErrorBoundary>
                  <Routes>
                    <Route path="/" element={<Index />} />
                    <Route path="/auth" element={<AuthPage />} />
                    <Route path="/supplier" element={<SupplierDashboard />} />
                    <Route path="/products" element={<ProductsPage />} />
                    <Route path="/products/:id" element={<ProductDetailPage />} />
                    <Route path="/conversation-history" element={<ConversationHistoryPage />} />
                    <Route path="/inquiries" element={<InquiryManagementPage />} />
                    <Route path="/inquiries/:id" element={<InquiryDetailPage />} />
                    <Route path="/inquiry-responses" element={<InquiryResponsePage />} />
                    <Route path="/inquiry-responses/:id" element={<InquiryDetailPage />} />
                    {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </ErrorBoundary>
              </BrowserRouter>
            </Suspense>
          </TooltipProvider>
        </NotificationProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
