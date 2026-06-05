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
  saveWaterBill,
  addWaterEntry,
  getWaterBillByMonth,
} from '../db/waterBill';
import LabeledInput from '../components/LabeledInput';

const formatMonth = (date) => {
  return (
    date.toLocaleString('default', { month: 'long' }) + ' ' + date.getFullYear()
  );
};

export default function WaterBillScreen() {
  const [boardmates, setBoardmates] = useState([]);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [month, setMonth] = useState(formatMonth(new Date()));
  const [totalBill, setTotalBill] = useState('');
  const [perPerson, setPerPerson] = useState(null);
  const [computed, setComputed] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  useFocusEffect(
    useCallback(() => {
      setBoardmates(getAllBoardmates());
      setComputed(false);
      setPerPerson(null);
      setSelectedDate(new Date());
      setMonth(formatMonth(new Date()));
      setTotalBill('');
    }, [])
  );

  const handleConfirmDate = (date) => {
    setSelectedDate(date);
    setMonth(formatMonth(date));
    setShowDatePicker(false);
  };

  const handleCompute = () => {
    if (!month || !totalBill) {
      Alert.alert('Error', 'Please enter month and total water bill.');
      return;
    }
    const existing = getWaterBillByMonth(month);
    if (existing) {
      Alert.alert('Error', `Water bill for ${month} already exists.`);
      return;
    }
    const total = parseFloat(totalBill);
    const divisor = boardmates.length + 1;
    const share = total / divisor;

    const bill = saveWaterBill(month, total, share);
    const billId = bill.lastInsertRowId;

    for (const bm of boardmates) {
      addWaterEntry(billId, bm.id, share);
    }

    setPerPerson(share);
    setComputed(true);
  };

  const handleSendSMS = async (bm) => {
    const isAvailable = await SMS.isAvailableAsync();
    if (!isAvailable) {
      Alert.alert('SMS not available.');
      return;
    }
    const message =
      `Hi ${bm.name}! 👋\n` +
      `Your water bill for ${month}:\n` +
      `• Total Bill: ₱${parseFloat(totalBill).toFixed(2)}\n` +
      `• Your Share: ₱${perPerson.toFixed(2)}\n\n` +
      `Please settle on time. Thank you! - BoardMate Bill`;
    await SMS.sendSMSAsync([bm.mobile], message);
  };

  const handleSendAll = async () => {
    const isAvailable = await SMS.isAvailableAsync();
    if (!isAvailable) {
      Alert.alert('SMS not available.');
      return;
    }
    Alert.alert(
      'Send to All',
      `You will send ${boardmates.length} messages one by one. After each message, press Send then go back.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Start Sending',
          onPress: async () => {
            for (const bm of boardmates) {
              const message =
                `Hi ${bm.name}! 👋\n` +
                `Your water bill for ${month}:\n` +
                `• Total Bill: ₱${parseFloat(totalBill).toFixed(2)}\n` +
                `• Your Share: ₱${perPerson.toFixed(2)}\n\n` +
                `Please settle on time. Thank you! - BoardMate Bill`;
              await SMS.sendSMSAsync([bm.mobile], message);
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
      <Text style={styles.sectionTitle}>Water Bill Generator</Text>
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
        label="Total Water Bill"
        placeholder="Enter total water bill (₱)"
        value={totalBill}
        onChangeText={setTotalBill}
        keyboardType="decimal-pad"
      />

      {!computed && (
        <TouchableOpacity style={styles.btnCompute} onPress={handleCompute}>
          <Text style={styles.btnText}>💧 Compute Bills</Text>
        </TouchableOpacity>
      )}

      {computed && (
        <>
          <View style={styles.resultCard}>
            <Text style={styles.resultLabel}>Month</Text>
            <Text style={styles.resultValue}>{month}</Text>
            <Text style={styles.resultLabel}>Total Bill</Text>
            <Text style={styles.resultValue}>
              ₱{parseFloat(totalBill).toFixed(2)}
            </Text>
            <Text style={styles.resultLabel}>Divided by</Text>
            <Text style={styles.resultValue}>
              {boardmates.length + 1} persons (including owner)
            </Text>
            <Text style={styles.resultLabel}>Each Person Pays</Text>
            <Text style={styles.resultHighlight}>₱{perPerson.toFixed(2)}</Text>
          </View>

          <Text style={styles.label}>Send to individual boardmate:</Text>
          <View style={styles.table}>
            <View style={[styles.tableRow, styles.tableHeader]}>
              <Text style={[styles.tableCell, styles.headerText]}>Name</Text>
              <Text style={[styles.tableCell, styles.headerText]}>Amount</Text>
              <Text style={[styles.tableCell, styles.headerText]}>SMS</Text>
            </View>
            {boardmates.map((bm) => (
              <View key={bm.id} style={styles.tableRow}>
                <Text style={styles.tableCell}>{bm.name}</Text>
                <Text style={styles.tableCell}>₱{perPerson.toFixed(2)}</Text>
                <TouchableOpacity onPress={() => handleSendSMS(bm)}>
                  <Text style={styles.smsBtn}>📤</Text>
                </TouchableOpacity>
              </View>
            ))}
          </View>

          <TouchableOpacity style={styles.btnSendAll} onPress={handleSendAll}>
            <Text style={styles.btnText}>📤 Send to All</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.btnReset}
            onPress={() => {
              setComputed(false);
              setPerPerson(null);
              setSelectedDate(new Date());
              setMonth(formatMonth(new Date()));
              setTotalBill('');
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
  btnCompute: {
    backgroundColor: '#0EA5E9',
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
  resultCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    gap: 4,
    elevation: 2,
  },
  resultLabel: { fontSize: 12, color: '#9CA3AF', marginTop: 8 },
  resultValue: { fontSize: 14, color: '#374151', fontWeight: '500' },
  resultHighlight: {
    fontSize: 24,
    fontWeight: '700',
    color: '#0EA5E9',
    marginTop: 4,
  },
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
  tableHeader: { backgroundColor: '#F0F9FF' },
  tableCell: { flex: 1, fontSize: 13, color: '#374151' },
  headerText: { fontWeight: '600', color: '#0369A1' },
  smsBtn: { fontSize: 20 },
  labelText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
});
