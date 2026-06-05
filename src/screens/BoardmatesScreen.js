import { useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  Modal,
  TextInput,
  Alert,
  StyleSheet,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import {
  getAllBoardmates,
  addBoardmate,
  updateBoardmate,
  deleteBoardmate,
  restoreBoardmate,
  getAllBoardmatesIncludingInactive,
} from '../db/boardmates';
import LabeledInput from '../components/LabeledInput';

const GENDERS = ['Male', 'Female'];

export default function BoardmatesScreen() {
  const [boardmates, setBoardmates] = useState([]);
  const [showInactive, setShowInactive] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [editing, setEditing] = useState(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [name, setName] = useState('');
  const [dateStarted, setDateStarted] = useState('');
  const [mobile, setMobile] = useState('');
  const [startedKwh, setStartedKwh] = useState('');
  const [gender, setGender] = useState('Male');
  const [rentPrice, setRentPrice] = useState('');

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [showInactive])
  );

  const loadData = () => {
    if (showInactive) {
      setBoardmates(getAllBoardmatesIncludingInactive());
    } else {
      setBoardmates(getAllBoardmates());
    }
  };

  const resetForm = () => {
    setName('');
    setDateStarted('');
    setMobile('');
    setStartedKwh('');
    setGender('Male');
    setRentPrice('');
    setEditing(null);
  };

  const handleConfirmDate = (date) => {
    setDateStarted(date.toISOString().split('T')[0]);
    setShowDatePicker(false);
  };

  const openAdd = () => {
    resetForm();
    setModalVisible(true);
  };

  const openEdit = (item) => {
    setEditing(item);
    setName(item.name);
    setDateStarted(item.date_started);
    setMobile(item.mobile);
    setStartedKwh(String(item.started_kwh));
    setGender(item.gender);
    setRentPrice(item.rent_price ? String(item.rent_price) : '');
    setModalVisible(true);
  };

  const handleSave = () => {
    if (!name || !dateStarted || !mobile || !startedKwh) {
      Alert.alert('Error', 'Please fill in all required fields.');
      return;
    }
    if (editing) {
      updateBoardmate(
        editing.id,
        name,
        dateStarted,
        mobile,
        parseFloat(startedKwh),
        gender,
        rentPrice ? parseFloat(rentPrice) : null
      );
    } else {
      addBoardmate(
        name,
        dateStarted,
        mobile,
        parseFloat(startedKwh),
        gender,
        rentPrice ? parseFloat(rentPrice) : null
      );
    }
    loadData();
    setModalVisible(false);
    resetForm();
  };

  const handleDelete = (item) => {
    if (item.is_active === 0) {
      Alert.alert('Restore', `Restore ${item.name} as active boardmate?`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Restore',
          onPress: () => {
            restoreBoardmate(item.id);
            loadData();
          },
        },
      ]);
    } else {
      Alert.alert('Deactivate', `Remove ${item.name} from active boardmates?`, [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: () => {
            deleteBoardmate(item.id);
            loadData();
          },
        },
      ]);
    }
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.toggleBtn}
        onPress={() => {
          setShowInactive(!showInactive);
          loadData();
        }}
      >
        <Text style={styles.toggleText}>
          {showInactive ? '👁 Hide Former Boarders' : '👁 Show Former Boarders'}
        </Text>
      </TouchableOpacity>

      <FlatList
        data={boardmates}
        keyExtractor={(item) => String(item.id)}
        contentContainerStyle={{ padding: 16, gap: 10 }}
        ListEmptyComponent={
          <Text style={styles.empty}>No boardmates yet. Add one!</Text>
        }
        renderItem={({ item }) => (
          <View
            style={[styles.card, item.is_active === 0 && styles.inactiveCard]}
          >
            <View style={{ flex: 1 }}>
              {item.is_active === 0 && (
                <Text style={styles.formerLabel}>Former Boarder</Text>
              )}
              <Text style={styles.cardName}>{item.name}</Text>
              <Text style={styles.cardSub}>
                {item.gender} · Started: {item.date_started}
              </Text>
              <Text style={styles.cardSub}>📱 {item.mobile}</Text>
              <Text style={styles.cardSub}>
                ⚡ {item.started_kwh} kWh · 🏠 ₱{item.rent_price ?? 'N/A'}
              </Text>
            </View>
            <View style={styles.cardActions}>
              {item.is_active === 1 && (
                <TouchableOpacity onPress={() => openEdit(item)}>
                  <Ionicons name="pencil" size={20} color="#2563EB" />
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={() => handleDelete(item)}>
                <Ionicons
                  name={item.is_active === 0 ? 'refresh' : 'trash'}
                  size={20}
                  color={item.is_active === 0 ? '#16A34A' : '#DC2626'}
                />
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

      <TouchableOpacity style={styles.fab} onPress={openAdd}>
        <Ionicons name="add" size={28} color="white" />
      </TouchableOpacity>

      <DateTimePickerModal
        isVisible={showDatePicker}
        mode="date"
        onConfirm={handleConfirmDate}
        onCancel={() => setShowDatePicker(false)}
      />

      <Modal visible={modalVisible} animationType="slide" transparent>
        <View style={styles.overlay}>
          <View style={styles.modal}>
            <Text style={styles.modalTitle}>
              {editing ? 'Edit Boardmate' : 'Add Boardmate'}
            </Text>

            <LabeledInput
              label="Full Name"
              placeholder="Enter full name"
              value={name}
              onChangeText={setName}
            />

            <TouchableOpacity
              style={styles.datePicker}
              onPress={() => setShowDatePicker(true)}
            >
              <Text style={styles.labelText}>Date Started</Text>
              <Text style={styles.datePickerText}>
                📅 {dateStarted ? dateStarted : 'Select date'}
              </Text>
            </TouchableOpacity>

            <LabeledInput
              label="Mobile No"
              placeholder="Enter mobile number"
              value={mobile}
              onChangeText={setMobile}
              keyboardType="phone-pad"
            />

            <LabeledInput
              label="Starting kWh"
              placeholder="Enter starting kWh reading"
              value={startedKwh}
              onChangeText={setStartedKwh}
              keyboardType="decimal-pad"
            />

            <LabeledInput
              label="Rent Price (optional)"
              placeholder="Enter custom rent price"
              value={rentPrice}
              onChangeText={setRentPrice}
              keyboardType="decimal-pad"
            />

            <View>
              <Text style={styles.labelText}>Gender</Text>
              <View style={styles.genderRow}>
                {GENDERS.map((g) => (
                  <TouchableOpacity
                    key={g}
                    style={[
                      styles.genderBtn,
                      gender === g && styles.genderActive,
                    ]}
                    onPress={() => setGender(g)}
                  >
                    <Text style={{ color: gender === g ? 'white' : '#374151' }}>
                      {g}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.btnCancel}
                onPress={() => {
                  setModalVisible(false);
                  resetForm();
                }}
              >
                <Text style={{ color: '#374151' }}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.btnSave} onPress={handleSave}>
                <Text style={{ color: 'white' }}>Save</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  toggleBtn: {
    margin: 16,
    marginBottom: 0,
    padding: 10,
    backgroundColor: '#EFF6FF',
    borderRadius: 8,
    alignItems: 'center',
  },
  toggleText: { color: '#2563EB', fontWeight: '600', fontSize: 13 },
  empty: { textAlign: 'center', color: '#9CA3AF', marginTop: 40 },
  card: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 2,
  },
  inactiveCard: { backgroundColor: '#F3F4F6', opacity: 0.8 },
  formerLabel: {
    fontSize: 11,
    color: '#DC2626',
    fontWeight: '600',
    marginBottom: 2,
  },
  cardName: { fontSize: 16, fontWeight: '600', color: '#111827' },
  cardSub: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  cardActions: { gap: 12 },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    backgroundColor: '#2563EB',
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 4,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  modal: {
    backgroundColor: 'white',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 24,
    gap: 10,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
    marginBottom: 4,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
  },
  datePicker: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    backgroundColor: 'white',
  },
  datePickerText: { fontSize: 14, color: '#374151' },
  genderRow: { flexDirection: 'row', gap: 10 },
  genderBtn: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  genderActive: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  modalActions: { flexDirection: 'row', gap: 10, marginTop: 8 },
  btnCancel: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
  },
  btnSave: {
    flex: 1,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#2563EB',
    alignItems: 'center',
  },
  labelText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 4,
  },
});
