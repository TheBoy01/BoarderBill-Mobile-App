import db from './database';

export const getAllBoardmates = () => {
  return db.getAllSync(
    'SELECT * FROM boardmates WHERE is_active = 1 ORDER BY name ASC'
  );
};

export const getAllBoardmatesIncludingInactive = () => {
  return db.getAllSync(
    'SELECT * FROM boardmates ORDER BY is_active DESC, name ASC'
  );
};

export const addBoardmate = (
  name,
  date_started,
  mobile,
  started_kwh,
  gender,
  rent_price
) => {
  return db.runSync(
    'INSERT INTO boardmates (name, date_started, mobile, started_kwh, gender, rent_price) VALUES (?, ?, ?, ?, ?, ?)',
    [name, date_started, mobile, started_kwh, gender, rent_price]
  );
};

export const updateBoardmate = (
  id,
  name,
  date_started,
  mobile,
  started_kwh,
  gender,
  rent_price
) => {
  return db.runSync(
    'UPDATE boardmates SET name=?, date_started=?, mobile=?, started_kwh=?, gender=?, rent_price=? WHERE id=?',
    [name, date_started, mobile, started_kwh, gender, rent_price, id]
  );
};

export const deleteBoardmate = (id) => {
  return db.runSync('UPDATE boardmates SET is_active = 0 WHERE id = ?', [id]);
};

export const restoreBoardmate = (id) => {
  return db.runSync('UPDATE boardmates SET is_active = 1 WHERE id = ?', [id]);
};

export const updateStartedKwh = (id, new_kwh) => {
  return db.runSync('UPDATE boardmates SET started_kwh = ? WHERE id = ?', [
    new_kwh,
    id,
  ]);
};
