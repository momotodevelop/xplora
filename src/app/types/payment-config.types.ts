import { Timestamp } from 'firebase/firestore';

export interface PaymentConfig {
  speiPaymentTimeMinutes: number;
  updatedAt?: Date | Timestamp;
}

export const DEFAULT_PAYMENT_CONFIG: PaymentConfig = {
  speiPaymentTimeMinutes: 10
};

export interface SpeiAccount {
  id: string;
  label: string;
  bank: string;
  holder: string;
  account: string;
  minAmount: number;
  maxAmount?: number | null;
  active: boolean;
  createdAt?: Date | Timestamp;
  updatedAt?: Date | Timestamp;
}

export interface PaymentOfficeType {
  id: string;
  name: string;
  icon: string;
  createdAt?: Date | Timestamp;
  updatedAt?: Date | Timestamp;
}

export type PaymentStepElementType = 'text' | 'image' | 'barcode' | 'qr' | 'link';

export interface PaymentStepElementBase {
  type: PaymentStepElementType;
}

export interface PaymentStepText extends PaymentStepElementBase {
  type: 'text';
  text: string;
}

export interface PaymentStepImage extends PaymentStepElementBase {
  type: 'image';
  src: string;
  alt?: string;
  caption?: string;
}

export interface PaymentStepBarcode extends PaymentStepElementBase {
  type: 'barcode';
  value?: string;
  label?: string;
  useOfficeAccount?: boolean;
}

export interface PaymentStepQr extends PaymentStepElementBase {
  type: 'qr';
  value?: string;
  label?: string;
  useOfficeAccount?: boolean;
}

export interface PaymentStepLink extends PaymentStepElementBase {
  type: 'link';
  label: string;
  url: string;
  style?: 'button' | 'link';
}

export type PaymentStepElement =
  | PaymentStepText
  | PaymentStepImage
  | PaymentStepBarcode
  | PaymentStepQr
  | PaymentStepLink;

export interface PaymentOfficeStep {
  title?: string;
  elements: PaymentStepElement[];
}

export interface PaymentOffice {
  id: string;
  name: string;
  typeId: string;
  minAmount: number;
  maxAmount?: number | null;
  maxPerOperation: number;
  fee: number;
  delayHours: number;
  account?: string;
  referenceLabel?: string;
  img?: string;
  steps: PaymentOfficeStep[];
  active: boolean;
  createdAt?: Date | Timestamp;
  updatedAt?: Date | Timestamp;
}
