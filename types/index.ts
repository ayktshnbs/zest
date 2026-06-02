export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string;
  images: string[];
  rating: number;
}

export interface CartItem extends Product {
  quantity: number;
}
