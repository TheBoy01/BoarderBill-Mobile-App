import db from './database';

export const createElectricBill = (month, meralco_charge) => {
  return db.runSync(
    'INSERT INTO electric_bills (month, meralco_charge) VALUES (?, ?)',
    [month, meralco_charge]
  );
};

export const addElectricEntry = (bill_id, boardmate_id, new_kwh, total_due) => {
  return db.runSync(
    'INSERT INTO electric_bill_entries (bill_id, boardmate_id, new_kwh, total_due) VALUES (?, ?, ?, ?)',
    [bill_id, boardmate_id, new_kwh, total_due]
  );
};

export const getElectricBillWithEntries = (bill_id) => {
  return db.getAllSync(
    `
    SELECT ebe.*, b.name, b.mobile, b.started_kwh
    FROM electric_bill_entries ebe
    JOIN boardmates b ON b.id = ebe.boardmate_id
    WHERE ebe.bill_id = ?
  `,
    [bill_id]
  );
};

export const getAllElectricBills = () => {
  return db.getAllSync(`
    SELECT eb.*, COUNT(ebe.id) as total_entries
    FROM electric_bills eb
    LEFT JOIN electric_bill_entries ebe ON ebe.bill_id = eb.id
    GROUP BY eb.id
    ORDER BY eb.created_at DESC
  `);
};

export const getElectricBillsByBoardmate = (boardmate_id) => {
  return db.getAllSync(
    `
    SELECT ebe.*, eb.month, eb.meralco_charge, eb.created_at
    FROM electric_bill_entries ebe
    JOIN electric_bills eb ON eb.id = ebe.bill_id
    WHERE ebe.boardmate_id = ?
    ORDER BY eb.created_at DESC
  `,
    [boardmate_id]
  );
};

export const markElectricPaid = (id) => {
  return db.runSync(
    'UPDATE electric_bill_entries SET is_paid = 1 WHERE id = ?',
    [id]
  );
};

export const getElectricBillByMonth = (month) => {
  return db.getFirstSync('SELECT * FROM electric_bills WHERE month = ?', [
    month,
  ]);
};

export const getBoardmatesWithBillForMonth = (month) => {
  return db.getAllSync(
    `
    SELECT DISTINCT ebe.boardmate_id
    FROM electric_bill_entries ebe
    JOIN electric_bills eb ON eb.id = ebe.bill_id
    WHERE eb.month = ?
  `,
    [month]
  );
};

export const markElectricEntryPaid = (id) => {
  return db.runSync(
    'UPDATE electric_bill_entries SET is_paid = 1 WHERE id = ?',
    [id]
  );
};

export const markElectricEntryUnpaid = (id) => {
  return db.runSync(
    'UPDATE electric_bill_entries SET is_paid = 0 WHERE id = ?',
    [id]
  );
};

export const updateElectricBill = (id, meralco_charge) => {
  return db.runSync(
    'UPDATE electric_bills SET meralco_charge = ? WHERE id = ?',
    [meralco_charge, id]
  );
};

export const updateElectricEntry = (id, new_kwh, total_due) => {
  return db.runSync(
    'UPDATE electric_bill_entries SET new_kwh = ?, total_due = ? WHERE id = ?',
    [new_kwh, total_due, id]
  );
};

export const deleteElectricBill = (id) => {
  db.runSync('DELETE FROM electric_bill_entries WHERE bill_id = ?', [id]);
  db.runSync('DELETE FROM electric_bills WHERE id = ?', [id]);
};

export const deleteElectricEntry = (id) => {
  return db.runSync('DELETE FROM electric_bill_entries WHERE id = ?', [id]);
};

export const getElectricEntriesByBill = (bill_id) => {
  return db.getAllSync(
    `
    SELECT ebe.*, b.name, b.mobile, b.started_kwh
    FROM electric_bill_entries ebe
    JOIN boardmates b ON b.id = ebe.boardmate_id
    WHERE ebe.bill_id = ?
  `,
    [bill_id]
  );
};
