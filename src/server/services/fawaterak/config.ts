export const fawaterakConfig = {
  get apiKey() {
    const key = process.env.FAWATERAK_API_KEY;
    if (!key) throw new Error('FAWATERAK_API_KEY is not configured');
    return key;
  },

  get vendorKey() {
    const key = process.env.FAWATERAK_VENDOR_KEY;
    if (!key) throw new Error('FAWATERAK_VENDOR_KEY is not configured');
    return key;
  },

  get baseUrl() {
    const url = process.env.FAWATERAK_BASE_URL;
    if (!url) throw new Error('FAWATERAK_BASE_URL is not configured');
    return url;
  },

  get isProduction() {
    return this.baseUrl.includes('app.fawaterk.com');
  },

  get tokenizationCurrency() {
    return process.env.FAWATERAK_TOKENIZATION_CURRENCY ?? 'EGP';
  },

  get savedCardChargeCurrency() {
    return (
      process.env.FAWATERAK_SAVED_CARD_CURRENCY ??
      this.tokenizationCurrency
    );
  },

  get fallbackCustomerPhone() {
    return process.env.FAWATERAK_FALLBACK_PHONE ?? '01234567891';
  },
} as const;
