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
  paymentMethod: 'CASH' | 'UPI' | 'CREDIT_CARD' | 'DEBIT_CARD';
  paymentStatus: 'PAID' | 'UNPAID';
  items: OrderItemRequest[];
}

export interface OrderResponse {
  orderId: number;
  customerName: string;
  phoneNumber: string;
  paymentMethod: string;
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
  paymentMethodBreakdown: Record<string, number>;
  topItems: {
    itemName: string;
    quantitySold: number;
    revenue: number;
  }[];
}
