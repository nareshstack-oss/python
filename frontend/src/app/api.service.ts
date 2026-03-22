import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { AdminLoginResponse, DailySummary, FoodItem, OrderResponse, PlaceOrderRequest } from './models';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = '/api';

  getMenu(): Observable<FoodItem[]> {
    return this.http.get<FoodItem[]>(`${this.baseUrl}/menu`);
  }

  placeOrder(payload: PlaceOrderRequest): Observable<OrderResponse> {
    return this.http.post<OrderResponse>(`${this.baseUrl}/orders`, payload);
  }

  adminLogin(username: string, password: string): Observable<AdminLoginResponse> {
    return this.http.post<AdminLoginResponse>(`${this.baseUrl}/admin/login`, { username, password });
  }

  getAdminItems(token: string): Observable<FoodItem[]> {
    return this.http.get<FoodItem[]>(`${this.baseUrl}/admin/items`, { headers: this.buildHeaders(token) });
  }

  createFoodItem(token: string, payload: Omit<FoodItem, 'id'>): Observable<FoodItem> {
    return this.http.post<FoodItem>(`${this.baseUrl}/admin/items`, payload, { headers: this.buildHeaders(token) });
  }

  updateFoodItem(token: string, id: number, payload: Omit<FoodItem, 'id'>): Observable<FoodItem> {
    return this.http.put<FoodItem>(`${this.baseUrl}/admin/items/${id}`, payload, { headers: this.buildHeaders(token) });
  }

  getTodaySummary(token: string): Observable<DailySummary> {
    return this.http.get<DailySummary>(`${this.baseUrl}/admin/summary/today`, { headers: this.buildHeaders(token) });
  }

  private buildHeaders(token: string): HttpHeaders {
    return new HttpHeaders({ 'X-Admin-Token': token });
  }
}
