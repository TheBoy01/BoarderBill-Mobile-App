import db from './database';

export const saveWaterBill = (month, total_amount, per_person) => {
  return db.runSync(
    'INSERT INTO water_bills (month, total_amount, per_person) VALUES (?, ?, ?)',
    [month, total_amount, per_person]
  );
};

export const addWaterEntry = (water_bill_id, boardmate_id, amount) => {
  return db.runSync(
    'INSERT INTO water_bill_entries (water_bill_id, boardmate_id, amount) VALUES (?, ?, ?)',
    [water_bill_id, boardmate_id, amount]
  );
};

export const getAllWaterBills = () => {
  return db.getAllSync(`
    SELECT * FROM water_bills ORDER BY created_at DESC
  `);
};

export const getWaterBillsByBoardmate = (boardmate_id) => {
  return db.getAllSync(
    `
    SELECT wbe.*, wb.month, wb.total_amount, wb.per_person, wb.created_at, wb.id as water_bill_id
    FROM water_bill_entries wbe
    JOIN water_bills wb ON wb.id = wbe.water_bill_id
    WHERE wbe.boardmate_id = ?
    ORDER BY wb.created_at DESC
  `,
    [boardmate_id]
  );
};

export const getWaterEntriesByBill = (water_bill_id) => {
  return db.getAllSync(
    `
    SELECT wbe.*, b.name, b.mobile
    FROM water_bill_entries wbe
    JOIN boardmates b ON b.id = wbe.boardmate_id
    WHERE wbe.water_bill_id = ?
  `,
    [water_bill_id]
  );
};

export const markWaterPaid = (id) => {
  return db.runSync('UPDATE water_bill_entries SET is_paid = 1 WHERE id = ?', [
    id,
  ]);
};

export const getWaterBillByMonth = (month) => {
  return db.getFirstSync('SELECT * FROM water_bills WHERE month = ?', [month]);
};

export const markWaterEntryPaid = (id) => {
  return db.runSync('UPDATE water_bill_entries SET is_paid = 1 WHERE id = ?', [
    id,
  ]);
};

export const markWaterEntryUnpaid = (id) => {
  return db.runSync('UPDATE water_bill_entries SET is_paid = 0 WHERE id = ?', [
    id,
  ]);
};

export const getWaterEntriesWithBoardmates = (water_bill_id) => {
  return db.getAllSync(
    `
    SELECT wbe.*, b.name, b.mobile
    FROM water_bill_entries wbe
    JOIN boardmates b ON b.id = wbe.boardmate_id
    WHERE wbe.water_bill_id = ?
  `,
    [water_bill_id]
  );
};

export const updateWaterBill = (id, total_amount) => {
  const entries = db.getAllSync(
    'SELECT * FROM water_bill_entries WHERE water_bill_id = ?',
    [id]
  );
  const per_person = total_amount / entries.length;
  db.runSync(
    'UPDATE water_bills SET total_amount = ?, per_person = ? WHERE id = ?',
    [total_amount, per_person, id]
  );
  for (const entry of entries) {
    db.runSync('UPDATE water_bill_entries SET amount = ? WHERE id = ?', [
      per_person,
      entry.id,
    ]);
  }
  return per_person;
};

export const deleteWaterBill = (id) => {
  db.runSync('DELETE FROM water_bill_entries WHERE water_bill_id = ?', [id]);
  db.runSync('DELETE FROM water_bills WHERE id = ?', [id]);
};
