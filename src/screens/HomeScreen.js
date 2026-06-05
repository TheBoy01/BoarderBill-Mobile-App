import { useEffect, useRef, useCallback } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Animated,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useState } from 'react';
import db from '../db/database';

const getCurrentMonth = () => {
  const now = new Date();
  return (
    now.toLocaleString('default', { month: 'long' }) + ' ' + now.getFullYear()
  );
};

export default function HomeScreen({ navigation }) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const [stats, setStats] = useState({
    totalBoarders: 0,
    totalPaidThisMonth: 0,
    totalUnpaidThisMonth: 0,
    totalBilledThisMonth: 0,
  });

  useFocusEffect(
    useCallback(() => {
      loadStats();
    }, [])
  );

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const loadStats = () => {
    const month = getCurrentMonth();
    const totalBoarders = db.getFirstSync(
      'SELECT COUNT(*) as count FROM boardmates WHERE is_active = 1'
    );

    const electricPaid = db.getFirstSync(
      `
      SELECT COALESCE(SUM(ebe.total_due), 0) as total
      FROM electric_bill_entries ebe
      JOIN electric_bills eb ON eb.id = ebe.bill_id
      WHERE eb.month = ? AND ebe.is_paid = 1
    `,
      [month]
    );

    const waterPaid = db.getFirstSync(
      `
      SELECT COALESCE(SUM(wbe.amount), 0) as total
      FROM water_bill_entries wbe
      JOIN water_bills wb ON wb.id = wbe.water_bill_id
      WHERE wb.month = ? AND wbe.is_paid = 1
    `,
      [month]
    );

    const rentPaid = db.getFirstSync(
      `
      SELECT COALESCE(SUM(amount), 0) as total
      FROM rent_bill_entries
      WHERE month = ? AND is_paid = 1
    `,
      [month]
    );

    const electricUnpaid = db.getFirstSync(
      `
      SELECT COALESCE(SUM(ebe.total_due), 0) as total
      FROM electric_bill_entries ebe
      JOIN electric_bills eb ON eb.id = ebe.bill_id
      WHERE eb.month = ? AND ebe.is_paid = 0
    `,
      [month]
    );

    const waterUnpaid = db.getFirstSync(
      `
      SELECT COALESCE(SUM(wbe.amount), 0) as total
      FROM water_bill_entries wbe
      JOIN water_bills wb ON wb.id = wbe.water_bill_id
      WHERE wb.month = ? AND wbe.is_paid = 0
    `,
      [month]
    );

    const rentUnpaid = db.getFirstSync(
      `
      SELECT COALESCE(SUM(amount), 0) as total
      FROM rent_bill_entries
      WHERE month = ? AND is_paid = 0
    `,
      [month]
    );

    const totalPaid =
      (electricPaid?.total || 0) +
      (waterPaid?.total || 0) +
      (rentPaid?.total || 0);

    const totalUnpaid =
      (electricUnpaid?.total || 0) +
      (waterUnpaid?.total || 0) +
      (rentUnpaid?.total || 0);

    setStats({
      totalBoarders: totalBoarders?.count || 0,
      totalPaidThisMonth: totalPaid,
      totalUnpaidThisMonth: totalUnpaid,
      totalBilledThisMonth: totalPaid + totalUnpaid,
    });
  };

  const MENUS = [
    {
      title: 'Manage Boarders',
      icon: '👥',
      color: '#EFF6FF',
      border: '#BFDBFE',
      items: [{ label: 'Boarders', icon: '👤', screen: 'Boardmates' }],
    },
    {
      title: 'Manage Bills',
      icon: '🧾',
      color: '#FFFBEB',
      border: '#FDE68A',
      items: [
        { label: 'Electricity', icon: '⚡', screen: 'Electric' },
        { label: 'Water', icon: '💧', screen: 'Water' },
        { label: 'Rent', icon: '🏠', screen: 'Rent' },
      ],
    },
    {
      title: 'Records & Earnings',
      icon: '📊',
      color: '#F0FDF4',
      border: '#BBF7D0',
      items: [
        { label: 'Records', icon: '📋', screen: 'Records' },
        { label: 'Summary', icon: '📈', screen: 'Summary' },
      ],
    },
    {
      title: 'Manage Data',
      icon: '💾',
      color: '#F9FAFB',
      border: '#E5E7EB',
      items: [{ label: 'Backup & Restore', icon: '☁️', screen: 'Backup' }],
    },
  ];

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      {/* Hero */}
      <Animated.View
        style={[
          styles.hero,
          { opacity: fadeAnim, transform: [{ translateY: slideAnim }] },
        ]}
      >
        <View style={styles.logoContainer}>
          <Text style={styles.logoEmoji}>🏠</Text>
        </View>
        <Text style={styles.appName}>Bobet BoarderBillApp</Text>
        <Text style={styles.tagline}>
          Now you can digitally save all your boarders bill easy!
        </Text>
      </Animated.View>

      {/* Dashboard Stats */}
      <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
        <Text style={styles.sectionLabel}>📅 {getCurrentMonth()}</Text>
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: '#EFF6FF' }]}>
            <Text style={styles.statIcon}>👥</Text>
            <Text style={styles.statNumber}>{stats.totalBoarders}</Text>
            <Text style={styles.statLabel}>Active Boarders</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#DCFCE7' }]}>
            <Text style={styles.statIcon}>✅</Text>
            <Text style={styles.statNumber}>
              ₱{stats.totalPaidThisMonth.toFixed(0)}
            </Text>
            <Text style={styles.statLabel}>
              Collected for the month of{'\n'}
              {getCurrentMonth()}
            </Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#FEE2E2' }]}>
            <Text style={styles.statIcon}>⏳</Text>
            <Text style={styles.statNumber}>
              ₱{stats.totalUnpaidThisMonth.toFixed(0)}
            </Text>
            <Text style={styles.statLabel}>Unpaid </Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: '#FFFBEB' }]}>
            <Text style={styles.statIcon}>🧾</Text>
            <Text style={styles.statNumber}>
              ₱{stats.totalBilledThisMonth.toFixed(0)}
            </Text>
            <Text style={styles.statLabel}>Total Billed</Text>
          </View>
        </View>
      </Animated.View>

      {/* Menus */}
      <Animated.View style={[styles.section, { opacity: fadeAnim }]}>
        <Text style={styles.sectionLabel}>Menu</Text>
        {MENUS.map((menu) => (
          <View
            key={menu.title}
            style={[
              styles.menuGroup,
              { backgroundColor: menu.color, borderColor: menu.border },
            ]}
          >
            <Text style={styles.menuGroupTitle}>
              {menu.icon} {menu.title}
            </Text>
            {menu.items.map((item) => (
              <TouchableOpacity
                key={item.screen}
                style={styles.menuItem}
                onPress={() => navigation.navigate(item.screen)}
                activeOpacity={0.7}
              >
                <Text style={styles.menuItemIcon}>{item.icon}</Text>
                <Text style={styles.menuItemLabel}>{item.label}</Text>
                <Text style={styles.menuItemArrow}>›</Text>
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </Animated.View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F9FAFB' },
  hero: {
    alignItems: 'center',
    paddingVertical: 32,
    paddingHorizontal: 20,
    gap: 8,
    backgroundColor: '#2563EB',
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 20,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  logoEmoji: { fontSize: 40 },
  appName: {
    fontSize: 20,
    fontWeight: '800',
    color: 'white',
    textAlign: 'center',
  },
  tagline: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
    lineHeight: 20,
  },
  section: { padding: 16, gap: 12 },
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6B7280',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  statsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  statCard: {
    width: '47%',
    borderRadius: 12,
    padding: 14,
    gap: 4,
    elevation: 1,
  },
  statIcon: { fontSize: 22 },
  statNumber: { fontSize: 18, fontWeight: '700', color: '#111827' },
  statLabel: { fontSize: 12, color: '#6B7280' },
  menuGroup: {
    borderRadius: 14,
    borderWidth: 1.5,
    overflow: 'hidden',
    marginBottom: 12,
  },
  menuGroupTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#111827',
    padding: 14,
    paddingBottom: 8,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.06)',
    gap: 12,
  },
  menuItemIcon: { fontSize: 20, width: 28 },
  menuItemLabel: { flex: 1, fontSize: 14, color: '#374151', fontWeight: '500' },
  menuItemArrow: { fontSize: 20, color: '#9CA3AF' },
});
