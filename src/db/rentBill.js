import db from './database';

export const getRentSettings = () => {
  return db.getFirstSync('SELECT * FROM rent_settings LIMIT 1');
};

export const saveRentSettings = (default_price) => {
  const existing = getRentSettings();
  if (existing) {
    return db.runSync(
      'UPDATE rent_settings SET default_price = ? WHERE id = ?',
      [default_price, existing.id]
    );
  }
  return db.runSync('INSERT INTO rent_settings (default_price) VALUES (?)', [
    default_price,
  ]);
};

export const createRentEntry = (month, boardmate_id, amount) => {
  return db.runSync(
    'INSERT INTO rent_bill_entries (month, boardmate_id, amount) VALUES (?, ?, ?)',
    [month, boardmate_id, amount]
  );
};

export const getRentEntries = (month) => {
  return db.getAllSync(
    `
    SELECT rbe.*, b.name, b.mobile, b.rent_price
    FROM rent_bill_entries rbe
    JOIN boardmates b ON b.id = rbe.boardmate_id
    WHERE rbe.month = ?
  `,
    [month]
  );
};

export const getAllRentBills = () => {
  return db.getAllSync(`
    SELECT DISTINCT month, created_at,
    COUNT(id) as total_entries,
    SUM(amount) as total_amount
    FROM rent_bill_entries
    GROUP BY month
    ORDER BY created_at DESC
  `);
};

export const getRentBillsByBoardmate = (boardmate_id) => {
  return db.getAllSync(
    `
    SELECT * FROM rent_bill_entries
    WHERE boardmate_id = ?
    ORDER BY created_at DESC
  `,
    [boardmate_id]
  );
};

export const markRentPaid = (id) => {
  return db.runSync('UPDATE rent_bill_entries SET is_paid = 1 WHERE id = ?', [
    id,
  ]);
};

export const getRentBillByMonth = (month) => {
  return db.getFirstSync(
    'SELECT * FROM rent_bill_entries WHERE month = ? LIMIT 1',
    [month]
  );
};

export const markRentEntryPaid = (id) => {
  return db.runSync('UPDATE rent_bill_entries SET is_paid = 1 WHERE id = ?', [
    id,
  ]);
};

export const markRentEntryUnpaid = (id) => {
  return db.runSync('UPDATE rent_bill_entries SET is_paid = 0 WHERE id = ?', [
    id,
  ]);
};

export const getRentEntriesWithBoardmates = (month) => {
  return db.getAllSync(
    `
    SELECT rbe.*, b.name, b.mobile
    FROM rent_bill_entries rbe
    JOIN boardmates b ON b.id = rbe.boardmate_id
    WHERE rbe.month = ?
  `,
    [month]
  );
};

export const getAllRentMonths = () => {
  return db.getAllSync(`
    SELECT DISTINCT month FROM rent_bill_entries ORDER BY created_at DESC
  `);
};

export const updateRentEntry = (id, amount) => {
  return db.runSync('UPDATE rent_bill_entries SET amount = ? WHERE id = ?', [
    amount,
    id,
  ]);
};

export const deleteRentBill = (month) => {
  return db.runSync('DELETE FROM rent_bill_entries WHERE month = ?', [month]);
};

export const deleteRentEntry = (id) => {
  return db.runSync('DELETE FROM rent_bill_entries WHERE id = ?', [id]);
};
