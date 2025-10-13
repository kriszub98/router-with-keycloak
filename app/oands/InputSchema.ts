// types.ts
export interface FieldConfig {
  type: 'text' | 'date' | 'inputWithList' | string;
  label: string;
  formControlName: string;
  // miejsce na metadane specyficzne dla pola
  meta?: Record<string, any>;
  validators?: any[];
}

// krok 1
const step1: { sectionName: 'ProductStep'; formControl: FieldConfig[] } = {
  sectionName: 'ProductStep',
  formControl: [
    {
      type: 'inputWithList',
      label: 'Nazwa produktu',
      formControlName: 'productName',
      meta: {
        codeTargetName: 'productCode', // <- KOGO PATCHOWAĆ
        minChars: 3,
      },
    },
    { type: 'text', label: 'Kod produktu', formControlName: 'productCode' },
  ],
};
