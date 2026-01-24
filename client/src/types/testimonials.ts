export interface Testimonial {
  id: string;
  userName: string; // "Firstname LastInitial"
  location?: string;
  rating: number;
  title?: string;
  body: string;
  productName: string;
  productCategory: 'male' | 'female';
  isVerifiedPurchase: boolean;
  createdAt: string;
  relativeDate: string;
}

export interface TestimonialsResponse {
  success: boolean;
  data: Testimonial[];
  meta: {
    total: number;
    averageRating: number;
    count: number;
  };
}