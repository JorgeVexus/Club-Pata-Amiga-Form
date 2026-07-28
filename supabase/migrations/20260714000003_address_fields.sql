-- Structured address (CFDI needs granular fields; street_address stays for display)
alter table profiles
  add column street text,
  add column number_ext text,
  add column number_int text;
