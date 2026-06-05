import db from './database';

export const getSummaryByMonth = (month) => {
  const electric = db.getFirstSync(
    `
    SELECT 
      COALESCE(SUM(ebe.total_due), 0) as total_billed,
      COALESCE(SUM(CASE WHEN ebe.is_paid = 1 THEN ebe.total_due ELSE 0 END), 0) as total_collected,
      COALESCE(SUM(CASE WHEN ebe.is_paid = 0 THEN ebe.total_due ELSE 0 END), 0) as total_unpaid
    FROM electric_bill_entries ebe
    JOIN electric_bills eb ON eb.id = ebe.bill_id
    WHERE eb.month = ?
  `,
    [month]
  );

  const water = db.getFirstSync(
    `
    SELECT 
      COALESCE(SUM(wbe.amount), 0) as total_billed,
      COALESCE(SUM(CASE WHEN wbe.is_paid = 1 THEN wbe.amount ELSE 0 END), 0) as total_collected,
      COALESCE(SUM(CASE WHEN wbe.is_paid = 0 THEN wbe.amount ELSE 0 END), 0) as total_unpaid
    FROM water_bill_entries wbe
    JOIN water_bills wb ON wb.id = wbe.water_bill_id
    WHERE wb.month = ?
  `,
    [month]
  );

  const rent = db.getFirstSync(
    `
    SELECT 
      COALESCE(SUM(amount), 0) as total_billed,
      COALESCE(SUM(CASE WHEN is_paid = 1 THEN amount ELSE 0 END), 0) as total_collected,
      COALESCE(SUM(CASE WHEN is_paid = 0 THEN amount ELSE 0 END), 0) as total_unpaid
    FROM rent_bill_entries
    WHERE month = ?
  `,
    [month]
  );

  return { electric, water, rent };
};

export const getSummaryByYear = (year) => {
  const electric = db.getFirstSync(
    `
    SELECT 
      COALESCE(SUM(ebe.total_due), 0) as total_billed,
      COALESCE(SUM(CASE WHEN ebe.is_paid = 1 THEN ebe.total_due ELSE 0 END), 0) as total_collected,
      COALESCE(SUM(CASE WHEN ebe.is_paid = 0 THEN ebe.total_due ELSE 0 END), 0) as total_unpaid
    FROM electric_bill_entries ebe
    JOIN electric_bills eb ON eb.id = ebe.bill_id
    WHERE eb.month LIKE ?
  `,
    [`%${year}`]
  );

  const water = db.getFirstSync(
    `
    SELECT 
      COALESCE(SUM(wbe.amount), 0) as total_billed,
      COALESCE(SUM(CASE WHEN wbe.is_paid = 1 THEN wbe.amount ELSE 0 END), 0) as total_collected,
      COALESCE(SUM(CASE WHEN wbe.is_paid = 0 THEN wbe.amount ELSE 0 END), 0) as total_unpaid
    FROM water_bill_entries wbe
    JOIN water_bills wb ON wb.id = wbe.water_bill_id
    WHERE wb.month LIKE ?
  `,
    [`%${year}`]
  );

  const rent = db.getFirstSync(
    `
    SELECT 
      COALESCE(SUM(amount), 0) as total_billed,
      COALESCE(SUM(CASE WHEN is_paid = 1 THEN amount ELSE 0 END), 0) as total_collected,
      COALESCE(SUM(CASE WHEN is_paid = 0 THEN amount ELSE 0 END), 0) as total_unpaid
    FROM rent_bill_entries
    WHERE month LIKE ?
  `,
    [`%${year}`]
  );

  return { electric, water, rent };
};

export const getSummaryAllTime = () => {
  const electric = db.getFirstSync(`
    SELECT 
      COALESCE(SUM(total_due), 0) as total_billed,
      COALESCE(SUM(CASE WHEN is_paid = 1 THEN total_due ELSE 0 END), 0) as total_collected,
      COALESCE(SUM(CASE WHEN is_paid = 0 THEN total_due ELSE 0 END), 0) as total_unpaid
    FROM electric_bill_entries
  `);

  const water = db.getFirstSync(`
    SELECT 
      COALESCE(SUM(amount), 0) as total_billed,
      COALESCE(SUM(CASE WHEN is_paid = 1 THEN amount ELSE 0 END), 0) as total_collected,
      COALESCE(SUM(CASE WHEN is_paid = 0 THEN amount ELSE 0 END), 0) as total_unpaid
    FROM water_bill_entries
  `);

  const rent = db.getFirstSync(`
    SELECT 
      COALESCE(SUM(amount), 0) as total_billed,
      COALESCE(SUM(CASE WHEN is_paid = 1 THEN amount ELSE 0 END), 0) as total_collected,
      COALESCE(SUM(CASE WHEN is_paid = 0 THEN amount ELSE 0 END), 0) as total_unpaid
    FROM rent_bill_entries
  `);

  return { electric, water, rent };
};

export const getAvailableMonths = () => {
  const electric = db.getAllSync('SELECT DISTINCT month FROM electric_bills');
  const water = db.getAllSync('SELECT DISTINCT month FROM water_bills');
  const rent = db.getAllSync('SELECT DISTINCT month FROM rent_bill_entries');
  const months = new Set();
  electric.forEach((r) => months.add(r.month));
  water.forEach((r) => months.add(r.month));
  rent.forEach((r) => months.add(r.month));
  return Array.from(months).sort();
};

export const getAvailableYears = () => {
  const months = getAvailableMonths();
  const years = new Set();
  months.forEach((m) => {
    const parts = m.split(' ');
    if (parts.length === 2) years.add(parts[1]);
  });
  return Array.from(years).sort().reverse();
};

export const getBoardmateSummary = () => {
  const electric = db.getAllSync(`
    SELECT b.name, 
      COALESCE(SUM(ebe.total_due), 0) as total_billed,
      COALESCE(SUM(CASE WHEN ebe.is_paid = 1 THEN ebe.total_due ELSE 0 END), 0) as total_collected
    FROM boardmates b
    LEFT JOIN electric_bill_entries ebe ON ebe.boardmate_id = b.id
    GROUP BY b.id
  `);

  const water = db.getAllSync(`
    SELECT b.name,
      COALESCE(SUM(wbe.amount), 0) as total_billed,
      COALESCE(SUM(CASE WHEN wbe.is_paid = 1 THEN wbe.amount ELSE 0 END), 0) as total_collected
    FROM boardmates b
    LEFT JOIN water_bill_entries wbe ON wbe.boardmate_id = b.id
    GROUP BY b.id
  `);

  const rent = db.getAllSync(`
    SELECT b.name,
      COALESCE(SUM(rbe.amount), 0) as total_billed,
      COALESCE(SUM(CASE WHEN rbe.is_paid = 1 THEN rbe.amount ELSE 0 END), 0) as total_collected
    FROM boardmates b
    LEFT JOIN rent_bill_entries rbe ON rbe.boardmate_id = b.id
    GROUP BY b.id
  `);

  return { electric, water, rent };
};
