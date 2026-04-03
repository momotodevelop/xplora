import { FormArray, FormBuilder, FormGroup, Validators } from '@angular/forms';
import {
  PaymentOffice,
  PaymentOfficeStep,
  PaymentOfficeType,
  PaymentStepElement,
  PaymentStepElementType,
  SpeiAccount
} from '../../../../types/payment-config.types';

export const PAYMENT_STEP_ELEMENT_TYPES: PaymentStepElementType[] = ['text', 'image', 'barcode', 'qr', 'link'];
export const PAYMENT_LINK_STYLE_OPTIONS: Array<'button' | 'link'> = ['button', 'link'];

export function createEmptySpeiAccount(): SpeiAccount {
  return {
    id: '',
    label: '',
    bank: '',
    holder: '',
    account: '',
    minAmount: 0,
    maxAmount: null,
    active: true
  };
}

export function createEmptyPaymentOfficeType(): PaymentOfficeType {
  return {
    id: '',
    name: '',
    icon: ''
  };
}

export function createEmptyPaymentOffice(): PaymentOffice {
  return {
    id: '',
    name: '',
    typeId: '',
    minAmount: 0,
    maxAmount: null,
    maxPerOperation: 0,
    fee: 0,
    delayHours: 0,
    account: '',
    referenceLabel: '',
    img: '',
    steps: [],
    active: true
  };
}

export function buildSpeiAccountForm(fb: FormBuilder, account: Partial<SpeiAccount> = {}): FormGroup {
  const base = { ...createEmptySpeiAccount(), ...account };
  return fb.group({
    id: [base.id ?? ''],
    label: [base.label ?? '', [Validators.required]],
    bank: [base.bank ?? '', [Validators.required]],
    holder: [base.holder ?? '', [Validators.required]],
    account: [base.account ?? '', [Validators.required]],
    minAmount: [base.minAmount ?? 0, [Validators.required, Validators.min(0)]],
    maxAmount: [base.maxAmount ?? null, [Validators.min(0)]],
    active: [base.active ?? true]
  });
}

export function buildPaymentOfficeTypeForm(fb: FormBuilder, type: Partial<PaymentOfficeType> = {}): FormGroup {
  const base = { ...createEmptyPaymentOfficeType(), ...type };
  return fb.group({
    id: [base.id ?? ''],
    name: [base.name ?? '', [Validators.required]],
    icon: [base.icon ?? '', [Validators.required]]
  });
}

export function buildPaymentOfficeForm(fb: FormBuilder, office: Partial<PaymentOffice> = {}): FormGroup {
  const base = { ...createEmptyPaymentOffice(), ...office };
  return fb.group({
    id: [base.id ?? ''],
    name: [base.name ?? '', [Validators.required]],
    typeId: [base.typeId ?? '', [Validators.required]],
    minAmount: [base.minAmount ?? 0, [Validators.required, Validators.min(0)]],
    maxAmount: [base.maxAmount ?? null, [Validators.min(0)]],
    maxPerOperation: [base.maxPerOperation ?? 0, [Validators.min(0)]],
    fee: [base.fee ?? 0, [Validators.min(0)]],
    delayHours: [base.delayHours ?? 0, [Validators.min(0)]],
    account: [base.account ?? ''],
    referenceLabel: [base.referenceLabel ?? ''],
    img: [base.img ?? ''],
    active: [base.active ?? true],
    steps: fb.array((base.steps ?? []).map(step => buildPaymentOfficeStepForm(fb, step)))
  });
}

export function buildPaymentOfficeStepForm(fb: FormBuilder, step: Partial<PaymentOfficeStep> = {}): FormGroup {
  return fb.group({
    title: [step?.title ?? ''],
    elements: fb.array((step?.elements ?? []).map(element => buildPaymentStepElementForm(fb, element)))
  });
}

export function buildPaymentStepElementForm(fb: FormBuilder, element: Partial<PaymentStepElement> = {}): FormGroup {
  const type = element?.type ?? 'text';
  return fb.group({
    type: [type, [Validators.required]],
    text: [(element as any)?.text ?? '', type === 'text' ? [Validators.required] : []],
    src: [(element as any)?.src ?? '', type === 'image' ? [Validators.required] : []],
    alt: [(element as any)?.alt ?? ''],
    caption: [(element as any)?.caption ?? ''],
    value: [(element as any)?.value ?? ''],
    label: [(element as any)?.label ?? '', type === 'link' ? [Validators.required] : []],
    useOfficeAccount: [(element as any)?.useOfficeAccount ?? true],
    url: [(element as any)?.url ?? '', type === 'link' ? [Validators.required] : []],
    style: [(element as any)?.style ?? 'button']
  });
}

export function getPaymentOfficeStepsArray(form: FormGroup): FormArray {
  return form.get('steps') as FormArray;
}

export function getPaymentOfficeStepElementsArray(stepForm: FormGroup): FormArray {
  return stepForm.get('elements') as FormArray;
}

export function normalizeSpeiAccount(account: Partial<SpeiAccount>): SpeiAccount {
  const maxValue = normalizeMaxAmount((account as any).maxAmount);
  return {
    id: cleanString(account.id ?? ''),
    label: cleanString(account.label ?? ''),
    bank: cleanString(account.bank ?? ''),
    holder: cleanString(account.holder ?? ''),
    account: cleanString(account.account ?? ''),
    minAmount: toNumber(account.minAmount ?? 0),
    maxAmount: maxValue,
    active: Boolean(account.active ?? true)
  };
}

