-- Allow split_qr as a payment method (optional; app may use method 'qr' + details.split_portion instead)
ALTER TABLE payments DROP CONSTRAINT IF EXISTS payments_method_check;
ALTER TABLE payments ADD CONSTRAINT payments_method_check CHECK (
  method IN ('cash', 'card', 'split_cash', 'split_card', 'split_qr', 'qr', 'voucher', 'refund')
);
