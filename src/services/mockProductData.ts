import { Product, ProductListResponse, ProductDetailResponse } from '@/types/product';

// Mock产品数据用于演示
export const mockProducts: Product[] = [
  {
    id: "1",
    name: {
      'zh-CN': "草甘膦原药",
      en: "Glyphosate Technical",
      es: "Glifosato Técnico"
    },
    pesticideName: {
      'zh-CN': "草甘膦",
      en: "Glyphosate", 
      es: "Glifosato"
    },
    formulation: "95%原药",
    totalContent: "95%",
    activeIngredient1: {
      name: {
        'zh-CN': "草甘膦",
        en: "Glyphosate",
        es: "Glifosato"
      },
      content: "95%"
    },
    details: {
      description: "广谱内吸传导型除草剂，对多年生根杂草效果显著",
      productCategory: "除草剂"
    },
    supplier: {
      id: "1",
      name: {
        'zh-CN': "绿源农化科技有限公司",
        en: "GreenSource Agrochem Co., Ltd.",
        es: "GreenSource Agrochem Co., Ltd."
      },
      profile: {
        phone: "021-12345678",
        address: "上海市浦东新区张江高科技园区",
        website: "https://greensource-agro.com",
        description: {
          'zh-CN': "专业的农化产品研发生产企业，致力于为全球用户提供优质产品",
          en: "Professional agricultural chemical R&D and manufacturing company, committed to providing quality products to global users"
        },
        certificates: ["农药生产许可证", "ISO9001认证", "高新技术企业认证"]
      },
      rating: "4.5",
      isTop100: true
    },
    status: "active",
    isListed: true
  },
  {
    id: "2", 
    name: {
      'zh-CN': "多菌灵原药",
      en: "Carbendazim Technical",
      es: "Carbendazim Técnico"
    },
    pesticideName: {
      'zh-CN': "多菌灵",
      en: "Carbendazim",
      es: "Carbendazim"
    },
    formulation: "98%原药",
    totalContent: "98%",
    activeIngredient1: {
      name: {
        'zh-CN': "多菌灵",
        en: "Carbendazim", 
        es: "Carbendazim"
      },
      content: "98%"
    },
    details: {
      description: "广谱内吸性杀菌剂，对多种真菌病害有良好的防治效果",
      productCategory: "杀菌剂"
    },
    supplier: {
      id: "2",
      name: {
        'zh-CN': "绿田化工科技有限公司",
        en: "GreenField Chemical Technology Co., Ltd."
      },
      profile: {
        phone: "0512-87654321",
        address: "江苏省苏州市工业园区创新路168号",
        website: "https://lutian-chem.com",
        description: {
          'zh-CN': "专业研发生产高品质农化产品的科技企业",
          en: "Technology enterprise specializing in R&D and production of high-quality agrochemicals"
        },
        certificates: ["农药生产许可证", "GMP认证", "高新技术企业认证"]
      },
      rating: "4.2",
      isTop100: true
    },
    status: "active",
    isListed: true
  },
  {
    id: "3",
    name: {
      'zh-CN': "吡虫啉原药",
      en: "Imidacloprid Technical", 
      es: "Imidacloprid Técnico"
    },
    pesticideName: {
      'zh-CN': "吡虫啉",
      en: "Imidacloprid",
      es: "Imidacloprid"
    },
    formulation: "97%原药",
    totalContent: "97%",
    activeIngredient1: {
      name: {
        'zh-CN': "吡虫啉",
        en: "Imidacloprid",
        es: "Imidacloprid"
      },
      content: "97%"
    },
    details: {
      description: "新型烟碱类杀虫剂，对刺吸式口器害虫有优异的防治效果",
      productCategory: "杀虫剂"
    },
    supplier: {
      id: "3",
      name: {
        'zh-CN': "华农生物科技有限公司",
        en: "Huanong Biotechnology Co., Ltd."
      },
      rating: "4.0",
      isTop100: false
    },
    status: "active",
    isListed: true
  }
];

// Mock API响应
export const createMockProductListResponse = (
  products: Product[] = mockProducts,
  page: number = 1,
  limit: number = 10
): ProductListResponse => {
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  const paginatedProducts = products.slice(startIndex, endIndex);
  
  return {
    success: true,
    message: "搜索成功",
    data: paginatedProducts,
    meta: {
      totalItems: products.length,
      currentPage: page,
      totalPages: Math.ceil(products.length / limit),
      itemsPerPage: limit
    }
  };
};

export const createMockProductDetailResponse = (product: Product): ProductDetailResponse => {
  return {
    success: true,
    message: "获取成功",
    data: product
  };
};