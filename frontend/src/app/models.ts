export interface FoodItem {
  id: number;
  name: string;
  description: string;
  price: number;
  available: boolean;
}

export interface OrderItemRequest {
  foodItemId: number;
  quantity: number;
}

export interface PlaceOrderRequest {
  customerName: string;
  phoneNumber: string;
  paymentStatus: 'PAID' | 'UNPAID';
  items: OrderItemRequest[];
}

export interface OrderResponse {
  orderId: number;
  customerName: string;
  phoneNumber: string;
  paymentStatus: string;
  totalAmount: number;
  createdAt: string;
}

export interface AdminLoginResponse {
  token: string;
  message: string;
}

export interface DailySummary {
  totalOrders: number;
  totalRevenue: number;
  paidOrders: number;
  unpaidOrders: number;
  topItems: {
    itemName: string;
    quantitySold: number;
    revenue: number;
  }[];
}