export function normalizePaymentOfficeType(type: Partial<PaymentOfficeType>): PaymentOfficeType {
  return {
    id: cleanString(type.id ?? ''),
    name: cleanString(type.name ?? ''),
    icon: cleanString(type.icon ?? '')
  };
}

export function normalizePaymentOffice(office: Partial<PaymentOffice>): PaymentOffice {
  return {
    id: cleanString(office.id ?? ''),
    name: cleanString(office.name ?? ''),
    typeId: cleanString(office.typeId ?? ''),
    minAmount: toNumber(office.minAmount ?? 0),
    maxAmount: normalizeMaxAmount((office as any).maxAmount),
    maxPerOperation: toNumber((office as any).maxPerOperation ?? 0),
    fee: toNumber(office.fee ?? 0),
    delayHours: toNumber(office.delayHours ?? 0),
    account: cleanString(office.account ?? ''),
    referenceLabel: cleanString(office.referenceLabel ?? ''),
    img: cleanString(office.img ?? ''),
    steps: normalizePaymentOfficeSteps((office as any).steps ?? []),
    active: Boolean(office.active ?? true)
  };
}

export function normalizePaymentOfficeSteps(steps: any[]): PaymentOfficeStep[] {
  if (!Array.isArray(steps)) return [];
  return steps
    .map(step => {
      const title = cleanString(step?.title ?? '');
      const elements = normalizePaymentStepElements(step?.elements ?? []);
      if (!title && elements.length === 0) {
        return null;
      }
      return {
        title: title || undefined,
        elements
      } as PaymentOfficeStep;
    })
    .filter(Boolean) as PaymentOfficeStep[];
}

export function normalizePaymentStepElements(elements: any[]): PaymentStepElement[] {
  if (!Array.isArray(elements)) return [];
  return elements
    .map(element => {
      if (!element) return null;
      const type = String(element.type ?? '').trim() as PaymentStepElementType;
      switch (type) {
        case 'text': {
          const text = cleanString(element.text ?? element.label ?? '');
          if (!text) return null;
          return { type: 'text', text } as PaymentStepElement;
        }
        case 'image': {
          const src = cleanString(element.src ?? '');
          if (!src) return null;
          const alt = cleanString(element.alt ?? '');
          const caption = cleanString(element.caption ?? '');
          return {
            type: 'image',
            src,
            alt: alt || undefined,
            caption: caption || undefined
          } as PaymentStepElement;
        }
        case 'barcode': {
          const value = cleanString(element.value ?? '');
          const useOfficeAccount = element.useOfficeAccount !== false;
          if (!useOfficeAccount && !value) return null;
          const label = cleanString(element.label ?? '');
          return {
            type: 'barcode',
            value: value || undefined,
            useOfficeAccount,
            label: label || undefined
          } as PaymentStepElement;
        }
        case 'qr': {
          const value = cleanString(element.value ?? '');
          const useOfficeAccount = element.useOfficeAccount !== false;
          if (!useOfficeAccount && !value) return null;
          const label = cleanString(element.label ?? '');
          return {
            type: 'qr',
            value: value || undefined,
            useOfficeAccount,
            label: label || undefined
          } as PaymentStepElement;
        }
        case 'link': {
          const label = cleanString(element.label ?? '');
          const url = cleanString(element.url ?? '');
          if (!label || !url) return null;
          const style = element.style === 'link' ? 'link' : 'button';
          return {
            type: 'link',
            label,
            url,
            style
          } as PaymentStepElement;
        }
        default:
          return null;
      }
    })
    .filter(Boolean) as PaymentStepElement[];
}

export function computeSpeiCoverageWarnings(accounts: SpeiAccount[]): string[] {
  const active = (accounts ?? []).filter(account => account.active);
  if (active.length === 0) {
    return ['No hay cuentas SPEI activas.'];
  }

  const normalized = active
    .map(account => ({
      label: cleanString(account.label || account.id || 'Cuenta'),
      min: toNumber(account.minAmount),
      max: normalizeMaxAmount((account as any).maxAmount)
    }))
    .sort((a, b) => a.min - b.min);

  const warnings: string[] = [];
  let coverageEnd = 0;
  let hasOpenEnd = false;

  normalized.forEach(account => {
    if (account.max !== null && account.max < account.min) {
      warnings.push(`La cuenta "${account.label}" tiene un maximo menor al minimo.`);
      return;
    }
    if (account.min > coverageEnd) {
      warnings.push(`Falta cobertura SPEI entre ${coverageEnd} y ${account.min}.`);
    }
    const maxValue = account.max ?? Infinity;
    if (account.max === null) {
      hasOpenEnd = true;
    }
    coverageEnd = Math.max(coverageEnd, maxValue);
  });

  if (!hasOpenEnd) {
    warnings.push(`No hay una cuenta que cubra montos mayores a ${coverageEnd}.`);
  }

  return warnings;
}

export function cleanString(value: string): string {
  return String(value ?? '').trim();
}

export function toNumber(value: any): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function normalizeMaxAmount(value: any): number | null {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}
