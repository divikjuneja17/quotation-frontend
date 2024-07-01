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

interface Options {
  name: string;
  code: string;
}

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
  providers: [DatePipe]
})
export class HomeComponent implements OnInit {
  today = new Date();
  formattedDate!: any;

  importExportOptions: Options[] | undefined;

  terms = [
    'All rates quoted are valid for 15 days.',
    '40% payment should be done in advance.',
    'No returns will be accepted after 20 days.',
    'The remaining amount should be paid within 20 days of delivery.',
  ];

  total: number = 0;

  public loading = false;

  quoteForm = this.fb.group({
    from: ['', Validators.required],
    to: ['', Validators.required],
    customer: ['', Validators.required],
    customerId: ['', Validators.required],
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

  constructor(private fb: FormBuilder, private http: HttpClient, private datePipe: DatePipe) {}

  ngOnInit(): void {
    this.formattedDate = this.datePipe.transform(this.today, 'MM/dd/yyyy');

    this.items.push(this.createItem('Ocean Freight', 5, 100));
    this.items.push(this.createItem('THC', 5, 100));
    this.items.push(this.createItem('Documentation Fee', 5, 100));

    this.calculateSumTotal();

    this.importExportOptions = [
      { name: 'Import', code: 'IMP' },
      { name: 'Export', code: 'EXP' },
    ]
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
    this.items.controls.forEach((x) => {
      this.total = this.total + x.get('total')?.value;
    });
  }


  onSubmit(): void {
    if (this.quoteForm.valid) {
      this.loading = true;

      const quoteData = this.quoteForm.value;

      const pdfData = {
        ...quoteData,
        date: this.formattedDate,
        total: this.total
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
      Object.keys(this.quoteForm.controls).forEach(field => {
        const control = this.quoteForm.get(field);
        control?.markAsTouched({ onlySelf: true });
      });
      this.loading = false;
    }
  }
}
