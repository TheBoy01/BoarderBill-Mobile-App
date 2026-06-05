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
import { updateStartedKwh } from '../db/boardmates';
import {
  createElectricBill,
  addElectricEntry,
  getElectricBillWithEntries,
  getElectricBillByMonth,
  getBoardmatesWithBillForMonth,
} from '../db/electricBill';
import { generateElectricBillPdf } from '../utils/generatePdf';
import LabeledInput from '../components/LabeledInput';
import { computeElectricBill } from '../utils/electricCompute';

const formatMonth = (date) => {
  return (
    date.toLocaleString('default', { month: 'long' }) + ' ' + date.getFullYear()
  );
};

export default function ElectricBillScreen() {
  const [boardmates, setBoardmates] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [month, setMonth] = useState(formatMonth(new Date()));
  const [meralcoCharge, setMeralcoCharge] = useState('');
  const [newKwh, setNewKwh] = useState({});
  const [results, setResults] = useState([]);
  const [computed, setComputed] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  useFocusEffect(
    useCallback(() => {
      loadBoardmates(formatMonth(new Date()));
      setResults([]);
      setComputed(false);
      setNewKwh({});
      setSelectedDate(new Date());
      setMonth(formatMonth(new Date()));
      setMeralcoCharge('');
    }, [])
  );

  const loadBoardmates = (currentMonth) => {
    const all = getAllBoardmates();
    const withBill = getBoardmatesWithBillForMonth(currentMonth);
    const withBillIds = withBill.map((b) => b.boardmate_id);
    const filtered = all.filter((b) => !withBillIds.includes(b.id));
    setBoardmates(filtered);
  };

  const handleConfirmDate = (date) => {
    setSelectedDate(date);
    const newMonth = formatMonth(date);
    setMonth(newMonth);
    setShowDatePicker(false);
    loadBoardmates(newMonth);
  };

  const handleCompute = () => {
    if (!month || !meralcoCharge) {
      Alert.alert('Error', 'Please enter month and Meralco charge.');
      return;
    }
    const existing = getElectricBillByMonth(month);
    if (existing) {
      Alert.alert('Error', `Electric bill for ${month} already exists.`);
      return;
    }
    for (const bm of boardmates) {
      if (!newKwh[bm.id]) {
        Alert.alert('Error', `Please enter new kWh for ${bm.name}`);
        return;
      }
    }
    const charge = parseFloat(meralcoCharge);
    const bill = createElectricBill(month, charge);
    const billId = bill.lastInsertRowId;

    for (const bm of boardmates) {
      const newReading = parseFloat(newKwh[bm.id]);
      const consumed = newReading - bm.started_kwh;
      const total = computeElectricBill(newReading, charge);
      addElectricEntry(billId, bm.id, newReading, total);
      updateStartedKwh(bm.id, newReading);
    }

    const entries = getElectricBillWithEntries(billId);
    setResults(entries);
    setComputed(true);
  };

  const handleSendSMS = async (item) => {
    const isAvailable = await SMS.isAvailableAsync();
    if (!isAvailable) {
      Alert.alert('SMS not available.');
      return;
    }
    const consumed = item.new_kwh - item.started_kwh;
    const message =
      `Hi ${item.name}! 👋\n` +
      `Your electric bill for ${month}:\n` +
      `• Previous kWh: ${item.started_kwh}\n` +
      `• New kWh: ${item.new_kwh}\n` +
      `• Consumed: ${consumed.toFixed(2)} kWh\n` +
      `• Rate: ₱${meralcoCharge}/kWh\n` +
      `• Total Due: ₱${item.total_due.toFixed(2)}\n\n` +
      `Please settle on time. Thank you! - BoardMate Bill`;
    await SMS.sendSMSAsync([item.mobile], message);
  };

  const handleSendAll = async () => {
    const isAvailable = await SMS.isAvailableAsync();
    if (!isAvailable) {
      Alert.alert('SMS not available.');
      return;
    }
    Alert.alert(
      'Send to All',
      `You will send ${results.length} messages one by one. After each message, press Send then go back.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Start Sending',
          onPress: async () => {
            for (const item of results) {
              const consumed = item.new_kwh - item.started_kwh;
              const message =
                `Hi ${item.name}! 👋\n` +
                `Your electric bill for ${month}:\n` +
                `• Previous kWh: ${item.started_kwh}\n` +
                `• New kWh: ${item.new_kwh}\n` +
                `• Consumed: ${consumed.toFixed(2)} kWh\n` +
                `• Rate: ₱${meralcoCharge}/kWh\n` +
                `• Total Due: ₱${item.total_due.toFixed(2)}\n\n` +
                `Please settle on time. Thank you! - BoardMate Bill`;
              await SMS.sendSMSAsync([item.mobile], message);
            }
          },
        },
      ]
    );
  };

  const handleGeneratePdf = async () => {
    try {
      const bill = { month, meralco_charge: parseFloat(meralcoCharge) };
      await generateElectricBillPdf(bill, results, meralcoCharge);
    } catch (e) {
      Alert.alert('Error', 'Failed to generate PDF.');
    }
  };

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ padding: 16, gap: 14 }}
    >
      <Text style={styles.sectionTitle}>Electric Bill Generator</Text>

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

      <LabeledInput
        label="Meralco Charge per kWh"
        placeholder="Enter charge per kWh (₱)"
        value={meralcoCharge}
        onChangeText={setMeralcoCharge}
        keyboardType="decimal-pad"
      />

      {!computed && (
        <>
          {boardmates.length === 0 ? (
            <Text style={styles.empty}>
              All boardmates already have a bill for {month}.
            </Text>
          ) : (
            <>
              <Text style={styles.label}>Enter New kWh per Boardmate:</Text>
              {boardmates.map((bm) => (
                <LabeledInput
                  key={bm.id}
                  label={`${bm.name} (Current: ${bm.started_kwh} kWh)`}
                  placeholder="Enter new kWh reading"
                  keyboardType="decimal-pad"
                  value={newKwh[bm.id] || ''}
                  onChangeText={(val) =>
                    setNewKwh((prev) => ({ ...prev, [bm.id]: val }))
                  }
                />
              ))}
              <TouchableOpacity
                style={styles.btnCompute}
                onPress={handleCompute}
              >
                <Text style={styles.btnText}>⚡ Compute Bills</Text>
              </TouchableOpacity>
            </>
          )}
        </>
      )}

      {computed && (
        <>
          <Text style={styles.label}>Results for {month}:</Text>
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={[styles.tableCell, styles.headerText]}>Name</Text>
              <Text style={[styles.tableCell, styles.headerText]}>kWh</Text>
              <Text style={[styles.tableCell, styles.headerText]}>Total</Text>
              <Text style={[styles.tableCell, styles.headerText]}>SMS</Text>
            </View>
            {results.map((item) => (
              <View key={item.id} style={styles.tableRow}>
                <Text style={styles.tableCell}>{item.name}</Text>
                <Text style={styles.tableCell}>{item.new_kwh}</Text>
                <Text style={styles.tableCell}>
                  ₱{item.total_due.toFixed(2)}
                </Text>
                <TouchableOpacity onPress={() => handleSendSMS(item)}>
                  <Text style={styles.smsBtn}>📤</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>

          <TouchableOpacity style={styles.btnPdf} onPress={handleGeneratePdf}>
            <Text style={styles.btnText}>📄 Generate PDF</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.btnSendAll} onPress={handleSendAll}>
            <Text style={styles.btnText}>📤 Send to All</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.btnReset}
            onPress={() => {
              setComputed(false);
              setResults([]);
              setNewKwh({});
              setSelectedDate(new Date());
              setMonth(formatMonth(new Date()));
              setMeralcoCharge('');
              loadBoardmates(formatMonth(new Date()));
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
  labelText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 6,
  },
  empty: { textAlign: 'center', color: '#9CA3AF', marginTop: 20 },
  datePicker: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    backgroundColor: 'white',
  },
  datePickerText: { fontSize: 14, color: '#374151' },
  btnCompute: {
    backgroundColor: '#2563EB',
    padding: 14,
    borderRadius: 10,
    alignItems: 'center',
  },
  btnPdf: {
    backgroundColor: '#059669',
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
  tableHeader: { backgroundColor: '#EFF6FF' },
  tableCell: { flex: 1, fontSize: 13, color: '#374151' },
  headerText: { fontWeight: '600', color: '#1D4ED8' },
  smsBtn: { fontSize: 20 },
});
