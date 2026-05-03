import { ChangeDetectionStrategy, Component, input, output } from '@angular/core';
import { DatePipe, NgClass } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';
import { DialogModule } from 'primeng/dialog';
import { TagModule } from 'primeng/tag';
import { TransactionResponse, TransactionType, PaymentMethod, RecurrenceType } from '../../../core/models';

@Component({
  selector: 'app-transaction-detail-dialog',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DialogModule, TagModule, TranslateModule, DatePipe, NgClass],
  templateUrl: './transaction-detail-dialog.component.html',
  styleUrl: './transaction-detail-dialog.component.scss',
})
export class TransactionDetailDialogComponent {
  readonly TransactionType = TransactionType;

  visible = input.required<boolean>();
  tx = input<TransactionResponse | null>(null);
  close = output<void>();

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  }

  paymentMethodLabel(pm: PaymentMethod | null): string {
    if (!pm) return '-';
    const map: Record<string, string> = {
      [PaymentMethod.Pix]: 'Pix',
      [PaymentMethod.CreditCard]: 'Cartão de crédito',
      [PaymentMethod.DebitCard]: 'Cartão de débito',
      [PaymentMethod.Cash]: 'Dinheiro',
      [PaymentMethod.Ted]: 'TED',
      [PaymentMethod.Boleto]: 'Boleto',
      [PaymentMethod.Other]: 'Outro',
    };
    return map[pm] ?? pm;
  }

  recurrenceLabel(rt: RecurrenceType): string {
    const map: Record<string, string> = {
      [RecurrenceType.None]: 'Nenhuma',
      [RecurrenceType.Daily]: 'Diária',
      [RecurrenceType.Weekly]: 'Semanal',
      [RecurrenceType.Monthly]: 'Mensal',
      [RecurrenceType.Yearly]: 'Anual',
    };
    return map[rt] ?? rt;
  }
}
