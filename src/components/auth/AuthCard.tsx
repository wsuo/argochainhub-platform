import { useState } from "react";
import { Eye, EyeOff, Mail, Phone, User, Sparkles, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { useAuth } from "@/contexts/MockAuthContext";
import { useTranslation } from "react-i18next";

interface AuthCardProps {
  onSuccess?: () => void;
}

export const AuthCard = ({ onSuccess }: AuthCardProps) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSupplier, setIsSupplier] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("login");
  
  const { login, register } = useAuth();
  const { t } = useTranslation();

  const handleSubmit = async (isLogin: boolean) => {
    if (!email || !password || (!isLogin && !name)) return;
    
    setIsLoading(true);
    
    try {
      const success = isLogin 
        ? await login(email, password, isSupplier ? 'supplier' : 'buyer')
        : await register(email, password, name, isSupplier ? 'supplier' : 'buyer');
      
      if (success) {
        onSuccess?.();
      }
    } catch (error) {
      console.error('Auth error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const isEmailValid = email.includes('@') || /^1[3-9]\d{9}$/.test(email);
  const isFormValid = email && password && (activeTab === 'login' || name);

  return (
    <Card className="w-full max-w-md mx-auto p-6 bg-gradient-to-br from-background to-agro-green-light border-primary/20 shadow-xl">
      {/* Header */}
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-10 h-10 bg-gradient-to-br from-primary to-agro-blue rounded-lg flex items-center justify-center">
          <Sparkles className="w-5 h-5 text-white" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-foreground">
            欢迎来到AgroChainHub
          </h2>
          <p className="text-sm text-muted-foreground">
            您的智慧农化采购伙伴
          </p>
        </div>
      </div>

      {/* Supplier Switch */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-primary/5 to-agro-blue/5 rounded-lg mb-6">
        <div className="flex items-center space-x-2">
          <User className="w-4 h-4 text-primary" />
          <span className="text-sm font-medium">我是供应商</span>
        </div>
        <Switch
          checked={isSupplier}
          onCheckedChange={setIsSupplier}
          className="data-[state=checked]:bg-primary"
        />
      </div>

      {/* Auth Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="login">登录</TabsTrigger>
          <TabsTrigger value="register">注册</TabsTrigger>
        </TabsList>
        
        <TabsContent value="login" className="space-y-4 mt-6">
          <div className="space-y-2">
            <Label htmlFor="email">邮箱/手机号</Label>
            <div className="relative">
              <Input
                id="email"
                type="email"
                placeholder="请输入邮箱或手机号"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 border-primary/30 focus:border-primary"
              />
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                {email.includes('@') ? (
                  <Mail className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <Phone className="w-4 h-4 text-muted-foreground" />
                )}
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="password">密码</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="请输入密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pr-10 border-primary/30 focus:border-primary"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <Eye className="w-4 h-4 text-muted-foreground" />
                )}
              </Button>
            </div>
          </div>
          
          <Button 
            onClick={() => handleSubmit(true)}
            disabled={!isFormValid || isLoading}
            className="w-full bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
            ) : (
              <ArrowRight className="w-4 h-4 mr-2" />
            )}
            {isLoading ? "登录中..." : "立即登录"}
          </Button>
        </TabsContent>
        
        <TabsContent value="register" className="space-y-4 mt-6">
          <div className="space-y-2">
            <Label htmlFor="register-name">姓名</Label>
            <div className="relative">
              <Input
                id="register-name"
                type="text"
                placeholder="请输入您的姓名"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="pl-10 border-primary/30 focus:border-primary"
              />
              <User className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="register-email">邮箱/手机号</Label>
            <div className="relative">
              <Input
                id="register-email"
                type="email"
                placeholder="请输入邮箱或手机号"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 border-primary/30 focus:border-primary"
              />
              <div className="absolute left-3 top-1/2 transform -translate-y-1/2">
                {email.includes('@') ? (
                  <Mail className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <Phone className="w-4 h-4 text-muted-foreground" />
                )}
              </div>
            </div>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="register-password">密码</Label>
            <div className="relative">
              <Input
                id="register-password"
                type={showPassword ? "text" : "password"}
                placeholder="请输入密码"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pr-10 border-primary/30 focus:border-primary"
              />
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <Eye className="w-4 h-4 text-muted-foreground" />
                )}
              </Button>
            </div>
          </div>
          
          <Button 
            onClick={() => handleSubmit(false)}
            disabled={!isFormValid || isLoading}
            className="w-full bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
            ) : (
              <ArrowRight className="w-4 h-4 mr-2" />
            )}
            {isLoading ? "注册中..." : "立即注册"}
          </Button>
        </TabsContent>
      </Tabs>

      {/* Footer */}
      <div className="mt-6 text-center">
        <p className="text-xs text-muted-foreground">
          继续使用即表示您同意我们的{" "}
          <span className="text-primary hover:underline cursor-pointer">服务条款</span>
          {" "}和{" "}
          <span className="text-primary hover:underline cursor-pointer">隐私政策</span>
        </p>
      </div>
    </Card>
  );
};