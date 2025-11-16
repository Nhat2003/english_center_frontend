import { Component } from '@angular/core';

@Component({
  selector: 'app-payments',
  template: `
    <div class="payments-wrapper">
      <app-payment-list></app-payment-list>
    </div>
  `,
  styles: [`
    .payments-wrapper {
      width: 100%;
      height: 100%;
    }
  `]
})
export class PaymentsComponent {}