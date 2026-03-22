import { CommonModule, CurrencyPipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { ApiService } from '../api.service';
import { DailySummary, FoodItem } from '../models';

@Component({
  selector: 'app-admin-page',
  imports: [CommonModule, FormsModule, CurrencyPipe],
  template: `
    <section class="admin-layout" *ngIf="token(); else loginView">
      <section class="panel control-panel">
        <div class="section-head">
          <div>
            <p class="section-eyebrow">Admin Studio</p>
            <h2>Curate the counter menu</h2>
          </div>
          <button class="ghost" type="button" (click)="logout()">Logout</button>
        </div>

        <form class="item-form" (ngSubmit)="saveItem()">
          <input [(ngModel)]="draft.name" name="name" placeholder="Item name" required>
          <input [(ngModel)]="draft.description" name="description" placeholder="Description" required>
          <input [(ngModel)]="draft.price" name="price" type="number" min="0" placeholder="Price" required>
          <label class="check">
            <input [(ngModel)]="draft.available" name="available" type="checkbox">
            Available
          </label>
          <button class="primary" type="submit">{{ editingId() ? 'Update Item' : 'Add Item' }}</button>
        </form>

        <div class="item-list">
          <article class="item-card" *ngFor="let item of items()">
            <div>
              <h3>{{ item.name }}</h3>
              <p>{{ item.description }}</p>
            </div>
            <div class="item-meta">
              <strong>{{ item.price | currency:'INR':'symbol':'1.0-0' }}</strong>
              <span>{{ item.available ? 'Available' : 'Hidden' }}</span>
            </div>
            <button class="ghost" type="button" (click)="editItem(item)">Edit</button>
          </article>
        </div>
      </section>

      <section class="panel summary-panel">
        <div class="section-head">
          <div>
            <p class="section-eyebrow">Business Pulse</p>
            <h2>End-of-day summary</h2>
          </div>
          <button class="ghost" type="button" (click)="loadDashboard()">Refresh</button>
        </div>

        <div class="summary-grid" *ngIf="summary() as data">
          <article>
            <span>Total orders</span>
            <strong>{{ data.totalOrders }}</strong>
          </article>
          <article>
            <span>Revenue</span>
            <strong>{{ data.totalRevenue | currency:'INR':'symbol':'1.0-0' }}</strong>
          </article>
          <article>
            <span>Paid</span>
            <strong>{{ data.paidOrders }}</strong>
          </article>
          <article>
            <span>Unpaid</span>
            <strong>{{ data.unpaidOrders }}</strong>
          </article>
        </div>

        <div class="payment-strip" *ngIf="summary()?.paymentMethodBreakdown as breakdown">
          <article *ngFor="let method of paymentMethods">
            <span>{{ method.label }}</span>
            <strong>{{ breakdown[method.key] || 0 }}</strong>
          </article>
        </div>

        <div class="top-items" *ngIf="summary()?.topItems?.length">
          <h3>Best sellers</h3>
          <div class="top-item" *ngFor="let item of summary()?.topItems">
            <span>{{ item.itemName }} ({{ item.quantitySold }})</span>
            <strong>{{ item.revenue | currency:'INR':'symbol':'1.0-0' }}</strong>
          </div>
        </div>

        <p class="error" *ngIf="errorMessage()">{{ errorMessage() }}</p>
      </section>
    </section>

    <ng-template #loginView>
      <section class="panel login-panel">
        <p class="section-eyebrow">Nainika Tiffine Center</p>
        <h2>Login to the admin control room</h2>
        <p class="intro">Manage menu pricing, availability, and the day-end sales picture from one place.</p>

        <label>
          Username
          <input [(ngModel)]="username" placeholder="admin">
        </label>

        <label>
          Password
          <input [(ngModel)]="password" type="password" placeholder="admin123">
        </label>

        <button class="primary" type="button" (click)="login()">Login</button>
        <p class="hint">Default demo credentials: <code>admin / admin123</code></p>
        <p class="error" *ngIf="errorMessage()">{{ errorMessage() }}</p>
      </section>
    </ng-template>
  `,
  styles: `
    .admin-layout { display:grid; gap:24px; grid-template-columns: 1.15fr .85fr; }
    .panel {
      background:rgba(255,251,244,0.82);
      border:1px solid rgba(92,74,60,0.12);
      border-radius:34px;
      padding:28px;
      backdrop-filter: blur(10px);
      box-shadow: 0 22px 44px rgba(58, 41, 26, 0.09);
    }
    .control-panel {
      background:
        linear-gradient(180deg, rgba(255,251,244,0.9), rgba(255,246,235,0.86));
    }
    .summary-panel {
      background:
        radial-gradient(circle at top right, rgba(25, 88, 68, 0.13), transparent 28%),
        linear-gradient(180deg, rgba(255,251,244,0.9), rgba(247,238,224,0.9));
    }
    .section-head { display:flex; justify-content:space-between; align-items:start; gap:16px; margin-bottom:22px; }
    .section-eyebrow { margin:0 0 8px; color:#b25a24; text-transform:uppercase; letter-spacing:.14em; font-size:.76rem; font-weight:800; }
    h2, h3, p { margin:0; }
    h2 {
      font-family: "Palatino Linotype", "Book Antiqua", serif;
      font-size: 2rem;
      line-height: 1;
    }
    label, .item-form input { display:block; }
    input {
      width:100%;
      padding:14px 16px;
      border-radius:16px;
      border:1px solid #dfd0bf;
      background:white;
      font:inherit;
    }
    .item-form { display:grid; gap:14px; margin-bottom:22px; }
    .check { display:flex; gap:10px; align-items:center; font-weight:600; color:#4c4138; }
    .item-list, .top-items { display:grid; gap:12px; }
    .payment-strip {
      display:grid;
      gap:12px;
      grid-template-columns: repeat(2, 1fr);
      margin-bottom: 18px;
    }
    .payment-strip article {
      border:1px solid #eadfcf;
      background:linear-gradient(180deg, #fffdfa, #f8efe2);
      border-radius:22px;
      padding:18px;
      display:grid;
      gap:6px;
    }
    .payment-strip span {
      color:#6b6258;
      text-transform:uppercase;
      letter-spacing:.08em;
      font-size:.74rem;
      font-weight:800;
    }
    .payment-strip strong { font-size:1.3rem; }
    .item-card, .summary-grid article {
      border:1px solid #eadfcf;
      background:linear-gradient(180deg, #fffdfa, #f8efe2);
      border-radius:22px;
      padding:18px;
    }
    .item-card { display:grid; gap:10px; }
    .item-card p { color:#6b6258; }
    .item-meta, .top-item { display:flex; justify-content:space-between; gap:12px; }
    .summary-grid { display:grid; gap:12px; grid-template-columns: repeat(2, 1fr); margin-bottom:18px; }
    .summary-grid article { display:grid; gap:6px; }
    .summary-grid span { color:#6b6258; }
    .summary-grid strong { font-size:1.4rem; }
    .ghost, .primary {
      border:0;
      border-radius:999px;
      padding:13px 20px;
      cursor:pointer;
      font:inherit;
      font-weight:800;
    }
    .ghost { background:#f3eadc; color:#5d4e40; }
    .primary {
      background: linear-gradient(135deg, #195844, #cf6829);
      color:white;
      box-shadow: 0 16px 28px rgba(38, 29, 20, 0.16);
    }
    .login-panel { max-width:480px; }
    .intro { margin: 0 0 18px; color:#6b6258; line-height:1.6; }
    .hint { color:#6b6258; }
    .error { color:#a33a2f; margin-top:12px; }
    @media (max-width: 900px) { .admin-layout { grid-template-columns: 1fr; } }
  `
})
export class AdminPageComponent {
  private readonly api = inject(ApiService);

  readonly token = signal(localStorage.getItem('adminToken') || '');
  readonly items = signal<FoodItem[]>([]);
  readonly summary = signal<DailySummary | null>(null);
  readonly editingId = signal<number | null>(null);
  readonly errorMessage = signal('');
  readonly isLoggedIn = computed(() => !!this.token());

  username = 'admin';
  password = 'admin123';
  draft: Omit<FoodItem, 'id'> = { name: '', description: '', price: 0, available: true };
  readonly paymentMethods = [
    { key: 'CASH', label: 'Cash' },
    { key: 'UPI', label: 'UPI' },
    { key: 'CREDIT_CARD', label: 'Credit Card' },
    { key: 'DEBIT_CARD', label: 'Debit Card' }
  ];

  constructor() {
    if (this.isLoggedIn()) {
      this.loadDashboard();
    }
  }

  login(): void {
    this.errorMessage.set('');
    this.api.adminLogin(this.username, this.password).subscribe({
      next: (response) => {
        localStorage.setItem('adminToken', response.token);
        this.token.set(response.token);
        this.loadDashboard();
      },
      error: () => this.errorMessage.set('Admin login failed. Use the backend default credentials or update them.')
    });
  }

  logout(): void {
    localStorage.removeItem('adminToken');
    this.token.set('');
    this.items.set([]);
    this.summary.set(null);
    this.editingId.set(null);
  }

  loadDashboard(): void {
    if (!this.token()) {
      return;
    }

    forkJoin({
      items: this.api.getAdminItems(this.token()),
      summary: this.api.getTodaySummary(this.token())
    }).subscribe({
      next: ({ items, summary }) => {
        this.items.set(items);
        this.summary.set(summary);
      },
      error: () => this.errorMessage.set('Could not load admin data. Confirm the backend is running and the admin token is valid.')
    });
  }

  editItem(item: FoodItem): void {
    this.editingId.set(item.id);
    this.draft = { name: item.name, description: item.description, price: item.price, available: item.available };
  }

  saveItem(): void {
    const request$ = this.editingId()
      ? this.api.updateFoodItem(this.token(), this.editingId()!, this.draft)
      : this.api.createFoodItem(this.token(), this.draft);

    request$.subscribe({
      next: () => {
        this.draft = { name: '', description: '', price: 0, available: true };
        this.editingId.set(null);
        this.loadDashboard();
      },
      error: () => this.errorMessage.set('Saving the food item failed.')
    });
  }
}
