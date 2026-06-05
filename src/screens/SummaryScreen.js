import { useState, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Modal,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import {
  getSummaryByMonth,
  getSummaryByYear,
  getSummaryAllTime,
  getAvailableMonths,
  getAvailableYears,
  getBoardmateSummary,
} from '../db/summary';

const FILTERS = ['All Time', 'By Year', 'By Month'];

export default function SummaryScreen() {
  const [activeFilter, setActiveFilter] = useState('All Time');
  const [selectedMonth, setSelectedMonth] = useState(null);
  const [selectedYear, setSelectedYear] = useState(null);
  const [availableMonths, setAvailableMonths] = useState([]);
  const [availableYears, setAvailableYears] = useState([]);
  const [summary, setSummary] = useState(null);
  const [boardmateSummary, setBoardmateSummary] = useState(null);
  const [showPicker, setShowPicker] = useState(false);
  const [pickerType, setPickerType] = useState('month');

  useFocusEffect(
    useCallback(() => {
      const months = getAvailableMonths();
      const years = getAvailableYears();
      setAvailableMonths(months);
      setAvailableYears(years);
      if (months.length > 0 && !selectedMonth)
        setSelectedMonth(months[months.length - 1]);
      if (years.length > 0 && !selectedYear) setSelectedYear(years[0]);
      loadSummary();
      setBoardmateSummary(getBoardmateSummary());
    }, [activeFilter, selectedMonth, selectedYear])
  );

  const loadSummary = () => {
    if (activeFilter === 'All Time') {
      setSummary(getSummaryAllTime());
    } else if (activeFilter === 'By Year' && selectedYear) {
      setSummary(getSummaryByYear(selectedYear));
    } else if (activeFilter === 'By Month' && selectedMonth) {
      setSummary(getSummaryByMonth(selectedMonth));
    }
  };

  const getTotals = () => {
    if (!summary) return { billed: 0, collected: 0, unpaid: 0 };
    const billed =
      (summary.electric?.total_billed || 0) +
      (summary.water?.total_billed || 0) +
      (summary.rent?.total_billed || 0);
    const collected =
      (summary.electric?.total_collected || 0) +
      (summary.water?.total_collected || 0) +
      (summary.rent?.total_collected || 0);
    const unpaid =
      (summary.electric?.total_unpaid || 0) +
      (summary.water?.total_unpaid || 0) +
      (summary.rent?.total_unpaid || 0);
    return { billed, collected, unpaid };
  };

  const totals = getTotals();

  const renderPicker = () => (
    <Modal visible={showPicker} transparent animationType="fade">
      <TouchableOpacity
        style={styles.modalOverlay}
        onPress={() => setShowPicker(false)}
      >
        <View style={styles.pickerModal}>
          <Text style={styles.pickerTitle}>
            {pickerType === 'month' ? 'Select Month' : 'Select Year'}
          </Text>
          {(pickerType === 'month' ? availableMonths : availableYears).map(
            (item) => (
              <TouchableOpacity
                key={item}
                style={[
                  styles.pickerItem,
                  (pickerType === 'month' ? selectedMonth : selectedYear) ===
                    item && styles.pickerItemActive,
                ]}
                onPress={() => {
                  if (pickerType === 'month') setSelectedMonth(item);
                  else setSelectedYear(item);
                  setShowPicker(false);
                }}
              >
                <Text
                  style={[
                    styles.pickerItemText,
                    (pickerType === 'month' ? selectedMonth : selectedYear) ===
                      item && styles.pickerItemTextActive,
                  ]}
                >
                  {item}
                </Text>
              </TouchableOpacity>
            )
          )}
        </View>
      </TouchableOpacity>
    </Modal>
  );

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ padding: 16, gap: 16 }}
    >
      <Text style={styles.pageTitle}>Earnings & Summary</Text>

      {/* Filter Tabs */}
      <View style={styles.filterRow}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f}
            style={[
              styles.filterBtn,
              activeFilter === f && styles.filterBtnActive,
            ]}
            onPress={() => setActiveFilter(f)}
          >
            <Text
              style={[
                styles.filterBtnText,
                activeFilter === f && styles.filterBtnTextActive,
              ]}
            >
              {f}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Month/Year Selector */}
      {activeFilter === 'By Month' && (
        <TouchableOpacity
          style={styles.selectorBtn}
          onPress={() => {
            setPickerType('month');
            setShowPicker(true);
          }}
        >
          <Text style={styles.selectorText}>
            📅 {selectedMonth || 'Select Month'}
          </Text>
          <Text style={styles.selectorArrow}>▼</Text>
        </TouchableOpacity>
      )}
      {activeFilter === 'By Year' && (
        <TouchableOpacity
          style={styles.selectorBtn}
          onPress={() => {
            setPickerType('year');
            setShowPicker(true);
          }}
        >
          <Text style={styles.selectorText}>
            📅 {selectedYear || 'Select Year'}
          </Text>
          <Text style={styles.selectorArrow}>▼</Text>
        </TouchableOpacity>
      )}

      {/* Total Cards */}
      <View style={styles.totalCards}>
        <View style={[styles.totalCard, styles.collectedCard]}>
          <Text style={styles.totalCardLabel}>Total Collected</Text>
          <Text style={styles.totalCardAmount}>
            ₱{totals.collected.toFixed(2)}
          </Text>
        </View>
        <View style={[styles.totalCard, styles.unpaidCard]}>
          <Text style={styles.totalCardLabel}>Total Unpaid</Text>
          <Text style={styles.totalCardAmount}>
            ₱{totals.unpaid.toFixed(2)}
          </Text>
        </View>
      </View>

      <View style={[styles.totalCard, styles.billedCard]}>
        <Text style={styles.totalCardLabel}>Total Billed</Text>
        <Text style={styles.totalCardAmountLarge}>
          ₱{totals.billed.toFixed(2)}
        </Text>
        <View style={styles.progressBar}>
          <View
            style={[
              styles.progressFill,
              {
                width:
                  totals.billed > 0
                    ? `${(totals.collected / totals.billed) * 100}%`
                    : '0%',
              },
            ]}
          />
        </View>
        <Text style={styles.progressLabel}>
          {totals.billed > 0
            ? `${((totals.collected / totals.billed) * 100).toFixed(0)}% collected`
            : '0% collected'}
        </Text>
      </View>

      {/* Breakdown by Bill Type */}
      <Text style={styles.sectionTitle}>Breakdown by Bill Type</Text>

      {summary &&
        [
          { label: '⚡ Electric', data: summary.electric, color: '#2563EB' },
          { label: '💧 Water', data: summary.water, color: '#0EA5E9' },
          { label: '🏠 Rent', data: summary.rent, color: '#7C3AED' },
        ].map(({ label, data, color }) => (
          <View key={label} style={styles.breakdownCard}>
            <Text style={[styles.breakdownTitle, { color }]}>{label}</Text>
            <View style={styles.breakdownRow}>
              <View style={styles.breakdownItem}>
                <Text style={styles.breakdownLabel}>Billed</Text>
                <Text style={styles.breakdownAmount}>
                  ₱{(data?.total_billed || 0).toFixed(2)}
                </Text>
              </View>
              <View style={styles.breakdownItem}>
                <Text style={styles.breakdownLabel}>Collected</Text>
                <Text style={[styles.breakdownAmount, { color: '#16A34A' }]}>
                  ₱{(data?.total_collected || 0).toFixed(2)}
                </Text>
              </View>
              <View style={styles.breakdownItem}>
                <Text style={styles.breakdownLabel}>Unpaid</Text>
                <Text style={[styles.breakdownAmount, { color: '#DC2626' }]}>
                  ₱{(data?.total_unpaid || 0).toFixed(2)}
                </Text>
              </View>
            </View>
          </View>
        ))}

      {/* Per Boardmate Summary */}
      <Text style={styles.sectionTitle}>Per Boardmate Summary</Text>
      {boardmateSummary &&
        boardmateSummary.rent.map((bm) => {
          const electric = boardmateSummary.electric.find(
            (e) => e.name === bm.name
          );
          const water = boardmateSummary.water.find((w) => w.name === bm.name);
          const totalBilled =
            (electric?.total_billed || 0) +
            (water?.total_billed || 0) +
            (bm.total_billed || 0);
          const totalCollected =
            (electric?.total_collected || 0) +
            (water?.total_collected || 0) +
            (bm.total_collected || 0);
          return (
            <View key={bm.name} style={styles.boardmateCard}>
              <Text style={styles.boardmateName}>{bm.name}</Text>
              <View style={styles.breakdownRow}>
                <View style={styles.breakdownItem}>
                  <Text style={styles.breakdownLabel}>Billed</Text>
                  <Text style={styles.breakdownAmount}>
                    ₱{totalBilled.toFixed(2)}
                  </Text>
                </View>
                <View style={styles.breakdownItem}>
                  <Text style={styles.breakdownLabel}>Collected</Text>
                  <Text style={[styles.breakdownAmount, { color: '#16A34A' }]}>
                    ₱{totalCollected.toFixed(2)}
                  </Text>
                </View>
                <View style={styles.breakdownItem}>
                  <Text style={styles.breakdownLabel}>Unpaid</Text>
                  <Text style={[styles.breakdownAmount, { color: '#DC2626' }]}>
                    ₱{(totalBilled - totalCollected).toFixed(2)}
                  </Text>
                </View>
              </View>
            </View>
          );
        })}

      {renderPicker()}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  pageTitle: { fontSize: 22, fontWeight: '700', color: '#111827' },
  filterRow: { flexDirection: 'row', gap: 8 },
  filterBtn: {
    flex: 1,
    padding: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    alignItems: 'center',
    backgroundColor: 'white',
  },
  filterBtnActive: { backgroundColor: '#2563EB', borderColor: '#2563EB' },
  filterBtnText: { fontSize: 12, color: '#374151', fontWeight: '500' },
  filterBtnTextActive: { color: 'white', fontWeight: '700' },
  selectorBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: 'white',
  },
  selectorText: { fontSize: 14, color: '#374151', fontWeight: '500' },
  selectorArrow: { fontSize: 11, color: '#6B7280' },
  totalCards: { flexDirection: 'row', gap: 12 },
  totalCard: { flex: 1, borderRadius: 12, padding: 16, gap: 4 },
  collectedCard: { backgroundColor: '#DCFCE7' },
  unpaidCard: { backgroundColor: '#FEE2E2' },
  billedCard: { backgroundColor: 'white', elevation: 2, gap: 8 },
  totalCardLabel: { fontSize: 12, color: '#374151', fontWeight: '500' },
  totalCardAmount: { fontSize: 18, fontWeight: '700', color: '#111827' },
  totalCardAmountLarge: { fontSize: 28, fontWeight: '700', color: '#111827' },
  progressBar: {
    height: 8,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: { height: 8, backgroundColor: '#2563EB', borderRadius: 4 },
  progressLabel: { fontSize: 12, color: '#6B7280' },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: '#111827' },
  breakdownCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    gap: 10,
    elevation: 1,
  },
  breakdownTitle: { fontSize: 15, fontWeight: '700' },
  breakdownRow: { flexDirection: 'row', justifyContent: 'space-between' },
  breakdownItem: { alignItems: 'center', flex: 1 },
  breakdownLabel: { fontSize: 11, color: '#9CA3AF', marginBottom: 4 },
  breakdownAmount: { fontSize: 14, fontWeight: '600', color: '#111827' },
  boardmateCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 16,
    gap: 10,
    elevation: 1,
  },
  boardmateName: { fontSize: 15, fontWeight: '700', color: '#111827' },
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
});
