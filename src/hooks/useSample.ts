import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { sampleApi } from "@/services/sampleApi";
import { dictionaryService } from "@/services/dictionaryService";
import { useToast } from "@/components/ui/use-toast";
import { useAuth } from "@/contexts/MockAuthContext";
import type { 
  CreateSampleRequestForm, 
  SampleRequestListResponse, 
  SampleRequestQueryParams, 
  SampleRequestDetail,
  CancelSampleRequestData,
  ConfirmDeliveryData,
  SampleEvaluationData,
  ApproveRequestData,
  RejectRequestData,
  ShipRequestData,
  SampleFiltersResponse,
  SampleStats
} from "@/types/sample";

/**
 * 获取样品申请列表（采购商）
 */
export const useSampleRequests = (params?: SampleRequestQueryParams) => {
  const { currentUserType, isLoggedIn } = useAuth();
  
  return useQuery<SampleRequestListResponse>({
    queryKey: ["sampleRequests", params],
    queryFn: () => sampleApi.getSampleRequests(params),
    enabled: isLoggedIn && currentUserType === 'buyer',
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * 获取供应商收到的样品申请
 */
export const useSupplierSampleRequests = (params?: SampleRequestQueryParams) => {
  const { currentUserType, isLoggedIn } = useAuth();
  
  return useQuery<SampleRequestListResponse>({
    queryKey: ["supplierSampleRequests", params],
    queryFn: () => sampleApi.getSupplierSampleRequests(params),
    enabled: isLoggedIn && currentUserType === 'supplier',
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * 获取样品申请详情
 */
export const useSampleRequest = (id?: number) => {
  return useQuery<{ success: boolean; message: string; data: SampleRequestDetail }>({
    queryKey: ["sampleRequest", id],
    queryFn: () => sampleApi.getSampleRequest(id as number),
    enabled: !!id,
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * 创建样品申请
 */
export const useCreateSampleRequest = () => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  return useMutation({
    mutationFn: (form: CreateSampleRequestForm) => sampleApi.createSampleRequest(form),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["sampleRequests"] });
      toast({
        title: "创建成功",
        description: `样品申请 ${data.data.sampleReqNo} 已创建`,
      });
    },
    onError: (error: any) => {
      toast({
        title: "创建失败",
        description: error.response?.data?.message || "请稍后重试",
        variant: "destructive",
      });
    },
  });
};

/**
 * 供应商操作集合
 */
export const useSupplierActions = (id: number) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["sampleRequests"] });
    queryClient.invalidateQueries({ queryKey: ["supplierSampleRequests"] });
    queryClient.invalidateQueries({ queryKey: ["sampleRequest", id] });
  };

  return {
    approve: useMutation({
      mutationFn: (data: ApproveRequestData) => sampleApi.approveSampleRequest(id, data),
      onSuccess: () => {
        invalidate();
        toast({
          title: "批准成功",
          description: "样品申请已批准",
        });
      },
      onError: (error: any) => {
        toast({
          title: "批准失败",
          description: error.response?.data?.message || "请稍后重试",
          variant: "destructive",
        });
      },
    }),
    
    reject: useMutation({
      mutationFn: (data: RejectRequestData) => sampleApi.rejectSampleRequest(id, data),
      onSuccess: () => {
        invalidate();
        toast({
          title: "拒绝成功",
          description: "样品申请已拒绝",
        });
      },
      onError: (error: any) => {
        toast({
          title: "拒绝失败",
          description: error.response?.data?.message || "请稍后重试",
          variant: "destructive",
        });
      },
    }),
    
    ship: useMutation({
      mutationFn: (data: ShipRequestData) => sampleApi.shipSample(id, data),
      onSuccess: () => {
        invalidate();
        toast({
          title: "发货成功",
          description: "样品已发货",
        });
      },
      onError: (error: any) => {
        toast({
          title: "发货失败",
          description: error.response?.data?.message || "请稍后重试",
          variant: "destructive",
        });
      },
    }),
  };
};

/**
 * 采购商操作集合
 */
export const useBuyerActions = (id: number) => {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: ["sampleRequests"] });
    queryClient.invalidateQueries({ queryKey: ["sampleRequest", id] });
  };

  return {
    cancel: useMutation({
      mutationFn: (data: CancelSampleRequestData) => sampleApi.cancelSampleRequest(id, data),
      onSuccess: () => {
        invalidate();
        toast({
          title: "取消成功",
          description: "样品申请已取消",
        });
      },
      onError: (error: any) => {
        toast({
          title: "取消失败",
          description: error.response?.data?.message || "请稍后重试",
          variant: "destructive",
        });
      },
    }),
    
    confirmDelivery: useMutation({
      mutationFn: (data: ConfirmDeliveryData) => sampleApi.confirmDelivery(id, data),
      onSuccess: () => {
        invalidate();
        toast({
          title: "确认成功",
          description: "已确认收货",
        });
      },
      onError: (error: any) => {
        toast({
          title: "确认失败",
          description: error.response?.data?.message || "请稍后重试",
          variant: "destructive",
        });
      },
    }),
    
    evaluate: useMutation({
      mutationFn: (data: SampleEvaluationData) => sampleApi.evaluateSample(id, data),
      onSuccess: () => {
        invalidate();
        toast({
          title: "评价成功",
          description: "感谢您的评价",
        });
      },
      onError: (error: any) => {
        toast({
          title: "评价失败",
          description: error.response?.data?.message || "请稍后重试",
          variant: "destructive",
        });
      },
    }),
  };
};

/**
 * 获取筛选选项（从字典服务获取）
 */
export const useSampleFilters = () => {
  const { isLoggedIn } = useAuth();
  
  return useQuery({
    queryKey: ["sampleFilters"],
    queryFn: async () => {
      // 获取状态字典
      const statuses = await dictionaryService.getSampleRequestStatuses();
      // 获取运输方式字典
      const shippingMethods = await dictionaryService.getShippingMethods();
      
      return {
        success: true,
        message: "获取筛选选项成功",
        data: {
          statuses: statuses.map(item => ({
            value: item.code,
            label: item.name,
            code: item.code,
            name: item.name
          })),
          shippingMethods: shippingMethods.map(item => ({
            value: item.code,
            label: item.name,
            code: item.code,
            name: item.name
          }))
        }
      };
    },
    enabled: isLoggedIn,
    staleTime: 10 * 60 * 1000,
  });
};

/**
 * 获取统计数据
 */
export const useSampleStats = () => {
  const { currentUserType, isLoggedIn } = useAuth();
  
  return useQuery<{ success: boolean; message: string; data: SampleStats }>({
    queryKey: ["sampleStats"],
    queryFn: () => sampleApi.getSampleStats(),
    enabled: isLoggedIn && currentUserType === 'buyer',
    staleTime: 5 * 60 * 1000,
  });
};

/**
 * 获取样品状态字典
 */
export const useSampleStatusDict = () => {
  return useQuery({
    queryKey: ["sampleStatusDict"],
    queryFn: () => dictionaryService.getSampleRequestStatuses(),
    staleTime: 10 * 60 * 1000,
  });
};