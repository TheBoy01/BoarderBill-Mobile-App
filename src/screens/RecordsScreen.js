import { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  Modal,
  TextInput,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import * as SMS from 'expo-sms';
import { getAllBoardmates } from '../db/boardmates';
import { updateStartedKwh } from '../db/boardmates';
import db from '../db/database';
import {
  getElectricBillsByBoardmate,
  getAllElectricBills,
  getElectricBillWithEntries,
  markElectricEntryPaid,
  updateElectricBill,
  updateElectricEntry,
  deleteElectricBill,
  getElectricEntriesByBill,
} from '../db/electricBill';
import {
  getWaterBillsByBoardmate,
  getAllWaterBills,
  getWaterEntriesWithBoardmates,
  markWaterEntryPaid,
  updateWaterBill,
  deleteWaterBill,
} from '../db/waterBill';
import {
  getRentBillsByBoardmate,
  getAllRentBills,
  getRentEntriesWithBoardmates,
  markRentEntryPaid,
  updateRentEntry,
  deleteRentBill,
  deleteRentEntry,
} from '../db/rentBill';
import {
  generateElectricBillPdf,
  generateWaterBillPdf,
  generateRentBillPdf,
} from '../utils/generatePdf';
import { computeElectricBill } from '../utils/electricCompute';

const TABS = ['By Boardmate', 'By Bill Type'];
const BILL_TABS = ['Electric', 'Water', 'Rent'];

export default function RecordsScreen() {
  const [activeTab, setActiveTab] = useState('By Boardmate');
  const [activeBillTab, setActiveBillTab] = useState('Electric');
  const [boardmates, setBoardmates] = useState([]);
  const [selectedBoardmate, setSelectedBoardmate] = useState(null);
  const [boardmateRecords, setBoardmateRecords] = useState({
    electric: [],
    water: [],
    rent: [],
  });
  const [electricBills, setElectricBills] = useState([]);
  const [waterBills, setWaterBills] = useState([]);
  const [rentBills, setRentBills] = useState([]);
  const [electricBillEntries, setElectricBillEntries] = useState({});
  const [waterBillEntries, setWaterBillEntries] = useState({});
  const [rentBillEntries, setRentBillEntries] = useState({});
  const [selectedMonth, setSelectedMonth] = useState('All');
  const [allMonths, setAllMonths] = useState([]);
  const [showMonthPicker, setShowMonthPicker] = useState(false);

  // Edit modals
  const [editElectricModal, setEditElectricModal] = useState(false);
  const [editWaterModal, setEditWaterModal] = useState(false);
  const [editRentModal, setEditRentModal] = useState(false);
  const [editingBill, setEditingBill] = useState(null);
  const [editingEntries, setEditingEntries] = useState([]);
  const [editMeralco, setEditMeralco] = useState('');
  const [editKwh, setEditKwh] = useState({});
  const [editTotalWater, setEditTotalWater] = useState('');
  const [editRentAmounts, setEditRentAmounts] = useState({});

  useFocusEffect(
    useCallback(() => {
      loadData();
      setSelectedBoardmate(null);
      setBoardmateRecords({ electric: [], water: [], rent: [] });
    }, [])
  );

  const loadData = () => {
    const bm = getAllBoardmates();
    setBoardmates(bm);
    const eb = getAllElectricBills();
    const wb = getAllWaterBills();
    const rb = getAllRentBills();
    setElectricBills(eb);
    setWaterBills(wb);
    setRentBills(rb);

    const months = new Set();
    eb.forEach((b) => months.add(b.month));
    wb.forEach((b) => months.add(b.month));
    rb.forEach((b) => months.add(b.month));
    setAllMonths(['All', ...Array.from(months)]);

    const ebEntries = {};
    eb.forEach((b) => {
      ebEntries[b.id] = getElectricBillWithEntries(b.id);
    });
    setElectricBillEntries(ebEntries);

    const wbEntries = {};
    wb.forEach((b) => {
      wbEntries[b.id] = getWaterEntriesWithBoardmates(b.id);
    });
    setWaterBillEntries(wbEntries);

    const rbEntries = {};
    rb.forEach((b) => {
      rbEntries[b.month] = getRentEntriesWithBoardmates(b.month);
    });
    setRentBillEntries(rbEntries);
  };

  const handleSelectBoardmate = (bm) => {
    setSelectedBoardmate(bm);
    setBoardmateRecords({
      electric: getElectricBillsByBoardmate(bm.id),
      water: getWaterBillsByBoardmate(bm.id),
      rent: getRentBillsByBoardmate(bm.id),
    });
  };

  const confirmMarkPaid = (onConfirm) => {
    Alert.alert(
      'KUMPIRMAHIN',
      'SIGURADO KA BANG BAYAD NA ITO? Dahil hindi na ito mapapalitan kung hindi pa bayad.',
      [
        { text: 'Hindi', style: 'cancel' },
        { text: 'Oo, Bayad Na!', onPress: onConfirm },
      ]
    );
  };

  const handleMarkElectricPaid = (id, is_paid) => {
    if (is_paid) return;
    confirmMarkPaid(() => {
      markElectricEntryPaid(id);
      if (selectedBoardmate) {
        setBoardmateRecords((prev) => ({
          ...prev,
          electric: prev.electric.map((r) =>
            r.id === id ? { ...r, is_paid: 1 } : r
          ),
        }));
      }
      loadData();
    });
  };

  const handleMarkWaterPaid = (id, is_paid) => {
    if (is_paid) return;
    confirmMarkPaid(() => {
      markWaterEntryPaid(id);
      if (selectedBoardmate) {
        setBoardmateRecords((prev) => ({
          ...prev,
          water: prev.water.map((r) =>
            r.id === id ? { ...r, is_paid: 1 } : r
          ),
        }));
      }
      loadData();
    });
  };

  const handleMarkRentPaid = (id, is_paid) => {
    if (is_paid) return;
    confirmMarkPaid(() => {
      markRentEntryPaid(id);
      if (selectedBoardmate) {
        setBoardmateRecords((prev) => ({
          ...prev,
          rent: prev.rent.map((r) => (r.id === id ? { ...r, is_paid: 1 } : r)),
        }));
      }
      loadData();
    });
  };

  // ELECTRIC EDIT/DELETE
  const openEditElectric = (bill) => {
    const entries = getElectricEntriesByBill(bill.id);
    const hasPaid = entries.some((e) => e.is_paid === 1);
    if (hasPaid) {
      Alert.alert(
        'Locked',
        'This bill cannot be edited because some entries are already paid.'
      );
      return;
    }

    // Get previous kWh from before this bill
    const entriesWithPrev = entries.map((entry) => {
      const prevBill = db.getFirstSync(
        `
      SELECT ebe.new_kwh 
      FROM electric_bill_entries ebe
      JOIN electric_bills eb ON eb.id = ebe.bill_id
      WHERE ebe.boardmate_id = ? AND eb.id < ?
      ORDER BY eb.id DESC LIMIT 1
    `,
        [entry.boardmate_id, bill.id]
      );
      return {
        ...entry,
        started_kwh: prevBill ? prevBill.new_kwh : entry.started_kwh,
      };
    });

    setEditingBill(bill);
    setEditingEntries(entriesWithPrev);
    setEditMeralco(String(bill.meralco_charge));
    const kwhMap = {};
    entriesWithPrev.forEach((e) => {
      kwhMap[e.id] = String(e.new_kwh);
    });
    setEditKwh(kwhMap);
    setEditElectricModal(true);
  };

  const handleSaveElectric = () => {
    const charge = parseFloat(editMeralco);
    updateElectricBill(editingBill.id, charge);

    for (const entry of editingEntries) {
      const newReading = parseFloat(editKwh[entry.id]);
      const total = computeElectricBill(parseFloat(editKwh[entry.id]), charge);
      updateElectricEntry(entry.id, newReading, total);
      updateStartedKwh(entry.boardmate_id, newReading);
    }

    setEditElectricModal(false);
    loadData();
    if (selectedBoardmate) {
      setBoardmateRecords((prev) => ({
        ...prev,
        electric: getElectricBillsByBoardmate(selectedBoardmate.id),
      }));
    }
    Alert.alert('Success', 'Electric bill updated successfully.');
  };

  const handleDeleteElectric = (bill) => {
    const entries = getElectricEntriesByBill(bill.id);
    const hasPaid = entries.some((e) => e.is_paid === 1);
    if (hasPaid) {
      Alert.alert(
        'Locked',
        'This bill cannot be deleted because some entries are already paid.'
      );
      return;
    }
    Alert.alert(
      'Delete Bill',
      `Delete electric bill for ${bill.month}? This will revert all boardmate kWh readings.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            for (const entry of entries) {
              const bm = boardmates.find((b) => b.id === entry.boardmate_id);
              if (bm) updateStartedKwh(entry.boardmate_id, entry.started_kwh);
            }
            deleteElectricBill(bill.id);
            loadData();
            if (selectedBoardmate) {
              setBoardmateRecords((prev) => ({
                ...prev,
                electric: getElectricBillsByBoardmate(selectedBoardmate.id),
              }));
            }
          },
        },
      ]
    );
  };

  // WATER EDIT/DELETE
  const openEditWater = (bill) => {
    const entries = getWaterEntriesWithBoardmates(bill.id);
    const hasPaid = entries.some((e) => e.is_paid === 1);
    if (hasPaid) {
      Alert.alert(
        'Locked',
        'This bill cannot be edited because some entries are already paid.'
      );
      return;
    }
    setEditingBill(bill);
    setEditTotalWater(String(bill.per_person));
    setEditWaterModal(true);
  };

  const handleSaveWater = () => {
    const entries = getWaterEntriesWithBoardmates(editingBill.id);
    for (const entry of entries) {
      db.runSync('UPDATE water_bill_entries SET amount = ? WHERE id = ?', [
        parseFloat(editTotalWater),
        entry.id,
      ]);
    }
    db.runSync('UPDATE water_bills SET per_person = ? WHERE id = ?', [
      parseFloat(editTotalWater),
      editingBill.id,
    ]);
    setEditWaterModal(false);
    loadData();
    if (selectedBoardmate) {
      setBoardmateRecords((prev) => ({
        ...prev,
        water: getWaterBillsByBoardmate(selectedBoardmate.id),
      }));
    }
    Alert.alert('Success', 'Water bill updated successfully.');
  };

  const handleDeleteWater = (bill) => {
    const entries = getWaterEntriesWithBoardmates(bill.id);
    const hasPaid = entries.some((e) => e.is_paid === 1);
    if (hasPaid) {
      Alert.alert(
        'Locked',
        'This bill cannot be deleted because some entries are already paid.'
      );
      return;
    }
    Alert.alert('Delete Bill', `Delete water bill for ${bill.month}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteWaterBill(bill.id);
          loadData();
          if (selectedBoardmate) {
            setBoardmateRecords((prev) => ({
              ...prev,
              water: getWaterBillsByBoardmate(selectedBoardmate.id),
            }));
          }
        },
      },
    ]);
  };

  // RENT EDIT/DELETE
  const openEditRent = (month) => {
    const entries = getRentEntriesWithBoardmates(month);
    const hasPaid = entries.some((e) => e.is_paid === 1);
    if (hasPaid) {
      Alert.alert(
        'Locked',
        'This bill cannot be edited because some entries are already paid.'
      );
      return;
    }
    setEditingBill({ month });
    setEditingEntries(entries);
    const amounts = {};
    entries.forEach((e) => {
      amounts[e.id] = String(e.amount);
    });
    setEditRentAmounts(amounts);
    setEditRentModal(true);
  };

  const handleSaveRent = () => {
    for (const entry of editingEntries) {
      updateRentEntry(entry.id, parseFloat(editRentAmounts[entry.id]));
    }
    setEditRentModal(false);
    loadData();
    if (selectedBoardmate) {
      setBoardmateRecords((prev) => ({
        ...prev,
        rent: getRentBillsByBoardmate(selectedBoardmate.id),
      }));
    }
    Alert.alert('Success', 'Rent bill updated successfully.');
  };

  const handleDeleteRent = (month) => {
    const entries = getRentEntriesWithBoardmates(month);
    const hasPaid = entries.some((e) => e.is_paid === 1);
    if (hasPaid) {
      Alert.alert(
        'Locked',
        'This bill cannot be deleted because some entries are already paid.'
      );
      return;
    }
    Alert.alert('Delete Bill', `Delete rent bill for ${month}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: () => {
          deleteRentBill(month);
          loadData();
          if (selectedBoardmate) {
            setBoardmateRecords((prev) => ({
              ...prev,
              rent: getRentBillsByBoardmate(selectedBoardmate.id),
            }));
          }
        },
      },
    ]);
  };

  const handleSendElectricSMS = async (item) => {
    const isAvailable = await SMS.isAvailableAsync();
    if (!isAvailable) {
      Alert.alert('SMS not available.');
      return;
    }
    const consumed = (item.new_kwh || 0) - (item.started_kwh || 0);
    const message =
      `Hi ${item.name}! 👋\n` +
      `Your electric bill for ${item.month}:\n` +
      `• Consumed: ${consumed.toFixed(2)} kWh\n` +
      `• Total Due: ₱${item.total_due.toFixed(2)}\n\n` +
      `Please settle on time. Thank you! - BoardMate Bill`;
    await SMS.sendSMSAsync([item.mobile], message);
  };

  const handleSendWaterSMS = async (item) => {
    const isAvailable = await SMS.isAvailableAsync();
    if (!isAvailable) {
      Alert.alert('SMS not available.');
      return;
    }
    const message =
      `Hi ${item.name}! 👋\n` +
      `Your water bill for ${item.month}:\n` +
      `• Your Share: ₱${item.amount.toFixed(2)}\n\n` +
      `Please settle on time. Thank you! - BoardMate Bill`;
    await SMS.sendSMSAsync([item.mobile], message);
  };

  const handleSendRentSMS = async (item) => {
    const isAvailable = await SMS.isAvailableAsync();
    if (!isAvailable) {
      Alert.alert('SMS not available.');
      return;
    }
    const message =
      `Hi ${item.name}! 👋\n` +
      `Your rent for ${item.month}:\n` +
      `• Amount Due: ₱${item.amount.toFixed(2)}\n\n` +
      `Please settle on time. Thank you! - BoardMate Bill`;
    await SMS.sendSMSAsync([item.mobile], message);
  };

  const filteredElectricBills =
    selectedMonth === 'All'
      ? electricBills
      : electricBills.filter((b) => b.month === selectedMonth);
  const filteredWaterBills =
    selectedMonth === 'All'
      ? waterBills
      : waterBills.filter((b) => b.month === selectedMonth);
  const filteredRentBills =
    selectedMonth === 'All'
      ? rentBills
      : rentBills.filter((b) => b.month === selectedMonth);

  const renderMonthPicker = () => (
    <Modal visible={showMonthPicker} transparent animationType="fade">
      <TouchableOpacity
        style={styles.modalOverlay}
        onPress={() => setShowMonthPicker(false)}
      >
        <View style={styles.pickerModal}>
          <Text style={styles.pickerTitle}>Filter by Month</Text>
          {allMonths.map((m) => (
            <TouchableOpacity
              key={m}
              style={[
                styles.pickerItem,
                selectedMonth === m && styles.pickerItemActive,
              ]}
              onPress={() => {
                setSelectedMonth(m);
                setShowMonthPicker(false);
              }}
            >
              <Text
                style={[
                  styles.pickerItemText,
                  selectedMonth === m && styles.pickerItemTextActive,
                ]}
              >
                {m}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </TouchableOpacity>
    </Modal>
  );

  const renderEditElectricModal = () => (
    <Modal visible={editElectricModal} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.editModal}>
          <Text style={styles.editModalTitle}>
            Edit Electric Bill — {editingBill?.month}
          </Text>
          <Text style={styles.editLabel}>Meralco Charge per kWh</Text>
          <TextInput
            style={styles.editInput}
            value={editMeralco}
            onChangeText={setEditMeralco}
            keyboardType="decimal-pad"
            placeholder="Meralco charge"
          />
          {editingEntries.map((entry) => (
            <View key={entry.id}>
              <Text style={styles.editLabel}>{entry.name} — New kWh</Text>
              <TextInput
                style={styles.editInput}
                value={editKwh[entry.id] || ''}
                onChangeText={(val) =>
                  setEditKwh((prev) => ({ ...prev, [entry.id]: val }))
                }
                keyboardType="decimal-pad"
                placeholder="New kWh"
              />
            </View>
          ))}
          <View style={styles.editModalActions}>
            <TouchableOpacity
              style={styles.btnCancel}
              onPress={() => setEditElectricModal(false)}
            >
              <Text style={styles.btnCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.btnSave}
              onPress={handleSaveElectric}
            >
              <Text style={styles.btnSaveText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderEditWaterModal = () => (
    <Modal visible={editWaterModal} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.editModal}>
          <Text style={styles.editModalTitle}>
            Edit Water Bill — {editingBill?.month}
          </Text>
          <Text style={styles.editLabel}>
            Total Bill: ₱{editingBill?.total_amount?.toFixed(2)}
          </Text>
          <Text style={styles.editLabel}>Share per Person (₱)</Text>
          <TextInput
            style={styles.editInput}
            value={editTotalWater}
            onChangeText={setEditTotalWater}
            keyboardType="decimal-pad"
            placeholder="Enter share per person"
          />
          <View style={styles.editModalActions}>
            <TouchableOpacity
              style={styles.btnCancel}
              onPress={() => setEditWaterModal(false)}
            >
              <Text style={styles.btnCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnSave} onPress={handleSaveWater}>
              <Text style={styles.btnSaveText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderEditRentModal = () => (
    <Modal visible={editRentModal} transparent animationType="slide">
      <View style={styles.modalOverlay}>
        <View style={styles.editModal}>
          <Text style={styles.editModalTitle}>
            Edit Rent Bill — {editingBill?.month}
          </Text>
          {editingEntries.map((entry) => (
            <View key={entry.id}>
              <Text style={styles.editLabel}>{entry.name} — Amount (₱)</Text>
              <TextInput
                style={styles.editInput}
                value={editRentAmounts[entry.id] || ''}
                onChangeText={(val) =>
                  setEditRentAmounts((prev) => ({ ...prev, [entry.id]: val }))
                }
                keyboardType="decimal-pad"
                placeholder="Rent amount"
              />
            </View>
          ))}
          <View style={styles.editModalActions}>
            <TouchableOpacity
              style={styles.btnCancel}
              onPress={() => setEditRentModal(false)}
            >
              <Text style={styles.btnCancelText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.btnSave} onPress={handleSaveRent}>
              <Text style={styles.btnSaveText}>Save</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );

  const renderBoardmateView = () => {
    if (!selectedBoardmate) {
      return (
        <FlatList
          data={boardmates}
          keyExtractor={(item) => String(item.id)}
          contentContainerStyle={{ padding: 16, gap: 10 }}
          ListEmptyComponent={
            <Text style={styles.empty}>No boardmates found.</Text>
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => handleSelectBoardmate(item)}
            >
              <View style={{ flex: 1 }}>
                <Text style={styles.cardName}>{item.name}</Text>
                <Text style={styles.cardSub}>
                  {item.gender} · Boarded since {item.date_started}
                </Text>
              </View>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          )}
        />
      );
    }

    const filteredElectric =
      selectedMonth === 'All'
        ? boardmateRecords.electric
        : boardmateRecords.electric.filter((r) => r.month === selectedMonth);
    const filteredWater =
      selectedMonth === 'All'
        ? boardmateRecords.water
        : boardmateRecords.water.filter((r) => r.month === selectedMonth);
    const filteredRent =
      selectedMonth === 'All'
        ? boardmateRecords.rent
        : boardmateRecords.rent.filter((r) => r.month === selectedMonth);

    return (
      <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => setSelectedBoardmate(null)}
        >
          <Text style={styles.backText}>‹ Back to Boardmates</Text>
        </TouchableOpacity>
        <Text style={styles.sectionTitle}>{selectedBoardmate.name}</Text>

        <Text style={styles.billTypeLabel}>⚡ Electric Bills</Text>
        {filteredElectric.length === 0 ? (
          <Text style={styles.empty}>No electric bills.</Text>
        ) : (
          filteredElectric.map((item) => (
            <View key={item.id} style={styles.recordCard}>
              <View style={styles.recordRow}>
                <Text style={styles.recordMonth}>{item.month}</Text>
                <Text style={styles.recordAmount}>
                  ₱{item.total_due.toFixed(2)}
                </Text>
              </View>
              <Text style={styles.recordSub}>
                kWh: {item.new_kwh} · Rate: ₱{item.meralco_charge}
              </Text>
              <View style={styles.recordActions}>
                <TouchableOpacity
                  style={[
                    styles.paidBtn,
                    item.is_paid
                      ? styles.paidBtnActive
                      : styles.unpaidBtnActive,
                  ]}
                  onPress={() => handleMarkElectricPaid(item.id, item.is_paid)}
                >
                  <Text style={styles.paidBtnText}>
                    {item.is_paid ? '✅ Paid' : '⬜ Unpaid'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() =>
                    handleSendElectricSMS({
                      ...item,
                      name: selectedBoardmate.name,
                      mobile: selectedBoardmate.mobile,
                    })
                  }
                >
                  <Text style={styles.actionBtnText}>📤 SMS</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.pdfBtn]}
                  onPress={async () => {
                    try {
                      const bill = {
                        month: item.month,
                        meralco_charge: item.meralco_charge,
                      };
                      await generateElectricBillPdf(
                        bill,
                        [
                          {
                            ...item,
                            name: selectedBoardmate.name,
                            mobile: selectedBoardmate.mobile,
                          },
                        ],
                        item.meralco_charge
                      );
                    } catch (e) {
                      Alert.alert('Error', 'Failed to generate PDF.');
                    }
                  }}
                >
                  <Text style={styles.actionBtnText}>📄 PDF</Text>
                </TouchableOpacity>
                {!item.is_paid && (
                  <>
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.editBtn]}
                      onPress={() =>
                        openEditElectric({
                          id: item.bill_id,
                          month: item.month,
                          meralco_charge: item.meralco_charge,
                        })
                      }
                    >
                      <Text style={styles.actionBtnText}>✏️ Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.deleteBtn]}
                      onPress={() =>
                        handleDeleteElectric({
                          id: item.bill_id,
                          month: item.month,
                        })
                      }
                    >
                      <Text style={styles.actionBtnText}>🗑️ Delete</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>
          ))
        )}

        <Text style={styles.billTypeLabel}>💧 Water Bills</Text>
        {filteredWater.length === 0 ? (
          <Text style={styles.empty}>No water bills.</Text>
        ) : (
          filteredWater.map((item) => (
            <View key={item.id} style={styles.recordCard}>
              <View style={styles.recordRow}>
                <Text style={styles.recordMonth}>{item.month}</Text>
                <Text style={styles.recordAmount}>
                  ₱{item.amount.toFixed(2)}
                </Text>
              </View>
              <View style={styles.recordActions}>
                <TouchableOpacity
                  style={[
                    styles.paidBtn,
                    item.is_paid
                      ? styles.paidBtnActive
                      : styles.unpaidBtnActive,
                  ]}
                  onPress={() => handleMarkWaterPaid(item.id, item.is_paid)}
                >
                  <Text style={styles.paidBtnText}>
                    {item.is_paid ? '✅ Paid' : '⬜ Unpaid'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() =>
                    handleSendWaterSMS({
                      ...item,
                      name: selectedBoardmate.name,
                      mobile: selectedBoardmate.mobile,
                    })
                  }
                >
                  <Text style={styles.actionBtnText}>📤 SMS</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.pdfBtn]}
                  onPress={async () => {
                    try {
                      const bill = {
                        month: item.month,
                        total_amount: item.total_amount,
                        per_person: item.amount,
                      };
                      await generateWaterBillPdf(bill, [
                        {
                          ...item,
                          name: selectedBoardmate.name,
                          mobile: selectedBoardmate.mobile,
                        },
                      ]);
                    } catch (e) {
                      Alert.alert('Error', 'Failed to generate PDF.');
                    }
                  }}
                >
                  <Text style={styles.actionBtnText}>📄 PDF</Text>
                </TouchableOpacity>
                {!item.is_paid && (
                  <>
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.editBtn]}
                      onPress={() => {
                        const fullBill = db.getFirstSync(
                          'SELECT * FROM water_bills WHERE id = ?',
                          [item.water_bill_id]
                        );
                        openEditWater(fullBill);
                      }}
                    >
                      <Text style={styles.actionBtnText}>✏️ Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.deleteBtn]}
                      onPress={() =>
                        handleDeleteWater({
                          id: item.water_bill_id,
                          month: item.month,
                        })
                      }
                    >
                      <Text style={styles.actionBtnText}>🗑️ Delete</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>
          ))
        )}

        <Text style={styles.billTypeLabel}>🏠 Rent Bills</Text>
        {filteredRent.length === 0 ? (
          <Text style={styles.empty}>No rent bills.</Text>
        ) : (
          filteredRent.map((item) => (
            <View key={item.id} style={styles.recordCard}>
              <View style={styles.recordRow}>
                <Text style={styles.recordMonth}>{item.month}</Text>
                <Text style={styles.recordAmount}>
                  ₱{item.amount.toFixed(2)}
                </Text>
              </View>
              <View style={styles.recordActions}>
                <TouchableOpacity
                  style={[
                    styles.paidBtn,
                    item.is_paid
                      ? styles.paidBtnActive
                      : styles.unpaidBtnActive,
                  ]}
                  onPress={() => handleMarkRentPaid(item.id, item.is_paid)}
                >
                  <Text style={styles.paidBtnText}>
                    {item.is_paid ? '✅ Paid' : '⬜ Unpaid'}
                  </Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.actionBtn}
                  onPress={() =>
                    handleSendRentSMS({
                      ...item,
                      name: selectedBoardmate.name,
                      mobile: selectedBoardmate.mobile,
                    })
                  }
                >
                  <Text style={styles.actionBtnText}>📤 SMS</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionBtn, styles.pdfBtn]}
                  onPress={async () => {
                    try {
                      await generateRentBillPdf(item.month, [
                        {
                          ...item,
                          name: selectedBoardmate.name,
                          mobile: selectedBoardmate.mobile,
                        },
                      ]);
                    } catch (e) {
                      Alert.alert('Error', 'Failed to generate PDF.');
                    }
                  }}
                >
                  <Text style={styles.actionBtnText}>📄 PDF</Text>
                </TouchableOpacity>
                {!item.is_paid && (
                  <>
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.editBtn]}
                      onPress={() => openEditRent(item.month)}
                    >
                      <Text style={styles.actionBtnText}>✏️ Edit</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.actionBtn, styles.deleteBtn]}
                      onPress={() => handleDeleteRent(item.month)}
                    >
                      <Text style={styles.actionBtnText}>🗑️ Delete</Text>
                    </TouchableOpacity>
                  </>
                )}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    );
  };

  const renderBillTypeView = () => (
    <ScrollView contentContainerStyle={{ padding: 16, gap: 14 }}>
      <View style={styles.subTabRow}>
        {BILL_TABS.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[
              styles.subTab,
              activeBillTab === tab && styles.subTabActive,
            ]}
            onPress={() => setActiveBillTab(tab)}
          >
            <Text
              style={[
                styles.subTabText,
                activeBillTab === tab && styles.subTabTextActive,
              ]}
            >
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {activeBillTab === 'Electric' &&
        (filteredElectricBills.length === 0 ? (
          <Text style={styles.empty}>No electric bills.</Text>
        ) : (
          filteredElectricBills.map((bill) => (
            <View key={bill.id} style={styles.billCard}>
              <View style={styles.recordRow}>
                <Text style={styles.recordMonth}>⚡ {bill.month}</Text>
                <View style={styles.billActions}>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.editBtn]}
                    onPress={() => openEditElectric(bill)}
                  >
                    <Text style={styles.actionBtnText}>✏️</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.deleteBtn]}
                    onPress={() => handleDeleteElectric(bill)}
                  >
                    <Text style={styles.actionBtnText}>🗑️</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <Text style={styles.recordSub}>
                Rate: ₱{bill.meralco_charge}/kWh
              </Text>
              {(electricBillEntries[bill.id] || []).map((entry) => (
                <View key={entry.id} style={styles.entryRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.entryName}>{entry.name}</Text>
                    <Text style={styles.entrySub}>
                      ₱{entry.total_due.toFixed(2)}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.paidBtn,
                      entry.is_paid
                        ? styles.paidBtnActive
                        : styles.unpaidBtnActive,
                    ]}
                    onPress={() =>
                      handleMarkElectricPaid(entry.id, entry.is_paid)
                    }
                  >
                    <Text style={styles.paidBtnText}>
                      {entry.is_paid ? '✅ Paid' : '⬜ Unpaid'}
                    </Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          ))
        ))}

      {activeBillTab === 'Water' &&
        (filteredWaterBills.length === 0 ? (
          <Text style={styles.empty}>No water bills.</Text>
        ) : (
          filteredWaterBills.map((bill) => (
            <View key={bill.id} style={styles.billCard}>
              <View style={styles.recordRow}>
                <Text style={styles.recordMonth}>💧 {bill.month}</Text>
                <View style={styles.billActions}>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.editBtn]}
                    onPress={() => openEditWater(bill)}
                  >
                    <Text style={styles.actionBtnText}>✏️</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.deleteBtn]}
                    onPress={() => handleDeleteWater(bill)}
                  >
                    <Text style={styles.actionBtnText}>🗑️</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <Text style={styles.recordSub}>
                Total: ₱{bill.total_amount.toFixed(2)} · Per person: ₱
                {bill.per_person.toFixed(2)}
              </Text>
              {(waterBillEntries[bill.id] || []).map((entry) => (
                <View key={entry.id} style={styles.entryRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.entryName}>{entry.name}</Text>
                    <Text style={styles.entrySub}>
                      ₱{entry.amount.toFixed(2)}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.paidBtn,
                      entry.is_paid
                        ? styles.paidBtnActive
                        : styles.unpaidBtnActive,
                    ]}
                    onPress={() => handleMarkWaterPaid(entry.id, entry.is_paid)}
                  >
                    <Text style={styles.paidBtnText}>
                      {entry.is_paid ? '✅ Paid' : '⬜ Unpaid'}
                    </Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          ))
        ))}

      {activeBillTab === 'Rent' &&
        (filteredRentBills.length === 0 ? (
          <Text style={styles.empty}>No rent bills.</Text>
        ) : (
          filteredRentBills.map((bill) => (
            <View key={bill.month} style={styles.billCard}>
              <View style={styles.recordRow}>
                <Text style={styles.recordMonth}>🏠 {bill.month}</Text>
                <View style={styles.billActions}>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.editBtn]}
                    onPress={() => openEditRent(bill.month)}
                  >
                    <Text style={styles.actionBtnText}>✏️</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionBtn, styles.deleteBtn]}
                    onPress={() => handleDeleteRent(bill.month)}
                  >
                    <Text style={styles.actionBtnText}>🗑️</Text>
                  </TouchableOpacity>
                </View>
              </View>
              <Text style={styles.recordSub}>
                Total: ₱{bill.total_amount.toFixed(2)}
              </Text>
              {(rentBillEntries[bill.month] || []).map((entry) => (
                <View key={entry.id} style={styles.entryRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.entryName}>{entry.name}</Text>
                    <Text style={styles.entrySub}>
                      ₱{entry.amount.toFixed(2)}
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={[
                      styles.paidBtn,
                      entry.is_paid
                        ? styles.paidBtnActive
                        : styles.unpaidBtnActive,
                    ]}
                    onPress={() => handleMarkRentPaid(entry.id, entry.is_paid)}
                  >
                    <Text style={styles.paidBtnText}>
                      {entry.is_paid ? '✅ Paid' : '⬜ Unpaid'}
                    </Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          ))
        ))}
    </ScrollView>
  );

  return (
    <View style={styles.container}>
      <View style={styles.tabRow}>
        {TABS.map((tab) => (
          <TouchableOpacity
            key={tab}
            style={[styles.tab, activeTab === tab && styles.tabActive]}
            onPress={() => {
              setActiveTab(tab);
              setSelectedBoardmate(null);
            }}
          >
            <Text
              style={[
                styles.tabText,
                activeTab === tab && styles.tabTextActive,
              ]}
            >
              {tab}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.filterRow}>
        <TouchableOpacity
          style={styles.filterBtn}
          onPress={() => setShowMonthPicker(true)}
        >
          <Text style={styles.filterBtnText}>📅 {selectedMonth}</Text>
          <Text style={styles.filterArrow}>▼</Text>
        </TouchableOpacity>
      </View>

      {renderMonthPicker()}
      {renderEditElectricModal()}
      {renderEditWaterModal()}
      {renderEditRentModal()}
      {activeTab === 'By Boardmate'
        ? renderBoardmateView()
        : renderBillTypeView()}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  tabRow: {
    flexDirection: 'row',
    backgroundColor: 'white',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  tab: { flex: 1, padding: 14, alignItems: 'center' },
  tabActive: { borderBottomWidth: 2, borderBottomColor: '#2563EB' },
  tabText: { fontSize: 14, color: '#6B7280', fontWeight: '500' },
  tabTextActive: { color: '#2563EB', fontWeight: '700' },
  filterRow: {
    backgroundColor: 'white',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  filterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F9FAFB',
  },
  filterBtnText: { fontSize: 13, color: '#374151', fontWeight: '500' },
  filterArrow: { fontSize: 11, color: '#6B7280' },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  pickerModal: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    width: '80%',
    maxHeight: '60%',
  },
  pickerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 12,
  },
  pickerItem: { padding: 12, borderRadius: 8, marginBottom: 4 },
  pickerItemActive: { backgroundColor: '#EFF6FF' },
  pickerItemText: { fontSize: 14, color: '#374151' },
  pickerItemTextActive: { color: '#2563EB', fontWeight: '700' },
  editModal: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    width: '90%',
    gap: 10,
  },
  editModalTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  editLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
  editInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
    backgroundColor: 'white',
    marginBottom: 8,
  },
  editModalActions: { flexDirection: 'row', gap: 10, marginTop: 8 },
  btnCancel: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  btnCancelText: { color: '#374151', fontWeight: '600' },
  btnSave: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#2563EB',
    alignItems: 'center',
  },
  btnSaveText: { color: 'white', fontWeight: '600' },
  subTabRow: { flexDirection: 'row', gap: 8 },
  subTab: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  subTabActive: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  subTabText: { fontSize: 13, color: '#374151', fontWeight: '500' },
  subTabTextActive: { color: 'white', fontWeight: '700' },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
  },
  cardName: { fontSize: 16, fontWeight: '600', color: '#111827' },
  cardSub: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  chevron: { fontSize: 24, color: '#9CA3AF' },
  backBtn: { marginBottom: 4 },
  backText: { color: '#2563EB', fontWeight: '600', fontSize: 14 },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: '#111827' },
  billTypeLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#374151',
    marginTop: 8,
  },
  recordCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 12,
    elevation: 1,
    gap: 8,
  },
  billCard: {
    backgroundColor: 'white',
    borderRadius: 10,
    padding: 12,
    elevation: 1,
    gap: 8,
  },
  billActions: { flexDirection: 'row', gap: 6 },
  recordRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  recordMonth: { fontSize: 15, fontWeight: '600', color: '#111827' },
  recordAmount: { fontSize: 15, fontWeight: '700', color: '#2563EB' },
  recordSub: { fontSize: 13, color: '#6B7280' },
  recordActions: { flexDirection: 'row', gap: 6, flexWrap: 'wrap' },
  paidBtn: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  paidBtnActive: { backgroundColor: '#DCFCE7' },
  unpaidBtnActive: { backgroundColor: '#FEE2E2' },
  paidBtnText: { fontSize: 12, fontWeight: '600' },
  actionBtn: {
    backgroundColor: '#EFF6FF',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
  },
  pdfBtn: { backgroundColor: '#ECFDF5' },
  editBtn: { backgroundColor: '#FEF9C3' },
  deleteBtn: { backgroundColor: '#FEE2E2' },
  actionBtnText: { fontSize: 12, fontWeight: '600', color: '#374151' },
  entryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    borderTopWidth: 1,
    borderTopColor: '#F3F4F6',
  },
  entryName: { fontSize: 13, fontWeight: '600', color: '#111827' },
  entrySub: { fontSize: 13, color: '#2563EB', fontWeight: '600' },
  empty: { textAlign: 'center', color: '#9CA3AF', marginTop: 20 },
});
