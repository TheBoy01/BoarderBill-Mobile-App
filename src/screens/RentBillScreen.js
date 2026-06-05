import { useState, useCallback } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ScrollView,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as SMS from 'expo-sms';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { getAllBoardmates } from '../db/boardmates';
import {
  getRentSettings,
  saveRentSettings,
  createRentEntry,
  getRentEntries,
  markRentPaid,
  getRentBillByMonth,
} from '../db/rentBill';
import LabeledInput from '../components/LabeledInput';

const formatMonth = (date) => {
  return (
    date.toLocaleString('default', { month: 'long' }) + ' ' + date.getFullYear()
  );
};

export default function RentBillScreen() {
  const [boardmates, setBoardmates] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [month, setMonth] = useState(formatMonth(new Date()));
  const [defaultPrice, setDefaultPrice] = useState('');
  const [rentSettings, setRentSettings] = useState(null);
  const [computed, setComputed] = useState(false);
  const [results, setResults] = useState([]);
  const [editingPrice, setEditingPrice] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  useFocusEffect(
    useCallback(() => {
      const bm = getAllBoardmates();
      const settings = getRentSettings();
      setBoardmates(bm);
      setRentSettings(settings);
      if (settings) setDefaultPrice(String(settings.default_price));
      setComputed(false);
      setResults([]);
      setSelectedDate(new Date());
      setMonth(formatMonth(new Date()));
    }, [])
  );

  const handleConfirmDate = (date) => {
    setSelectedDate(date);
    setMonth(formatMonth(date));
    setShowDatePicker(false);
  };

  const handleSaveSettings = () => {
    if (!defaultPrice) {
      Alert.alert('Error', 'Please enter a default rent price.');
      return;
    }
    saveRentSettings(parseFloat(defaultPrice));
    setRentSettings(getRentSettings());
    setEditingPrice(false);
  };

  const handleCompute = () => {
    if (!month) {
      Alert.alert('Error', 'Please select the month.');
      return;
    }
    if (!rentSettings) {
      Alert.alert('Error', 'Please set a default rent price first.');
      return;
    }
    const existing = getRentBillByMonth(month);
    if (existing) {
      Alert.alert('Error', `Rent bill for ${month} already exists.`);
      return;
    }
    for (const bm of boardmates) {
      const amount = bm.rent_price ?? rentSettings.default_price;
      createRentEntry(month, bm.id, amount);
    }
    const entries = getRentEntries(month);
    setResults(entries);
    setComputed(true);
  };

  const handleMarkPaid = (id) => {
    Alert.alert('Mark as Paid', 'Confirm this boardmate has paid?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Confirm',
        onPress: () => {
          markRentPaid(id);
          setResults((prev) =>
            prev.map((r) => (r.id === id ? { ...r, is_paid: 1 } : r))
          );
        },
      },
    ]);
  };

  const handleSendSMS = async (item) => {
    const isAvailable = await SMS.isAvailableAsync();
    if (!isAvailable) {
      Alert.alert('SMS not available.');
      return;
    }
    const message =
      `Hi ${item.name}! 👋\n` +
      `Your rent for ${month}:\n` +
      `• Amount Due: ₱${item.amount.toFixed(2)}\n\n` +
      `Please settle on time. Thank you! - BoardMate Bill`;
    await SMS.sendSMSAsync([item.mobile], message);
  };

  const handleSendUnpaid = async () => {
    const isAvailable = await SMS.isAvailableAsync();
    if (!isAvailable) {
      Alert.alert('SMS not available.');
      return;
    }
    const unpaid = results.filter((r) => r.is_paid === 0);
    if (unpaid.length === 0) {
      Alert.alert('All paid!', 'Everyone has already paid their rent.');
      return;
    }
    Alert.alert(
      'Send to Unpaid',
      `You will send ${unpaid.length} messages one by one. After each, press Send then go back.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Start Sending',
          onPress: async () => {
            for (const item of unpaid) {
              const message =
                `Hi ${item.name}! 👋\n` +
                `Your rent for ${month}:\n` +
                `• Amount Due: ₱${item.amount.toFixed(2)}\n\n` +
                `Please settle on time. Thank you! - BoardMate Bill`;
              await SMS.sendSMSAsync([item.mobile], message);
            }
          },
        },
      ]
    );
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ padding: 16, gap: 14 }}
    >
      <Text style={styles.sectionTitle}>Rent Bill Generator</Text>

      <View style={styles.settingsCard}>
        {rentSettings && !editingPrice ? (
          <View style={styles.row}>
            <Text style={styles.priceText}>
              ₱{rentSettings.default_price.toFixed(2)}
            </Text>
            <TouchableOpacity onPress={() => setEditingPrice(true)}>
              <Text style={styles.editLink}>Edit</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.row}>
            <View style={{ flex: 1 }}>
              <LabeledInput
                label="Default Rent Price"
                placeholder="Enter default rent price (₱)"
                value={defaultPrice}
                onChangeText={setDefaultPrice}
                keyboardType="decimal-pad"
              />
            </View>
            <TouchableOpacity
              style={styles.btnSmall}
              onPress={handleSaveSettings}
            >
              <Text style={styles.btnSmallText}>Save</Text>
            </TouchableOpacity>
          </View>
        )}
        <Text style={styles.hint}>
          * Boardmates with custom rent price will use their own rate.
        </Text>
      </View>

      {!computed && (
        <>
          <View>
            <Text style={styles.labelText}>Billing Month</Text>
            <TouchableOpacity
              style={styles.datePicker}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.datePickerText}>📅 {month}</Text>
            </TouchableOpacity>
          </View>

          <DateTimePickerModal
            isVisible={showDatePicker}
            mode="date"
            date={selectedDate}
            onConfirm={handleConfirmDate}
            onCancel={() => setShowDatePicker(false)}
          />

          <Text style={styles.label}>Boardmate Rent Prices:</Text>
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={[styles.tableCell, styles.headerText]}>Name</Text>
              <Text style={[styles.tableCell, styles.headerText]}>
                Rent Price
              </Text>
            </View>
            {boardmates.map((bm) => (
              <View key={bm.id} style={styles.tableRow}>
                <Text style={styles.tableCell}>{bm.name}</Text>
                <Text style={styles.tableCell}>
                  {bm.rent_price
                    ? `₱${bm.rent_price.toFixed(2)} (custom)`
                    : rentSettings
                      ? `₱${rentSettings.default_price.toFixed(2)} (default)`
                      : 'No price set'}
                </Text>
              </View>
            ))}
          </View>

          <TouchableOpacity style={styles.btnCompute} onPress={handleCompute}>
            <Text style={styles.btnText}>🏠 Generate Rent Bills</Text>
          </TouchableOpacity>
        </>
      )}

      {computed && (
        <>
          <Text style={styles.label}>Rent Bills for {month}:</Text>
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={[styles.tableCell, styles.headerText]}>Name</Text>
              <Text style={[styles.tableCell, styles.headerText]}>Amount</Text>
              <Text style={[styles.tableCell, styles.headerText]}>Status</Text>
              <Text style={[styles.tableCell, styles.headerText]}>SMS</Text>
            </View>
            {results.map((item) => (
              <View key={item.id} style={styles.tableRow}>
                <Text style={styles.tableCell}>{item.name}</Text>
                <Text style={styles.tableCell}>₱{item.amount.toFixed(2)}</Text>
                <TouchableOpacity
                  onPress={() => !item.is_paid && handleMarkPaid(item.id)}
                >
                  <Text style={item.is_paid ? styles.paid : styles.unpaid}>
                    {item.is_paid ? '✅ Paid' : '⬜ Unpaid'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => handleSendSMS(item)}>
                  <Text style={styles.smsBtn}>📤</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>

          <TouchableOpacity
            style={styles.btnSendAll}
            onPress={handleSendUnpaid}
          >
            <Text style={styles.btnText}>📤 Send to Unpaid</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.btnReset}
            onPress={() => {
              setComputed(false);
              setResults([]);
              setSelectedDate(new Date());
              setMonth(formatMonth(new Date()));
            }}
          >
            <Text style={styles.btnText}>Generate New Bill</Text>
          </TouchableOpacity>
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  label: { fontSize: 14, fontWeight: '600', color: '#374151' },
  hint: { fontSize: 11, color: '#9CA3AF', marginTop: 4 },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    backgroundColor: 'white',
  },
  datePicker: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    backgroundColor: 'white',
  },
  datePickerText: { fontSize: 14, color: '#374151' },
  settingsCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    gap: 8,
    elevation: 2,
  },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  priceText: { fontSize: 20, fontWeight: '700', color: '#111827', flex: 1 },
  editLink: { color: '#2563EB', fontWeight: '600' },
  btnSmall: { backgroundColor: '#2563EB', padding: 10, borderRadius: 8 },
  btnSmallText: { color: 'white', fontWeight: '600' },
  btnCompute: {
    backgroundColor: '#7C3AED',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  btnSendAll: {
    backgroundColor: '#2563EB',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  btnReset: {
    backgroundColor: '#6B7280',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  btnText: { color: 'white', fontWeight: '600' },
  table: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 10,
    overflow: 'hidden',
  },
  tableRow: {
    flexDirection: 'row',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
    alignItems: 'center',
  },
  tableHeader: { backgroundColor: '#F5F3FF' },
  tableCell: { flex: 1, fontSize: 13, color: '#374151' },
  headerText: { fontWeight: '600', color: '#6D28D9' },
  paid: { color: '#16A34A', fontWeight: '600', fontSize: 12 },
  unpaid: { color: '#DC2626', fontWeight: '600', fontSize: 12 },
  smsBtn: { fontSize: 20 },
  labelText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
});
