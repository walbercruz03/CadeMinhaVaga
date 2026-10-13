import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { parkingController, useParkingState } from './src/controllers/ParkingController';
import HomeScreen from './src/views/HomeScreen';
import SaveSpotScreen from './src/views/SaveSpotScreen';
import RouteScreen from './src/views/RouteScreen';
import { colors } from './src/views/theme';
import { useEffect } from 'react';

const Stack = createNativeStackNavigator();

export default function App() {
  const { isReady } = useParkingState();

  useEffect(() => {
    parkingController.init();
  }, []);

  if (!isReady) {
    return (
      <View style={styles.splash}>
        <Text style={styles.splashTitle}>🚗 Cadê Minha Vaga?</Text>
        <ActivityIndicator size="large" color={colors.white} style={styles.splashSpinner} />
        <Text style={styles.splashText}>Preparando seu banco de vagas…</Text>
      </View>
    );
  }

  return (
    <NavigationContainer>
      <StatusBar style="light" />
      <Stack.Navigator
        screenOptions={{
          headerStyle: { backgroundColor: colors.primary },
          headerTintColor: colors.white,
          headerTitleStyle: { fontWeight: '700' },
          contentStyle: { backgroundColor: colors.background },
        }}
      >
        <Stack.Screen name="Home" component={HomeScreen} options={{ title: 'Cadê Minha Vaga' }} />
        <Stack.Screen name="SaveSpot" component={SaveSpotScreen} options={{ title: 'Salvar vaga' }} />
        <Stack.Screen name="Route" component={RouteScreen} options={{ title: 'Rotas' }} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  splashTitle: {
    color: colors.white,
    fontSize: 26,
    fontWeight: '800',
    marginBottom: 16,
  },
  splashSpinner: {
    marginBottom: 12,
  },
  splashText: {
    color: colors.white,
    fontSize: 14,
    opacity: 0.9,
  },
});
