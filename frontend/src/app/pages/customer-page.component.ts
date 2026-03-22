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
    <section class="hero-band">
      <div class="hero-copy">
        <p class="section-eyebrow">House Special</p>
        <h2>Traditional breakfast plates and meal combos served with a premium counter experience.</h2>
        <p class="hero-text">
          Nainika Tiffine Center combines quick ordering with a refined front desk flow, so customers can order in seconds
          while your team keeps billing, payment, and day-end reporting under control.
        </p>
      </div>

      <div class="hero-stats">
        <article>
          <span>Menu Items</span>
          <strong>{{ menu().length }}</strong>
        </article>
        <article>
          <span>Selected Plates</span>
          <strong>{{ selectedItems().length }}</strong>
        </article>
        <article>
          <span>Current Bill</span>
          <strong>{{ totalAmount() | currency:'INR':'symbol':'1.0-0' }}</strong>
        </article>
      </div>
    </section>

    <section class="layout">
      <section class="panel menu-panel">
        <div class="section-head">
          <div>
            <p class="section-eyebrow">Customer Counter</p>
            <h2>Choose today's tiffin menu</h2>
          </div>
          <button type="button" class="ghost" (click)="loadMenu()">Refresh Menu</button>
        </div>

        <div class="menu-grid" *ngIf="menu().length; else loadingOrEmpty">
          <article class="menu-card" *ngFor="let item of menu()">
            <div class="menu-copy">
              <div class="menu-head">
                <h3>{{ item.name }}</h3>
                <span class="price-pill">{{ item.price | currency:'INR':'symbol':'1.0-0' }}</span>
              </div>
              <p>{{ item.description }}</p>
            </div>
            <div class="card-footer">
              <label class="qty-field">
                <span>Quantity</span>
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
        <div class="section-head compact">
          <div>
            <p class="section-eyebrow">Billing Desk</p>
            <h2>Create the order ticket</h2>
          </div>
        </div>

        <div class="form-stack">
          <label>
            <span>Customer name</span>
            <input [(ngModel)]="customerName" placeholder="Naresh">
          </label>

          <label>
            <span>Phone number</span>
            <input [(ngModel)]="phoneNumber" placeholder="9876543210">
          </label>

          <label>
            <span>Payment method</span>
            <select [(ngModel)]="paymentMethod">
              <option value="CASH">Cash</option>
              <option value="UPI">UPI</option>
              <option value="CREDIT_CARD">Credit Card</option>
              <option value="DEBIT_CARD">Debit Card</option>
            </select>
          </label>

          <div class="payment-detail-card" *ngIf="paymentMethod === 'UPI'">
            <label>
              <span>UPI ID</span>
              <input [(ngModel)]="upiId" placeholder="name@bank">
            </label>
          </div>

          <div class="payment-detail-card" *ngIf="isCardPayment()">
            <label>
              <span>Card holder name</span>
              <input [(ngModel)]="cardHolderName" placeholder="Naresh Bhukya">
            </label>

            <label>
              <span>Card number</span>
              <input [(ngModel)]="cardNumber" maxlength="19" placeholder="1234 5678 9012 3456">
            </label>

            <div class="card-row">
              <label>
                <span>Expiry</span>
                <input [(ngModel)]="expiry" maxlength="5" placeholder="MM/YY">
              </label>

              <label>
                <span>CVV</span>
                <input [(ngModel)]="cvv" maxlength="4" type="password" placeholder="123">
              </label>
            </div>
          </div>

          <label>
            <span>Payment status</span>
            <select [(ngModel)]="paymentStatus">
              <option value="PAID">Paid</option>
              <option value="UNPAID">Unpaid</option>
            </select>
          </label>
        </div>

        <div class="ticket-box" *ngIf="selectedItems().length; else noSelection">
          <div class="ticket-head">
            <span>Live Ticket</span>
            <strong>{{ selectedItems().length }} items</strong>
          </div>
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

        <button type="button" class="primary" [disabled]="submitting() || !canSubmit()" (click)="submitOrder()">
          {{ submitting() ? 'Placing order...' : 'Place Order' }}
        </button>

        <p class="success" *ngIf="successMessage()">{{ successMessage() }}</p>
        <p class="error" *ngIf="errorMessage()">{{ errorMessage() }}</p>
      </section>
    </section>
  `,
  styles: `
    .hero-band { display:grid; grid-template-columns: 1.35fr .9fr; gap:24px; margin-bottom:24px; }
    .hero-copy, .hero-stats, .panel {
      background: rgba(255, 251, 244, 0.78);
      border: 1px solid rgba(103, 77, 58, 0.12);
      backdrop-filter: blur(10px);
      box-shadow: 0 22px 44px rgba(58, 41, 26, 0.09);
    }
    .hero-copy {
      padding: 30px 32px;
      border-radius: 34px;
      background:
        radial-gradient(circle at top right, rgba(215, 115, 52, 0.22), transparent 22%),
        linear-gradient(135deg, rgba(24, 88, 68, 0.95), rgba(43, 110, 86, 0.9));
      color: #fff7ed;
    }
    .hero-copy h2 {
      margin: 0;
      font-family: "Palatino Linotype", "Book Antiqua", serif;
      font-size: clamp(2rem, 3vw, 3rem);
      line-height: 0.98;
    }
    .hero-text {
      margin-top: 18px;
      max-width: 640px;
      color: rgba(255, 247, 237, 0.84);
      line-height: 1.7;
      font-size: 1rem;
    }
    .hero-stats {
      border-radius: 34px;
      padding: 22px;
      display: grid;
      gap: 14px;
      align-content: stretch;
    }
    .hero-stats article {
      padding: 18px 20px;
      border-radius: 22px;
      background: linear-gradient(180deg, #fffdf8, #f8efe1);
      border: 1px solid #ead9c4;
      display: grid;
      gap: 8px;
    }
    .hero-stats span {
      color: #7c6958;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      font-size: 0.76rem;
      font-weight: 700;
    }
    .hero-stats strong {
      font-size: 1.8rem;
      color: #1f1a15;
    }
    .layout { display:grid; gap:24px; grid-template-columns: 1.45fr .92fr; }
    .panel { border-radius: 34px; padding: 28px; }
    .section-head { display:flex; justify-content:space-between; align-items:start; gap:16px; margin-bottom:22px; }
    .compact { margin-bottom: 18px; }
    .section-eyebrow { margin:0 0 8px; color:#b25a24; text-transform:uppercase; letter-spacing:.14em; font-size:.76rem; font-weight:800; }
    h2, h3, p { margin:0; }
    .menu-panel h2, .order-panel h2 {
      font-family: "Palatino Linotype", "Book Antiqua", serif;
      font-size: 2rem;
      line-height: 1;
    }
    .menu-grid { display:grid; gap:18px; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); }
    .menu-card {
      background: linear-gradient(180deg, #fffdfa, #f8f0e5);
      border:1px solid #eadfcf;
      border-radius:26px;
      padding:20px;
      display:grid;
      gap:18px;
      transition: transform .18s ease, box-shadow .18s ease;
    }
    .menu-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 18px 30px rgba(62, 45, 28, 0.1);
    }
    .menu-head {
      display: flex;
      align-items: start;
      justify-content: space-between;
      gap: 12px;
      margin-bottom: 10px;
    }
    .menu-copy p { color:#6b6258; line-height:1.6; }
    .price-pill {
      padding: 8px 12px;
      border-radius: 999px;
      background: #1d5b47;
      color: #fff8ee;
      font-size: 0.86rem;
      font-weight: 800;
      white-space: nowrap;
    }
    .card-footer { display:flex; justify-content:flex-end; align-items:end; gap:12px; }
    .qty-field { min-width: 120px; }
    .qty-field span, label span { font-size: 0.84rem; text-transform: uppercase; letter-spacing: 0.08em; color: #836f5c; }
    .form-stack { display: grid; gap: 16px; margin-bottom: 18px; }
    .payment-detail-card {
      display: grid;
      gap: 14px;
      padding: 16px;
      border-radius: 22px;
      background: linear-gradient(180deg, #fff8f0, #f5ebdd);
      border: 1px solid #e4d2bc;
    }
    .card-row {
      display: grid;
      gap: 14px;
      grid-template-columns: 1fr 1fr;
    }
    label { display:grid; gap:8px; font-weight:700; color:#463c35; }
    input, select, button { font:inherit; }
    input, select {
      width:100%;
      padding:14px 16px;
      border-radius:16px;
      border:1px solid #dfd0bf;
      background:white;
      box-shadow: inset 0 1px 0 rgba(255,255,255,0.55);
    }
    .ghost, .primary {
      border:0;
      border-radius:999px;
      padding:13px 20px;
      cursor:pointer;
      font-weight: 800;
      letter-spacing: 0.01em;
    }
    .ghost {
      background:#f1e7d8;
      color:#5d4e40;
    }
    .primary {
      background: linear-gradient(135deg, #195844, #cf6829);
      color:white;
      box-shadow: 0 16px 28px rgba(38, 29, 20, 0.16);
    }
    .primary:disabled { opacity:.55; cursor:not-allowed; }
    .ticket-box {
      display:grid;
      gap:12px;
      margin:8px 0 8px;
      padding:18px;
      border-radius:24px;
      background: linear-gradient(180deg, #fff8f0, #f6ecdf);
      border: 1px dashed #d8bea1;
    }
    .ticket-head {
      display:flex;
      justify-content:space-between;
      color:#735f4e;
      text-transform: uppercase;
      letter-spacing: .08em;
      font-size: .76rem;
      font-weight: 800;
    }
    .bill-line, .total-row { display:flex; justify-content:space-between; gap:16px; }
    .total-row {
      border-top:1px solid #eadfcf;
      padding-top:18px;
      margin-top: 8px;
      font-size:1.14rem;
    }
    .empty { color:#6b6258; }
    .success { color:#25623b; }
    .error { color:#a33a2f; }
    @media (max-width: 980px) {
      .hero-band,
      .layout { grid-template-columns: 1fr; }
    }
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
  paymentMethod: 'CASH' | 'UPI' | 'CREDIT_CARD' | 'DEBIT_CARD' = 'CASH';
  paymentStatus: 'PAID' | 'UNPAID' = 'PAID';
  upiId = '';
  cardHolderName = '';
  cardNumber = '';
  expiry = '';
  cvv = '';

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

  isCardPayment(): boolean {
    return this.paymentMethod === 'CREDIT_CARD' || this.paymentMethod === 'DEBIT_CARD';
  }

  hasPaymentDetails(): boolean {
    if (this.paymentMethod === 'UPI') {
      return !!this.upiId.trim();
    }

    if (this.isCardPayment()) {
      return !!this.cardHolderName.trim() && !!this.cardNumber.trim() && !!this.expiry.trim() && !!this.cvv.trim();
    }

    return true;
  }

  canSubmit(): boolean {
    return !!this.customerName.trim()
      && !!this.phoneNumber.trim()
      && this.selectedItems().length > 0
      && this.hasPaymentDetails();
  }

  submitOrder(): void {
    this.successMessage.set('');
    this.errorMessage.set('');

    this.submitting.set(true);
    this.api.placeOrder({
      customerName: this.customerName,
      phoneNumber: this.phoneNumber,
      paymentMethod: this.paymentMethod,
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
          this.paymentMethod = 'CASH';
          this.upiId = '';
          this.cardHolderName = '';
          this.cardNumber = '';
          this.expiry = '';
          this.cvv = '';
        },
        error: (error) => {
          const details = error?.error;
          const message =
            details?.detail ||
            details?.message ||
            (Array.isArray(details?.errors) ? details.errors.join(', ') : '') ||
            'Order failed. Check your inputs and backend status.';
          this.errorMessage.set(message);
        }
      });
  }
}
