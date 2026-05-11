import mongoose, { Schema, Model } from "mongoose";

export type DepositProviderId =
  | "korapay"
  | "paystack"
  | "mtn_momo"
  | "telecel_cash"
  | "btc"
  | "usdt_trc20"
  | "eth"
  | "bank_transfer";

export interface IDepositProvider {
  id: DepositProviderId;
  label: string;
  enabled: boolean;
  walletAddress?: string;
  walletNetwork?: string;
  bankName?: string;
  accountName?: string;
  accountNumber?: string;
  swiftCode?: string;
  routingNumber?: string;
  momoNumber?: string;
  momoName?: string;
  instructions?: string;
  minAmount?: number;
  maxAmount?: number;
  feePercent?: number;
}

export interface IPaymentConfig {
  key: string;
  activeProvider: DepositProviderId;
  providers: IDepositProvider[];
  updatedBy?: mongoose.Types.ObjectId;
  updatedAt: Date;
  createdAt: Date;
}

const ProviderSchema = new Schema<IDepositProvider>(
  {
    id: {
      type: String,
      required: true,
      enum: [
        "korapay",
        "paystack",
        "mtn_momo",
        "telecel_cash",
        "btc",
        "usdt_trc20",
        "eth",
        "bank_transfer",
      ],
    },
    label: { type: String, required: true },
    enabled: { type: Boolean, default: false },
    walletAddress: { type: String },
    walletNetwork: { type: String },
    bankName: { type: String },
    accountName: { type: String },
    accountNumber: { type: String },
    swiftCode: { type: String },
    routingNumber: { type: String },
    momoNumber: { type: String },
    momoName: { type: String },
    instructions: { type: String },
    minAmount: { type: Number, default: 1 },
    maxAmount: { type: Number, default: 50000 },
    feePercent: { type: Number, default: 0 },
  },
  { _id: false }
);

const PaymentConfigSchema = new Schema<IPaymentConfig>(
  {
    key: { type: String, default: "payment", unique: true },
    activeProvider: {
      type: String,
      enum: [
        "korapay",
        "paystack",
        "mtn_momo",
        "telecel_cash",
        "btc",
        "usdt_trc20",
        "eth",
        "bank_transfer",
      ],
      default: "paystack",
    },
    providers: { type: [ProviderSchema], default: [] },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export const PaymentConfig: Model<IPaymentConfig> =
  (mongoose.models.PaymentConfig as Model<IPaymentConfig>) ||
  mongoose.model<IPaymentConfig>("PaymentConfig", PaymentConfigSchema);

export const DEFAULT_PROVIDERS: IDepositProvider[] = [
  {
    id: "korapay",
    label: "Korapay",
    enabled: false,
    instructions: "Card / bank / wallet via Korapay checkout.",
    minAmount: 1,
    maxAmount: 100000,
    feePercent: 0,
  },
  {
    id: "paystack",
    label: "Paystack",
    enabled: true,
    instructions: "Card or bank transfer via Paystack checkout.",
    minAmount: 1,
    maxAmount: 50000,
    feePercent: 0,
  },
  {
    id: "mtn_momo",
    label: "MTN Mobile Money",
    enabled: true,
    momoName: "BetNexus",
    momoNumber: "",
    instructions: "Send to the MTN MoMo number, then submit the reference.",
    minAmount: 1,
    maxAmount: 50000,
  },
  {
    id: "telecel_cash",
    label: "Telecel Cash",
    enabled: true,
    momoName: "BetNexus",
    momoNumber: "",
    instructions: "Send to the Telecel Cash number, then submit the reference.",
    minAmount: 1,
    maxAmount: 50000,
  },
  {
    id: "btc",
    label: "Bitcoin (BTC)",
    enabled: true,
    walletAddress: "bc1q6xg84ehyk3sk65vt6sr8fxxtahsp8fa43uay3a",
    walletNetwork: "BTC",
    instructions: "Send BTC to this address. Funds credit after 1 confirmation.",
    minAmount: 0.0001,
    maxAmount: 10,
  },
  {
    id: "usdt_trc20",
    label: "USDT (TRC-20)",
    enabled: true,
    walletAddress: "",
    walletNetwork: "TRC-20",
    instructions: "Send USDT on TRON (TRC-20). Wrong network = lost funds.",
    minAmount: 5,
    maxAmount: 100000,
  },
  {
    id: "eth",
    label: "Ethereum (ETH)",
    enabled: false,
    walletAddress: "",
    walletNetwork: "ERC-20",
    instructions: "Send ETH on the Ethereum mainnet.",
    minAmount: 0.005,
    maxAmount: 100,
  },
  {
    id: "bank_transfer",
    label: "Bank Transfer",
    enabled: false,
    bankName: "",
    accountName: "BetNexus",
    accountNumber: "",
    instructions: "Direct bank transfer. Allow 1 business day for credit.",
    minAmount: 10,
    maxAmount: 1000000,
  },
];
