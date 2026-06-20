export interface SurveyData {
  relationship: string;
  gender: string;
  age_group: string;
  budget: string;
  event: string;
  hobbies: string[];
  personality: string[];
  description: string;
  weights?: {
    hobby?: number;
    personality?: number;
    description?: number;
  };
}

export interface Recommendation {
  id: string;
  name: string;
  category: string;
  price: string;
  imageUrl?: string;
  imageKeyword?: string;
  recommendationComment: string;
  tags: string[];
}
