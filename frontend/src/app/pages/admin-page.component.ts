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
      <section class="panel">
        <div class="section-head">
          <div>
            <p class="section-eyebrow">Admin</p>
            <h2>Food item management</h2>
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

      <section class="panel">
        <div class="section-head">
          <div>
            <p class="section-eyebrow">Summary</p>
            <h2>End of day</h2>
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
        <p class="section-eyebrow">Admin Access</p>
        <h2>Login to manage the tiffin center</h2>

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
    .admin-layout { display:grid; gap:24px; grid-template-columns: 1.2fr .8fr; }
    .panel { background:rgba(255,255,255,0.82); border:1px solid rgba(92,74,60,0.12); border-radius:28px; padding:24px; }
    .section-head { display:flex; justify-content:space-between; align-items:start; gap:16px; margin-bottom:20px; }
    .section-eyebrow { margin:0 0 8px; color:#b25a24; text-transform:uppercase; letter-spacing:.12em; font-size:.78rem; font-weight:700; }
    h2, h3, p { margin:0; }
    label, .item-form input { display:block; }
    input { width:100%; padding:12px 14px; border-radius:14px; border:1px solid #dfd0bf; background:white; font:inherit; }
    .item-form { display:grid; gap:12px; margin-bottom:20px; }
    .check { display:flex; gap:10px; align-items:center; font-weight:600; color:#4c4138; }
    .item-list, .top-items { display:grid; gap:12px; }
    .item-card, .summary-grid article { border:1px solid #eadfcf; background:#fffdfa; border-radius:18px; padding:16px; }
    .item-card { display:grid; gap:10px; }
    .item-card p { color:#6b6258; }
    .item-meta, .top-item { display:flex; justify-content:space-between; gap:12px; }
    .summary-grid { display:grid; gap:12px; grid-template-columns: repeat(2, 1fr); margin-bottom:18px; }
    .summary-grid article { display:grid; gap:6px; }
    .summary-grid span { color:#6b6258; }
    .summary-grid strong { font-size:1.4rem; }
    .ghost, .primary { border:0; border-radius:999px; padding:12px 18px; cursor:pointer; font:inherit; }
    .ghost { background:#f3eadc; color:#5d4e40; }
    .primary { background:#c2612a; color:white; font-weight:700; }
    .login-panel { max-width:480px; }
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
