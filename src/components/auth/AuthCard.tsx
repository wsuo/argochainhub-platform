import { useState } from "react";
import { Eye, EyeOff, Mail, Phone, User, Sparkles, ArrowRight, Building2, AlertCircle, X, WifiOff, RefreshCw, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useAuth, RegisterParams } from "@/contexts/MockAuthContext";
import { useTranslation } from "react-i18next";
import { MultiLanguageText, CompanySize } from "@/services/authService";

interface AuthCardProps {
  onSuccess?: () => void;
}

export const AuthCard = ({ onSuccess }: AuthCardProps) => {
  // 基础表单字段
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSupplier, setIsSupplier] = useState(false);
  const [activeTab, setActiveTab] = useState("login");
  
  // 企业信息字段（供应商注册时使用）
  const [companyNameZh, setCompanyNameZh] = useState("");
  const [companyNameEn, setCompanyNameEn] = useState("");
  const [companyNameEs, setCompanyNameEs] = useState("");
  const [businessScope, setBusinessScope] = useState("");
  const [businessScopeEn, setBusinessScopeEn] = useState("");
  const [mainProducts, setMainProducts] = useState("");
  const [mainProductsEn, setMainProductsEn] = useState("");
  const [companySize, setCompanySize] = useState<CompanySize | "">("");
  const [country, setCountry] = useState("cn");
  const [annualValue, setAnnualValue] = useState("");
  const [registrationNumber, setRegistrationNumber] = useState("");
  const [taxNumber, setTaxNumber] = useState("");
  
  // 模态框和折叠状态
  const [showSupplierModal, setShowSupplierModal] = useState(false);
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);
  
  const { login, register, isLoading, error, clearError, isOnline, retryLastOperation } = useAuth();
  const { t } = useTranslation();

  // 处理登录提交
  const handleLogin = async () => {
    if (!email || !password) return;
    
    clearError();
    const success = await login(email, password, isSupplier ? 'supplier' : 'buyer');
    
    if (success) {
      onSuccess?.();
    }
  };

  // 处理注册提交
  const handleRegister = async () => {
    if (!email || !password || !name) return;
    
    // 如果是供应商且未填写企业名称，显示模态框
    if (isSupplier && !companyNameZh) {
      setShowSupplierModal(true);
      return;
    }
    
    await performRegister();
  };

  // 执行注册逻辑
  const performRegister = async () => {
    clearError();
    
    // 构建注册参数
    const registerParams: RegisterParams = {
      email,
      password,
      name,
      userType: isSupplier ? 'supplier' : 'buyer',
    };

    // 如果是供应商，添加企业信息
    if (isSupplier) {
      if (!companyNameZh) {
        return; // 企业名称是必填的
      }

      const companyName: MultiLanguageText = {
        'zh-CN': companyNameZh,
        'en': companyNameEn || companyNameZh,
      };

      if (companyNameEs) {
        companyName.es = companyNameEs;
      }

      registerParams.companyName = companyName;
      registerParams.companyType = 'supplier';
      registerParams.country = country;

      if (businessScope) {
        registerParams.businessScope = {
          'zh-CN': businessScope,
          'en': businessScopeEn || businessScope,
        };
      }

      if (mainProducts) {
        registerParams.mainProducts = {
          'zh-CN': mainProducts,
          'en': mainProductsEn || mainProducts,
        };
      }

      if (companySize) {
        registerParams.companySize = companySize;
      }

      if (annualValue && !isNaN(Number(annualValue))) {
        registerParams.annualImportExportValue = Number(annualValue);
      }

      if (registrationNumber) {
        registerParams.registrationNumber = registrationNumber;
      }

      if (taxNumber) {
        registerParams.taxNumber = taxNumber;
      }

      // 默认业务类别
      registerParams.businessCategories = ['pesticide_supplier'];
    }

    const success = await register(registerParams);
    
    if (success) {
      setShowSupplierModal(false);
      onSuccess?.();
    }
  };

  const isEmailValid = email.includes('@') || /^1[3-9]\d{9}$/.test(email);
  const isLoginFormValid = email && password;
  const isRegisterFormValid = email && password && name;

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

      {/* Network Status & Error Display */}
      {!isOnline && (
        <div className="mb-4 p-3 bg-orange-50 border border-orange-200 rounded-lg flex items-center space-x-2">
          <WifiOff className="w-4 h-4 text-orange-500 flex-shrink-0" />
          <p className="text-sm text-orange-700">网络连接不可用</p>
        </div>
      )}

      {error && (
        <div className="mb-4 p-3 bg-destructive/10 border border-destructive/20 rounded-lg">
          <div className="flex items-start space-x-2">
            <AlertCircle className="w-4 h-4 text-destructive mt-0.5 flex-shrink-0" />
            <div className="flex-1">
              <p className="text-sm text-destructive">{error}</p>
            </div>
            <div className="flex space-x-1">
              {error.includes('网络') || error.includes('连接') ? (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={retryLastOperation}
                  disabled={isLoading}
                  className="h-auto p-1 hover:bg-transparent"
                  title="重试"
                >
                  <RefreshCw className={`w-4 h-4 text-destructive ${isLoading ? 'animate-spin' : ''}`} />
                </Button>
              ) : null}
              <Button
                variant="ghost"
                size="sm"
                onClick={clearError}
                className="h-auto p-1 hover:bg-transparent"
                title="关闭"
              >
                <X className="w-4 h-4 text-destructive" />
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Supplier Switch */}
      <div className="flex items-center justify-between p-4 bg-gradient-to-r from-primary/5 to-agro-blue/5 rounded-lg mb-6">
        <div className="flex items-center space-x-2">
          <Building2 className="w-4 h-4 text-primary" />
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
            onClick={handleLogin}
            disabled={!isLoginFormValid || isLoading}
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
          {/* 基础信息 */}
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
                placeholder="请输入密码（至少6位）"
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
            onClick={handleRegister}
            disabled={!isRegisterFormValid || isLoading}
            className="w-full bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary"
          >
            {isLoading ? (
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
            ) : (
              <ArrowRight className="w-4 h-4 mr-2" />
            )}
            {isLoading ? "注册中..." : (isSupplier ? "填写企业信息" : "立即注册")}
          </Button>

          {isSupplier && (
            <div className="text-xs text-muted-foreground text-center">
              下一步将填写企业信息完成供应商注册
            </div>
          )}

        </TabsContent>
      </Tabs>

      {/* 供应商企业信息模态框 */}
      <Dialog open={showSupplierModal} onOpenChange={setShowSupplierModal}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center space-x-2">
              <Building2 className="w-5 h-5 text-primary" />
              <span>完善企业信息</span>
            </DialogTitle>
            <DialogDescription>
              请填写企业基本信息以完成供应商注册。标记*为必填项。
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* 必填的企业基本信息 */}
            <div className="space-y-4 border rounded-lg p-4 bg-primary/5">
              <h3 className="text-sm font-medium text-foreground flex items-center space-x-2">
                <Building2 className="w-4 h-4 text-primary" />
                <span>基本信息 *</span>
              </h3>
              
              {/* 企业名称 */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="modal-company-name-zh">企业名称（中文）*</Label>
                  <Input
                    id="modal-company-name-zh"
                    placeholder="请输入企业中文名称"
                    value={companyNameZh}
                    onChange={(e) => setCompanyNameZh(e.target.value)}
                    className="border-primary/30 focus:border-primary"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="modal-company-name-en">企业名称（英文）</Label>
                  <Input
                    id="modal-company-name-en"
                    placeholder="Company Name in English"
                    value={companyNameEn}
                    onChange={(e) => setCompanyNameEn(e.target.value)}
                    className="border-primary/30 focus:border-primary"
                  />
                </div>
              </div>

              {/* 企业规模 */}
              <div className="space-y-2">
                <Label htmlFor="modal-company-size">企业规模</Label>
                <Select value={companySize} onValueChange={(value: CompanySize) => setCompanySize(value)}>
                  <SelectTrigger className="border-primary/30 focus:border-primary">
                    <SelectValue placeholder="请选择企业规模" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="startup">初创企业 (1-10人)</SelectItem>
                    <SelectItem value="small">小型企业 (11-50人)</SelectItem>
                    <SelectItem value="medium">中型企业 (51-200人)</SelectItem>
                    <SelectItem value="large">大型企业 (201-1000人)</SelectItem>
                    <SelectItem value="enterprise">大型集团 (1000+人)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* 可折叠的详细信息 */}
            <Collapsible open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
              <CollapsibleTrigger asChild>
                <Button variant="outline" className="w-full justify-between">
                  详细信息 (可选)
                  {isAdvancedOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </Button>
              </CollapsibleTrigger>
              
              <CollapsibleContent className="space-y-4 mt-4">
                <div className="border rounded-lg p-4 space-y-4">
                  {/* 业务范围 */}
                  <div className="space-y-2">
                    <Label htmlFor="modal-business-scope">业务范围（中文）</Label>
                    <Textarea
                      id="modal-business-scope"
                      placeholder="请描述企业主要业务范围"
                      value={businessScope}
                      onChange={(e) => setBusinessScope(e.target.value)}
                      className="min-h-[60px] border-primary/30 focus:border-primary"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="modal-business-scope-en">业务范围（英文）</Label>
                    <Textarea
                      id="modal-business-scope-en"
                      placeholder="Business scope in English"
                      value={businessScopeEn}
                      onChange={(e) => setBusinessScopeEn(e.target.value)}
                      className="min-h-[60px] border-primary/30 focus:border-primary"
                    />
                  </div>

                  {/* 主要产品 */}
                  <div className="space-y-2">
                    <Label htmlFor="modal-main-products">主要产品（中文）</Label>
                    <Textarea
                      id="modal-main-products"
                      placeholder="请列出企业主要产品"
                      value={mainProducts}
                      onChange={(e) => setMainProducts(e.target.value)}
                      className="min-h-[60px] border-primary/30 focus:border-primary"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="modal-main-products-en">主要产品（英文）</Label>
                    <Textarea
                      id="modal-main-products-en"
                      placeholder="Main products in English"
                      value={mainProductsEn}
                      onChange={(e) => setMainProductsEn(e.target.value)}
                      className="min-h-[60px] border-primary/30 focus:border-primary"
                    />
                  </div>

                  {/* 财务信息 */}
                  <div className="space-y-2">
                    <Label htmlFor="modal-annual-value">年进出口额（美元）</Label>
                    <Input
                      id="modal-annual-value"
                      type="number"
                      placeholder="请输入年进出口额"
                      value={annualValue}
                      onChange={(e) => setAnnualValue(e.target.value)}
                      className="border-primary/30 focus:border-primary"
                    />
                  </div>

                  {/* 证照信息 */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="modal-registration-number">注册证号</Label>
                      <Input
                        id="modal-registration-number"
                        placeholder="请输入企业注册证号"
                        value={registrationNumber}
                        onChange={(e) => setRegistrationNumber(e.target.value)}
                        className="border-primary/30 focus:border-primary"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="modal-tax-number">税号</Label>
                      <Input
                        id="modal-tax-number"
                        placeholder="请输入企业税号"
                        value={taxNumber}
                        onChange={(e) => setTaxNumber(e.target.value)}
                        className="border-primary/30 focus:border-primary"
                      />
                    </div>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* 提交按钮 */}
            <div className="flex space-x-3 pt-4">
              <Button 
                variant="outline" 
                onClick={() => setShowSupplierModal(false)}
                className="flex-1"
                disabled={isLoading}
              >
                取消
              </Button>
              <Button 
                onClick={performRegister}
                disabled={!companyNameZh || isLoading}
                className="flex-1 bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary"
              >
                {isLoading ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin mr-2" />
                ) : (
                  <ArrowRight className="w-4 h-4 mr-2" />
                )}
                {isLoading ? "注册中..." : "提交企业注册申请"}
              </Button>
            </div>

            <div className="text-xs text-muted-foreground text-center">
              * 供应商注册需要管理员审核，审核通过后方可使用
            </div>
          </div>
        </DialogContent>
      </Dialog>

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