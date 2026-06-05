import { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { exportBackup, importBackup } from '../db/backup';

export default function BackupScreen() {
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);

  const handleExport = async () => {
    Alert.alert(
      'Export Backup',
      'This will export all your data to a JSON file. You can save it to Google Drive, email it to yourself, or keep it in your phone storage.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Export',
          onPress: async () => {
            setExporting(true);
            const result = await exportBackup();
            setExporting(false);
            if (result.success) {
              Alert.alert(
                'Success',
                `Backup exported successfully!\n\nFile: ${result.fileName}`
              );
            } else {
              Alert.alert(
                'Error',
                `Failed to export backup.\n\n${result.error}`
              );
            }
          },
        },
      ]
    );
  };

  const handleImport = async () => {
    Alert.alert(
      'Restore Backup',
      'This will merge the backup data with your existing data. Existing records will not be deleted or overwritten.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Choose File',
          onPress: async () => {
            setImporting(true);
            const result = await importBackup();
            setImporting(false);
            if (result.canceled) return;
            if (result.success) {
              Alert.alert(
                'Success',
                'Backup restored successfully! All data has been merged.'
              );
            } else {
              Alert.alert(
                'Error',
                `Failed to restore backup.\n\n${result.error}`
              );
            }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Backup & Restore</Text>
        <Text style={styles.subtitle}>
          Keep your data safe by exporting a backup regularly.
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardIcon}>📤</Text>
        <Text style={styles.cardTitle}>Export Backup</Text>
        <Text style={styles.cardDesc}>
          Export all your boardmates, bills and records to a JSON file. Save it
          to Google Drive or email it to yourself for safekeeping.
        </Text>
        <TouchableOpacity
          style={styles.btnExport}
          onPress={handleExport}
          disabled={exporting}
        >
          {exporting ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.btnText}>📤 Export Backup</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardIcon}>📥</Text>
        <Text style={styles.cardTitle}>Restore Backup</Text>
        <Text style={styles.cardDesc}>
          Pick a previously exported JSON backup file. Your existing data will
          be kept and missing records will be restored.
        </Text>
        <TouchableOpacity
          style={styles.btnImport}
          onPress={handleImport}
          disabled={importing}
        >
          {importing ? (
            <ActivityIndicator color="white" />
          ) : (
            <Text style={styles.btnText}>📥 Restore Backup</Text>
          )}
        </TouchableOpacity>
      </View>

      <View style={styles.tipCard}>
        <Text style={styles.tipTitle}>💡 Tips</Text>
        <Text style={styles.tipText}>
          • Export backup every month after generating bills.
        </Text>
        <Text style={styles.tipText}>
          • Save the backup file to Google Drive for cloud storage.
        </Text>
        <Text style={styles.tipText}>
          • Backup file name includes the date for easy tracking.
        </Text>
        <Text style={styles.tipText}>
          • Restoring is safe — it only adds missing data.
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB', padding: 16, gap: 16 },
  header: { gap: 4 },
  title: { fontSize: 20, fontWeight: '700', color: '#111827' },
  subtitle: { fontSize: 13, color: '#6B7280' },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    gap: 10,
    elevation: 2,
  },
  cardIcon: { fontSize: 28 },
  cardTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  cardDesc: { fontSize: 13, color: '#6B7280', lineHeight: 20 },
  btnExport: {
    backgroundColor: '#2563EB',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  btnImport: {
    backgroundColor: '#7C3AED',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  btnText: { color: 'white', fontWeight: '600' },
  tipCard: {
    backgroundColor: '#FFFBEB',
    borderRadius: 12,
    padding: 16,
    gap: 6,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  tipTitle: { fontSize: 14, fontWeight: '700', color: '#92400E' },
  tipText: { fontSize: 12, color: '#78350F', lineHeight: 18 },
});
