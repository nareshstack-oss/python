import { CommonModule, CurrencyPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { finalize } from 'rxjs';
import { ApiService } from '../api.service';
import { FoodItem } from '../models';

@Component({
  selector: 'app-customer-page',
  imports: [CommonModule, FormsModule, CurrencyPipe],
  template: `
    <section class="layout">
      <section class="panel">
        <div class="section-head">
          <div>
            <p class="section-eyebrow">Customer</p>
            <h2>Place an order</h2>
          </div>
          <button type="button" class="ghost" (click)="loadMenu()">Refresh Menu</button>
        </div>

        <div class="menu-grid" *ngIf="menu().length; else loadingOrEmpty">
          <article class="menu-card" *ngFor="let item of menu()">
            <div>
              <h3>{{ item.name }}</h3>
              <p>{{ item.description }}</p>
            </div>
            <div class="card-footer">
              <strong>{{ item.price | currency:'INR':'symbol':'1.0-0' }}</strong>
              <label>
                Qty
                <input type="number" min="0" [ngModel]="quantities()[item.id] || 0" (ngModelChange)="setQuantity(item.id, $event)">
              </label>
            </div>
          </article>
        </div>

        <ng-template #loadingOrEmpty>
          <p class="empty">{{ loading() ? 'Loading menu...' : 'No items available right now.' }}</p>
        </ng-template>
      </section>

      <section class="panel order-panel">
        <div class="section-head">
          <div>
            <p class="section-eyebrow">Checkout</p>
            <h2>Bill and payment</h2>
          </div>
        </div>

        <label>
          Customer name
          <input [(ngModel)]="customerName" placeholder="Naresh">
        </label>

        <label>
          Phone number
          <input [(ngModel)]="phoneNumber" placeholder="9876543210">
        </label>

        <label>
          Payment status
          <select [(ngModel)]="paymentStatus">
            <option value="PAID">Paid</option>
            <option value="UNPAID">Unpaid</option>
          </select>
        </label>

        <div class="bill-lines" *ngIf="selectedItems().length; else noSelection">
          <div class="bill-line" *ngFor="let item of selectedItems()">
            <span>{{ item.name }} x {{ item.quantity }}</span>
            <strong>{{ item.lineTotal | currency:'INR':'symbol':'1.0-0' }}</strong>
          </div>
        </div>

        <ng-template #noSelection>
          <p class="empty">Choose at least one food item to build the bill.</p>
        </ng-template>

        <div class="total-row">
          <span>Total</span>
          <strong>{{ totalAmount() | currency:'INR':'symbol':'1.0-0' }}</strong>
        </div>

        <button type="button" class="primary" [disabled]="submitting() || !selectedItems().length" (click)="submitOrder()">
          {{ submitting() ? 'Placing order...' : 'Place Order' }}
        </button>

        <p class="success" *ngIf="successMessage()">{{ successMessage() }}</p>
        <p class="error" *ngIf="errorMessage()">{{ errorMessage() }}</p>
      </section>
    </section>
  `,
  styles: `
    .layout { display:grid; gap:24px; grid-template-columns: 1.5fr 1fr; }
    .panel { background:rgba(255,255,255,0.8); border:1px solid rgba(92,74,60,0.12); border-radius:28px; padding:24px; backdrop-filter: blur(6px); }
    .section-head { display:flex; justify-content:space-between; align-items:start; gap:16px; margin-bottom:20px; }
    .section-eyebrow { margin:0 0 8px; color:#b25a24; text-transform:uppercase; letter-spacing:.12em; font-size:.78rem; font-weight:700; }
    h2, h3, p { margin:0; }
    .menu-grid { display:grid; gap:16px; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); }
    .menu-card { background:#fffdfa; border:1px solid #eadfcf; border-radius:22px; padding:18px; display:grid; gap:14px; }
    .menu-card p { color:#6b6258; line-height:1.5; }
    .card-footer { display:flex; justify-content:space-between; align-items:end; gap:12px; }
    label { display:grid; gap:8px; font-weight:600; color:#463c35; }
    input, select, button { font:inherit; }
    input, select { width:100%; padding:12px 14px; border-radius:14px; border:1px solid #dfd0bf; background:white; }
    .ghost, .primary { border:0; border-radius:999px; padding:12px 18px; cursor:pointer; }
    .ghost { background:#f3eadc; color:#5d4e40; }
    .primary { background:#c2612a; color:white; font-weight:700; }
    .primary:disabled { opacity:.55; cursor:not-allowed; }
    .bill-lines { display:grid; gap:10px; margin:8px 0 4px; }
    .bill-line, .total-row { display:flex; justify-content:space-between; gap:16px; }
    .total-row { border-top:1px solid #eadfcf; padding-top:16px; font-size:1.1rem; }
    .empty { color:#6b6258; }
    .success { color:#25623b; }
    .error { color:#a33a2f; }
    @media (max-width: 900px) { .layout { grid-template-columns: 1fr; } }
  `
})
export class CustomerPageComponent {
  private readonly api = inject(ApiService);

  readonly menu = signal<FoodItem[]>([]);
  readonly quantities = signal<Record<number, number>>({});
  readonly loading = signal(false);
  readonly submitting = signal(false);
  readonly successMessage = signal('');
  readonly errorMessage = signal('');

  customerName = '';
  phoneNumber = '';
  paymentStatus: 'PAID' | 'UNPAID' = 'PAID';

  readonly selectedItems = computed(() =>
    this.menu()
      .map((item) => {
        const quantity = this.quantities()[item.id] || 0;
        return { ...item, quantity, lineTotal: quantity * item.price };
      })
      .filter((item) => item.quantity > 0)
  );

  readonly totalAmount = computed(() =>
    this.selectedItems().reduce((sum, item) => sum + item.lineTotal, 0)
  );

  constructor() {
    this.loadMenu();
  }

  loadMenu(): void {
    this.loading.set(true);
    this.api.getMenu()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (items) => this.menu.set(items),
        error: () => this.errorMessage.set('Could not load the menu. Start the Spring Boot backend on port 8080.')
      });
  }

  setQuantity(id: number, value: number): void {
    const quantity = Number(value);
    this.quantities.update((current) => ({ ...current, [id]: Math.max(0, quantity || 0) }));
  }

  submitOrder(): void {
    this.successMessage.set('');
    this.errorMessage.set('');

    this.submitting.set(true);
    this.api.placeOrder({
      customerName: this.customerName,
      phoneNumber: this.phoneNumber,
      paymentStatus: this.paymentStatus,
      items: this.selectedItems().map((item) => ({ foodItemId: item.id, quantity: item.quantity }))
    })
      .pipe(finalize(() => this.submitting.set(false)))
      .subscribe({
        next: (response) => {
          this.successMessage.set(`Order #${response.orderId} placed successfully. Total bill: Rs ${response.totalAmount}`);
          this.quantities.set({});
          this.customerName = '';
          this.phoneNumber = '';
        },
        error: (error) => {
          this.errorMessage.set(error?.error?.message || 'Order failed. Check your inputs and backend status.');
        }
      });
  }
}
