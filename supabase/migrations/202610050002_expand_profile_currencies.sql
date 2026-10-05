begin;

alter table public.profiles drop constraint profiles_currency_check;
alter table public.profiles add constraint profiles_currency_check
  check (currency in (
    'USD', 'EUR', 'GBP', 'CNY', 'JPY', 'CAD', 'AUD', 'NZD', 'CHF',
    'SGD', 'HKD', 'TWD', 'KRW', 'INR', 'PHP', 'IDR', 'MYR', 'THB', 'VND',
    'PKR', 'BDT', 'LKR', 'SEK', 'NOK', 'DKK', 'PLN', 'CZK', 'HUF', 'RON',
    'TRY', 'BRL', 'MXN', 'ZAR', 'AED', 'SAR', 'QAR', 'KWD', 'BHD', 'ILS',
    'EGP', 'NGN', 'KES'
  ));

commit;
