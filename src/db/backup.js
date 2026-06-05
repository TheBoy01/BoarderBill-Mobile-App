import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import * as DocumentPicker from 'expo-document-picker';
import db from './database';

export const exportBackup = async () => {
  try {
    const boardmates = db.getAllSync('SELECT * FROM boardmates');
    const electricBills = db.getAllSync('SELECT * FROM electric_bills');
    const electricEntries = db.getAllSync(
      'SELECT * FROM electric_bill_entries'
    );
    const waterBills = db.getAllSync('SELECT * FROM water_bills');
    const waterEntries = db.getAllSync('SELECT * FROM water_bill_entries');
    const rentSettings = db.getAllSync('SELECT * FROM rent_settings');
    const rentEntries = db.getAllSync('SELECT * FROM rent_bill_entries');

    const backup = {
      version: 1,
      exported_at: new Date().toISOString(),
      data: {
        boardmates,
        electricBills,
        electricEntries,
        waterBills,
        waterEntries,
        rentSettings,
        rentEntries,
      },
    };

    const date = new Date().toISOString().split('T')[0];
    const fileName = `boardmatebill_backup_${date}.json`;
    const fileUri = FileSystem.documentDirectory + fileName;

    await FileSystem.writeAsStringAsync(
      fileUri,
      JSON.stringify(backup, null, 2)
    );
    await Sharing.shareAsync(fileUri, {
      mimeType: 'application/json',
      dialogTitle: 'Save Backup File',
    });

    return { success: true, fileName };
  } catch (e) {
    console.error('Export error:', e);
    return { success: false, error: e.message };
  }
};

export const importBackup = async () => {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/json',
      copyToCacheDirectory: true,
    });

    if (result.canceled) return { success: false, canceled: true };

    const fileUri = result.assets[0].uri;
    const content = await FileSystem.readAsStringAsync(fileUri);
    const backup = JSON.parse(content);

    if (!backup.data) {
      return { success: false, error: 'Invalid backup file.' };
    }

    const {
      boardmates,
      electricBills,
      electricEntries,
      waterBills,
      waterEntries,
      rentSettings,
      rentEntries,
    } = backup.data;

    // Merge boardmates
    for (const bm of boardmates) {
      const existing = db.getFirstSync(
        'SELECT id FROM boardmates WHERE id = ?',
        [bm.id]
      );
      if (!existing) {
        db.runSync(
          'INSERT INTO boardmates (id, name, date_started, mobile, started_kwh, gender, rent_price, is_active) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
          [
            bm.id,
            bm.name,
            bm.date_started,
            bm.mobile,
            bm.started_kwh,
            bm.gender,
            bm.rent_price,
            bm.is_active,
          ]
        );
      }
    }

    // Merge electric bills
    for (const bill of electricBills) {
      const existing = db.getFirstSync(
        'SELECT id FROM electric_bills WHERE id = ?',
        [bill.id]
      );
      if (!existing) {
        db.runSync(
          'INSERT INTO electric_bills (id, month, meralco_charge, created_at) VALUES (?, ?, ?, ?)',
          [bill.id, bill.month, bill.meralco_charge, bill.created_at]
        );
      }
    }

    // Merge electric entries
    for (const entry of electricEntries) {
      const existing = db.getFirstSync(
        'SELECT id FROM electric_bill_entries WHERE id = ?',
        [entry.id]
      );
      if (!existing) {
        db.runSync(
          'INSERT INTO electric_bill_entries (id, bill_id, boardmate_id, new_kwh, total_due, is_paid) VALUES (?, ?, ?, ?, ?, ?)',
          [
            entry.id,
            entry.bill_id,
            entry.boardmate_id,
            entry.new_kwh,
            entry.total_due,
            entry.is_paid,
          ]
        );
      }
    }

    // Merge water bills
    for (const bill of waterBills) {
      const existing = db.getFirstSync(
        'SELECT id FROM water_bills WHERE id = ?',
        [bill.id]
      );
      if (!existing) {
        db.runSync(
          'INSERT INTO water_bills (id, month, total_amount, per_person, created_at) VALUES (?, ?, ?, ?, ?)',
          [
            bill.id,
            bill.month,
            bill.total_amount,
            bill.per_person,
            bill.created_at,
          ]
        );
      }
    }

    // Merge water entries
    for (const entry of waterEntries) {
      const existing = db.getFirstSync(
        'SELECT id FROM water_bill_entries WHERE id = ?',
        [entry.id]
      );
      if (!existing) {
        db.runSync(
          'INSERT INTO water_bill_entries (id, water_bill_id, boardmate_id, amount, is_paid) VALUES (?, ?, ?, ?, ?)',
          [
            entry.id,
            entry.water_bill_id,
            entry.boardmate_id,
            entry.amount,
            entry.is_paid,
          ]
        );
      }
    }

    // Merge rent settings
    for (const setting of rentSettings) {
      const existing = db.getFirstSync(
        'SELECT id FROM rent_settings WHERE id = ?',
        [setting.id]
      );
      if (!existing) {
        db.runSync(
          'INSERT INTO rent_settings (id, default_price) VALUES (?, ?)',
          [setting.id, setting.default_price]
        );
      }
    }

    // Merge rent entries
    for (const entry of rentEntries) {
      const existing = db.getFirstSync(
        'SELECT id FROM rent_bill_entries WHERE id = ?',
        [entry.id]
      );
      if (!existing) {
        db.runSync(
          'INSERT INTO rent_bill_entries (id, month, boardmate_id, amount, is_paid, created_at) VALUES (?, ?, ?, ?, ?, ?)',
          [
            entry.id,
            entry.month,
            entry.boardmate_id,
            entry.amount,
            entry.is_paid,
            entry.created_at,
          ]
        );
      }
    }

    return { success: true };
  } catch (e) {
    console.error('Import error:', e);
    return { success: false, error: e.message };
  }
};
