// input-with-list.component.ts
import { Component, forwardRef, Input, OnInit, OnDestroy } from '@angular/core';
import { ControlValueAccessor, NG_VALUE_ACCESSOR, FormControl, FormGroup } from '@angular/forms';
import { Observable, Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, filter, switchMap, takeUntil } from 'rxjs/operators';
import { ProductService, ProductDTO } from './product.service';

@Component({
  selector: 'app-input-with-list',
  templateUrl: './input-with-list.component.html',
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => InputWithListComponent),
      multi: true,
    },
  ],
})
export class InputWithListComponent implements OnInit, OnDestroy, ControlValueAccessor {
  @Input() label = 'Produkt';
  @Input() minChars = 3;
  @Input() form?: FormGroup;
  @Input() codeTargetName?: string; // np. 'productCode'

  ctrl = new FormControl<string>('');
  options$!: Observable<ProductDTO[]>;
  private onChange: (val: string) => void = () => {};
  private onTouched: () => void = () => {};
  private destroy$ = new Subject<void>();

  // ostatnio wybrany produkt z listy (by rozpoznać free-text)
  private lastPicked?: ProductDTO;

  constructor(private productService: ProductService) {}

  ngOnInit(): void {
    // szukanie po wpisaniu minChars
    this.options$ = this.ctrl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      filter((v) => (v ?? '').length >= this.minChars),
      switchMap((v) => this.productService.search(v ?? ''))
    );

    // propaguj wartość do rodzica (CVAccessor)
    this.ctrl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe((v) => this.onChange(v ?? ''));

    // kiedy user ręcznie zmienia nazwę, wyczyść „wyborowy” stan
    this.ctrl.valueChanges.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.lastPicked = undefined;
    });
  }

  writeValue(val: string): void {
    this.ctrl.setValue(val ?? '', { emitEvent: false });
  }
  registerOnChange(fn: any): void {
    this.onChange = fn;
  }
  registerOnTouched(fn: any): void {
    this.onTouched = fn;
  }
  setDisabledState(isDisabled: boolean): void {
    isDisabled ? this.ctrl.disable({ emitEvent: false }) : this.ctrl.enable({ emitEvent: false });
  }

  // wybrano z listy
  onOptionSelected(p: ProductDTO) {
    this.lastPicked = p;
    this.ctrl.setValue(p.name); // pokaż nazwę
    // patchuj pole kodu — dynamicznie przez formę
    if (this.form && this.codeTargetName) {
      this.form.get(this.codeTargetName)?.patchValue(p.code);
    }
  }

  // onBlur — jeśli nie wybrano z listy (free text), nie dotykamy kodu
  onBlur() {
    this.onTouched();
    // opcjonalnie: gdy free-text, czyścić kod?
    // if (!this.lastPicked && this.form && this.codeTargetName) {
    //   this.form.get(this.codeTargetName)?.reset();
    // }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
