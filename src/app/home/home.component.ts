import { Component, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  FormArray,
  Validators,
  FormControl,
} from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { DatePipe } from '@angular/common';
import {
  ConfirmEventType,
  ConfirmationService,
  MessageService,
} from 'primeng/api';

interface Options {
  name: string;
  code: string;
}

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  providers: [DatePipe, ConfirmationService, MessageService],
})
export class HomeComponent implements OnInit {
  today = new Date();
  formattedDate!: any;

  importExportOptions: Options[] | undefined;
  incotermsOptions: Options[] | undefined;
  salespersonOptions: Options[] | undefined;
  unitOptions: Options[] | undefined;

  terms = [
    // 'All rates quoted are valid for 15 days.',
    // '40% payment should be done in advance.',
    // 'No returns will be accepted after 20 days.',
    // 'The remaining amount should be paid within 20 days of delivery.',
    'Subject to space and equipment.',
    'Rate subject to changes at the time booking.',
    'Subject to taxes as applicable at time of shipment.',
    'Carrier BL terms and conditions applicable.',
    'GRI and other surcharges as applicable (if announced after day of quotation).',
    'Limited Liability up to 3% of agreed freight.',
    'Insurance for cargo and container, transit in scope of shipper/consignee.',
  ];

  total: number = 0;

  public loading = false;

  uniqueCustomerId = this.generateUniqueId();

  quoteForm = this.fb.group({
    from: ['', Validators.required],
    to: ['', Validators.required],
    customer: ['', Validators.required],
    customerId: [
      { value: this.uniqueCustomerId, disabled: true },
      Validators.required,
    ],
    validity: ['', Validators.required],
    transitTime: ['', Validators.required],
    freeTime: ['', Validators.required],
    incoterms: ['', Validators.required],
    sailing: ['', Validators.required],
    commodity: ['', Validators.required],
    salesPerson: ['', Validators.required],
    lclFclWeight: ['', Validators.required],
    importExport: ['', Validators.required],
    unit: ['', Validators.required],
    status: ['', Validators.required],
    remarks: ['', Validators.required],
    items: this.fb.array([]),
  });

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private datePipe: DatePipe,
    private confirmationService: ConfirmationService,
    private messageService: MessageService
  ) {}

  ngOnInit(): void {
    this.formattedDate = this.datePipe.transform(this.today, 'MM/dd/yyyy');

    this.items.push(this.createItem('Ocean Freight', 5, 100));
    this.items.push(this.createItem('THC', 5, 100));
    this.items.push(this.createItem('Documentation Fee', 5, 100));

    this.calculateSumTotal();

    this.importExportOptions = [
      { name: 'Import', code: 'IMP' },
      { name: 'Export', code: 'EXP' },
    ];

    this.incotermsOptions = [
      { name: 'EX Works', code: 'EX' },
      { name: 'FCA', code: 'FCA' },
      { name: 'CPT', code: 'CPT' },
      { name: 'CIP', code: 'CIP' },
      { name: 'DAP', code: 'DAP' },
      { name: 'DPU', code: 'DPU' },
      { name: 'DDP', code: 'DDP' },
      { name: 'FAS', code: 'FAS' },
      { name: 'FOB', code: 'FOB' },
      { name: 'CIF', code: 'CIF' },
    ];

    this.salespersonOptions = [
      { name: 'Rishabh Chaudhary', code: 'RC' },
      { name: 'Vivek Uniyal', code: 'VU' },
      { name: 'Kartik Wadhwa', code: 'KW' },
    ];

    this.unitOptions = [
      { name: '20STD', code: '20STD' },
      { name: '20HC', code: '20HC' },
      { name: '20OT', code: '20OT' },
      { name: '20RF', code: '20RF' },
      { name: '20FR', code: '20FR' },
      { name: '40STD', code: '40STD' },
      { name: '40HC', code: '40HC' },
      { name: '40OT', code: '40OT' },
      { name: '40RF', code: '40RF' },
      { name: '40FR', code: '40FR' },
      { name: 'NOR', code: 'NOR' },
      { name: '4SHC', code: '4SHC' },
      { name: 'BBK', code: 'BBK' },
      { name: 'AIR', code: 'AIR' },
    ];
  }

  get items() {
    return this.quoteForm.controls['items'] as FormArray;
  }

  createItem(description: string, quantity: number, price: number): FormGroup {
    return this.fb.group({
      description: [description, Validators.required],
      quantity: [quantity, Validators.required],
      price: [price, Validators.required],
      // total: [{ value: quantity * price, disabled: true }, Validators.required], //status of total control to be disabled.
      total: [quantity * price, Validators.required],
    });
  }

  addItem(): void {
    this.items.push(this.createItem('', 1, 0));
  }

  removeItem(index: number): void {
    this.items.removeAt(index);
  }

  calculateTotalForEachRow(i: number) {
    this.items.controls[i]
      .get('total')
      ?.setValue(
        this.items.controls[i].get('quantity')?.value *
          this.items.controls[i].get('price')?.value
      );
  }

  calculateSumTotal() {
    this.total = 0;
    this.items.controls.forEach((x) => {
      this.total = this.total + x.get('total')?.value;
    });
  }

  generateUniqueId(): string {
    return Math.floor(10000000 + Math.random() * 90000000).toString();
  }

  onSubmit(): void {
    this.confirmationService.confirm({
      message: 'Are you sure that you have closed your excel file?',
      header: 'Confirmation',
      icon: 'pi pi-exclamation-triangle',
      accept: () => {
        if (this.quoteForm.valid) {
          this.messageService.add({
            severity: 'info',
            summary: 'Confirmed',
            detail: 'PDF is generating...Please wait.',
          });

          this.loading = true;

          const quoteData = this.quoteForm.value;

          const pdfData = {
            ...quoteData,
            date: this.formattedDate,
            total: this.total,
            customerId: this.uniqueCustomerId,
          };

          this.http
            .post('http://localhost:3000/api/quotes', pdfData, {
              responseType: 'blob',
            })
            .subscribe((response) => {
              const blob = new Blob([response], { type: 'application/pdf' });
              const url = window.URL.createObjectURL(blob);
              const a = document.createElement('a');
              a.href = url;
              a.download = 'quote.pdf';
              a.click();
              window.URL.revokeObjectURL(url);
              this.loading = false;
            });
        } else {
          Object.keys(this.quoteForm.controls).forEach((field) => {
            const control = this.quoteForm.get(field);
            control?.markAsTouched({ onlySelf: true });
          });
          this.loading = false;
          this.messageService.add({
            severity: 'error',
            summary: 'Rejected',
            detail: 'Please fill the required fields.',
          });
        }
      },
      reject: (type: any) => {
        switch (type) {
          case ConfirmEventType.REJECT:
            this.messageService.add({
              severity: 'error',
              summary: 'Rejected',
              detail: 'You have rejected.',
            });
            break;
          case ConfirmEventType.CANCEL:
            this.messageService.add({
              severity: 'warn',
              summary: 'Cancelled',
              detail: 'You have cancelled.',
            });
            break;
        }
      },
    });
  }
}
