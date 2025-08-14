import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/MockAuthContext";
import { NotificationProvider } from "@/contexts/NotificationContext";
import { CartProvider } from "@/contexts/CartContext";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Suspense } from "react";
import Index from "./pages/Index";
import AuthPage from "./pages/AuthPage";
import SupplierDashboard from "./pages/SupplierDashboard";
import BuyerDashboard from "./pages/BuyerDashboard";
import ProductsPage from "./pages/ProductsPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import CartPage from "./pages/CartPage";
import ConversationHistoryPage from "./pages/ConversationHistoryPage";
import InquiryManagementPage from "./pages/InquiryManagementPage";
import InquiryDetailPage from "./pages/InquiryDetailPage";
import InquiryResponsePage from "./pages/InquiryResponsePage";
import RegistrationManagementPage from "./pages/RegistrationManagementPage";
import SupplierRegistrationPage from "./pages/SupplierRegistrationPage";
import RegistrationDetailPage from "./pages/RegistrationDetailPage";
import QuoteManagement from "./pages/QuoteManagement";
import QuoteDetail from "./pages/QuoteDetail";
import NotFound from "./pages/NotFound";
import Samples from "./pages/Samples";
import SampleDetail from "./pages/SampleDetail";
import SampleResponses from "./pages/SampleResponses";
import SampleResponseDetail from "./pages/SampleResponseDetail";
import AISearchPage from "./pages/AISearchPage";
import SuppliersPage from "./pages/SuppliersPage";
import SupplierDetailPage from "./pages/SupplierDetailPage";

const queryClient = new QueryClient();

const App = () => (
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <CartProvider>
          <NotificationProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <Suspense fallback={<div className="flex items-center justify-center min-h-screen">加载中...</div>}>
                <BrowserRouter>
                  <ErrorBoundary>
                    <Routes>
                      <Route path="/" element={<AISearchPage />} />
                      <Route path="/auth" element={<AuthPage />} />
                      <Route path="/buyer" element={<BuyerDashboard />} />
                      <Route path="/supplier" element={<SupplierDashboard />} />
                      <Route path="/products" element={<ProductsPage />} />
                      <Route path="/products/:id" element={<ProductDetailPage />} />
                      <Route path="/cart" element={<CartPage />} />
                      <Route path="/conversation-history" element={<ConversationHistoryPage />} />
                      <Route path="/inquiries" element={<InquiryManagementPage />} />
                      <Route path="/inquiries/:id" element={<InquiryDetailPage />} />
                      <Route path="/inquiry-responses" element={<InquiryResponsePage />} />
                      <Route path="/inquiry-responses/:id" element={<InquiryDetailPage />} />
                      <Route path="/quote-management" element={<QuoteManagement />} />
                      <Route path="/quote-management/:id" element={<QuoteDetail />} />
                      <Route path="/registrations" element={<RegistrationManagementPage />} />
                      <Route path="/registrations/:id" element={<RegistrationDetailPage />} />
                      <Route path="/supplier-registrations" element={<SupplierRegistrationPage />} />
                      <Route path="/samples" element={<Samples />} />
                      <Route path="/samples/:id" element={<SampleDetail />} />
                      <Route path="/sample-responses" element={<SampleResponses />} />
                      <Route path="/sample-responses/:id" element={<SampleResponseDetail />} />
                      <Route path="/ai-search" element={<AISearchPage />} />
                      <Route path="/suppliers" element={<SuppliersPage />} />
                      <Route path="/suppliers/:id" element={<SupplierDetailPage />} />
                      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </ErrorBoundary>
                </BrowserRouter>
              </Suspense>
            </TooltipProvider>
          </NotificationProvider>
        </CartProvider>
      </AuthProvider>
    </QueryClientProvider>
  </ErrorBoundary>
);

export default App;
