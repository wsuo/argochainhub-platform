export interface RegistrationRequest {
  id: number;
  regReqNo: string;
  status: RegistrationStatus;
  buyerId: number;
  supplierId: number;
  productId: number;
  deadline: string;
  details: RegistrationDetails;
  productSnapshot: ProductSnapshot;
  progressNote?: string;
  estimatedCompletionDate?: string;
  rejectReason?: string;
  createdAt: string;
  updatedAt: string;
  buyer?: BuyerInfo;
  supplier?: SupplierInfo;
  product?: ProductInfo;
}

export interface RegistrationDetails {
  targetCountry: string;
  isExclusive: boolean;
  docReqs: string[];
  sampleReq: SampleRequirement;
  timeline: string;
  budget: Budget;
  additionalRequirements?: string;
}

export interface SampleRequirement {
  needed: boolean;
  quantity?: number;
  unit?: string;
}

export interface Budget {
  amount: number;
  currency: string;
}

export interface ProductSnapshot {
  name: string;
  category: string;
  formulation: string;
  activeIngredient: string;
  content: string;
}

export interface BuyerInfo {
  id: number;
  companyName: string;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
}

export interface SupplierInfo {
  id: number;
  companyName: string;
  contactName: string;
  contactEmail: string;
  contactPhone?: string;
}

export interface ProductInfo {
  id: number;
  name: string;
  category: string;
  formulation: string;
  activeIngredient: string;
  content: string;
  description?: string;
}

export type RegistrationStatus = 
  | 'pending_response' 
  | 'in_progress' 
  | 'completed' 
  | 'declined' 
  | 'cancelled';

export interface CreateRegistrationRequestPayload {
  supplierId: number;
  productId: number;
  targetCountry: string;
  isExclusive: boolean;
  docReqs: string[];
  sampleReq: {
    needed: boolean;
    quantity?: number;
    unit?: string;
  };
  timeline: string;
  budgetAmount: number;
  budgetCurrency: string;
  additionalRequirements?: string;
  deadline: string;
}

export interface UpdateProgressPayload {
  progressNote: string;
  estimatedCompletionDate?: string;
}

export interface RejectRequestPayload {
  rejectReason: string;
}

export interface RegistrationStats {
  pendingResponse: number;
  inProgress: number;
  completed: number;
  declined: number;
  cancelled: number;
  total: number;
}

export interface RegistrationFiltersData {
  search?: string;
  status?: string;
  supplierId?: number;
  productId?: number;
  targetCountry?: string;
  dateFrom?: string;
  dateTo?: string;
}