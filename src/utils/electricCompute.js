export const computeElectricBill = (newKwh, ratePerKwh) => {
  return parseFloat(newKwh) * parseFloat(ratePerKwh);
};
