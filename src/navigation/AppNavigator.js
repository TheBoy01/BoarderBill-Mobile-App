import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';

import HomeScreen from '../screens/HomeScreen';
import BoardmatesScreen from '../screens/BoardmatesScreen';
import ElectricBillScreen from '../screens/ElectricBillScreen';
import WaterBillScreen from '../screens/WaterBillScreen';
import RentBillScreen from '../screens/RentBillScreen';
import RecordsScreen from '../screens/RecordsScreen';
import BackupScreen from '../screens/BackupScreen';
import SummaryScreen from '../screens/SummaryScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: '#2563EB' },
          headerTintColor: 'white',
          headerTitleStyle: { fontWeight: '700' },
          headerBackTitle: '',
        }}
      >
        <Stack.Screen
          name="Home"
          component={HomeScreen}
          options={{ headerShown: false }}
        />
        <Stack.Screen
          name="Boardmates"
          component={BoardmatesScreen}
          options={{ title: 'Manage Boardmates' }}
        />
        <Stack.Screen
          name="Electric"
          component={ElectricBillScreen}
          options={{ title: 'Electric Bill' }}
        />
        <Stack.Screen
          name="Water"
          component={WaterBillScreen}
          options={{ title: 'Water Bill' }}
        />
        <Stack.Screen
          name="Rent"
          component={RentBillScreen}
          options={{ title: 'Rent Bill' }}
        />
        <Stack.Screen
          name="Records"
          component={RecordsScreen}
          options={{ title: 'Records' }}
        />
        <Stack.Screen
          name="Summary"
          component={SummaryScreen}
          options={{ title: 'Earnings & Summary' }}
        />
        <Stack.Screen
          name="Backup"
          component={BackupScreen}
          options={{ title: 'Backup & Restore' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
