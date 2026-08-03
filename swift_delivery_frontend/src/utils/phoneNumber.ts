export const sanitizeNigerianPhoneNumberInput = (value: string) => {
  const digits = value.replace(/\D/g, '');
  const nationalDigits = digits.startsWith('234') ? digits.slice(3) : digits;
  return nationalDigits.slice(0, 11);
};

export const isValidNigerianPhoneNumber = (value: string) =>
  /^(?:0[789]\d{9}|[789]\d{9})$/.test(value);

export const normalizeNigerianPhoneNumber = (value: string) =>
  value.startsWith('0') ? value : `0${value}`;

export const formatNigerianPhoneNumber = (value: string) => {
  const digits = value.replace(/\D/g, '');
  const nationalDigits = digits.startsWith('234')
    ? digits.slice(3)
    : digits.startsWith('0')
      ? digits.slice(1)
      : digits;

  if (nationalDigits.length !== 10) return value;

  return `+234 ${nationalDigits.slice(0, 3)} ${nationalDigits.slice(3, 6)} ${nationalDigits.slice(6)}`;
};
