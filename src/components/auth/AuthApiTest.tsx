import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import AuthService from '@/services/authService';

// 测试组件用于验证API对接
export const AuthApiTest = () => {
  const [testResults, setTestResults] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const addResult = (test: string, success: boolean, data?: any, error?: any) => {
    const result = {
      test,
      success,
      data,
      error,
      timestamp: new Date().toLocaleTimeString(),
    };
    setTestResults(prev => [...prev, result]);
  };

  // 测试个人采购商注册
  const testBuyerRegister = async () => {
    setIsLoading(true);
    try {
      const response = await AuthService.register({
        email: `buyer-test-${Date.now()}@test.com`,
        password: 'password123',
        userName: '测试采购商',
        userType: 'individual_buyer',
      });
      addResult('个人采购商注册', true, response);
    } catch (error) {
      addResult('个人采购商注册', false, null, error);
    } finally {
      setIsLoading(false);
    }
  };

  // 测试供应商注册
  const testSupplierRegister = async () => {
    setIsLoading(true);
    try {
      const response = await AuthService.register({
        email: `supplier-test-${Date.now()}@test.com`,
        password: 'password123',
        userName: '测试供应商',
        userType: 'supplier',
        companyName: {
          'zh-CN': '测试农化公司',
          'en': 'Test Agrochem Company'
        },
        companyType: 'supplier',
        country: 'cn',
        businessCategories: ['pesticide_supplier'],
        businessScope: {
          'zh-CN': '农药研发生产销售',
          'en': 'Pesticide R&D, production and sales'
        },
        companySize: 'medium',
      });
      addResult('供应商注册', true, response);
    } catch (error) {
      addResult('供应商注册', false, null, error);
    } finally {
      setIsLoading(false);
    }
  };

  // 测试登录
  const testLogin = async () => {
    setIsLoading(true);
    try {
      const response = await AuthService.login({
        email: 'buyer@test.com',
        password: 'password123',
      });
      addResult('用户登录', true, response);
    } catch (error) {
      addResult('用户登录', false, null, error);
    } finally {
      setIsLoading(false);
    }
  };

  // 测试获取用户信息
  const testGetUser = async () => {
    setIsLoading(true);
    try {
      const response = await AuthService.getCurrentUser();
      addResult('获取用户信息', true, response);
    } catch (error) {
      addResult('获取用户信息', false, null, error);
    } finally {
      setIsLoading(false);
    }
  };

  // 测试Token验证
  const testTokenValidation = () => {
    try {
      const hasToken = AuthService.hasValidToken();
      const tokenInfo = AuthService.getTokenInfo();
      addResult('Token验证', true, { hasToken, tokenInfo });
    } catch (error) {
      addResult('Token验证', false, null, error);
    }
  };

  const clearResults = () => {
    setTestResults([]);
  };

  return (
    <div className="p-6 space-y-6">
      <Card className="p-6">
        <h2 className="text-xl font-bold mb-4">后端API接口测试</h2>
        
        <div className="grid grid-cols-2 gap-4 mb-6">
          <Button onClick={testBuyerRegister} disabled={isLoading}>
            测试个人采购商注册
          </Button>
          <Button onClick={testSupplierRegister} disabled={isLoading}>
            测试供应商注册
          </Button>
          <Button onClick={testLogin} disabled={isLoading}>
            测试登录
          </Button>
          <Button onClick={testGetUser} disabled={isLoading}>
            测试获取用户信息
          </Button>
          <Button onClick={testTokenValidation} disabled={isLoading}>
            测试Token验证
          </Button>
          <Button onClick={clearResults} variant="outline">
            清除结果
          </Button>
        </div>

        <div className="space-y-2">
          <h3 className="text-lg font-medium">测试结果:</h3>
          <div className="max-h-96 overflow-y-auto space-y-2">
            {testResults.map((result, index) => (
              <Card key={index} className={`p-3 ${result.success ? 'border-green-500' : 'border-red-500'}`}>
                <div className="flex justify-between items-start mb-2">
                  <span className="font-medium">{result.test}</span>
                  <span className="text-xs text-muted-foreground">{result.timestamp}</span>
                </div>
                
                <div className={`text-sm ${result.success ? 'text-green-600' : 'text-red-600'}`}>
                  {result.success ? '✅ 成功' : '❌ 失败'}
                </div>
                
                {result.data && (
                  <div className="mt-2">
                    <details className="cursor-pointer">
                      <summary className="text-sm font-medium text-blue-600">查看响应数据</summary>
                      <pre className="mt-1 text-xs bg-gray-100 p-2 rounded overflow-auto">
                        {JSON.stringify(result.data, null, 2)}
                      </pre>
                    </details>
                  </div>
                )}
                
                {result.error && (
                  <div className="mt-2">
                    <details className="cursor-pointer">
                      <summary className="text-sm font-medium text-red-600">查看错误信息</summary>
                      <pre className="mt-1 text-xs bg-red-50 p-2 rounded overflow-auto">
                        {JSON.stringify(result.error, null, 2)}
                      </pre>
                    </details>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>

        {testResults.length === 0 && (
          <div className="text-center text-muted-foreground py-8">
            点击上方按钮开始测试API接口
          </div>
        )}
      </Card>
    </div>
  );
};