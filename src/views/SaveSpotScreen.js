/**
 * Tela de salvar vaga - mapa centrado no usuário, marcador ajustável
 * (toque no mapa) e botão gigante "SALVAR VAGA".
 */
import { useEffect, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Linking,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import MapView, { Marker } from 'react-native-maps';

import parkingController, { useParkingState } from '../controllers/ParkingController';
import LocationController from '../controllers/LocationController';
import BigButton from './components/BigButton';
import { colors, shadows } from './theme';

export default function SaveSpotScreen({ navigation }) {
  const { currentLocation, permissionStatus, canAskAgain, loading, latestSpot, error } = useParkingState();
  const [label, setLabel] = useState('Minha vaga');
  const [marker, setMarker] = useState(currentLocation);
  const [markerTouched, setMarkerTouched] = useState(false);
  const [locating, setLocating] = useState(false);
  const mapRef = useRef(null);

  // Ao receber a primeira posição, centraliza o mapa (se o usuário não mexeu).
  useEffect(() => {
    if (!currentLocation || markerTouched || marker) return;
    setMarker(currentLocation);
    mapRef.current?.animateToRegion(LocationController.buildRegion(currentLocation), 400);
  }, [currentLocation, markerTouched, marker]);

  const handleMapPress = (event) => {
    setMarker(event.nativeEvent.coordinate);
    setMarkerTouched(true);
  };

  const useMyLocation = async () => {
    setLocating(true);
    try {
      const coord = await parkingController.refreshLocation();
      if (coord) {
        setMarker(coord);
        setMarkerTouched(false);
        mapRef.current?.animateToRegion(LocationController.buildRegion(coord), 400);
        return;
      }
      // Falhou: mostra o motivo exato vindo do controller (permissão, GPS, provedor...)
      const denied = permissionStatus !== 'granted';
      Alert.alert(
        denied ? 'Localização bloqueada' : 'Não consegui ler o GPS',
        denied
          ? 'Libere a permissão de localização para usar este recurso (botão abaixo ou Ajustes do app).'
          : `${error ?? 'A posição atual não está disponível.'}\n\nDicas:\n• Ative a localização do aparelho (Modo Alta precisão).\n• Emulador Android: Extended Controls (⋯) → Location → defina um ponto.\n• Simulador iOS: Features → Location.`
      );
    } finally {
      setLocating(false);
    }
  };

  const handleSave = async () => {
    try {
      const spot = await parkingController.saveSpot(label, marker);
      Alert.alert('Vaga salva! 🅿️', `"${spot.label}" foi registrada com sucesso.`, [
        { text: 'OK', onPress: () => navigation.navigate('Home') },
      ]);
    } catch (error) {
      Alert.alert('Ops', error?.message ?? 'Não foi possível salvar a vaga.');
    }
  };

  const permissionDenied = permissionStatus === 'denied';

  return (
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <MapView
        ref={mapRef}
        style={styles.map}
        initialRegion={LocationController.buildRegion(currentLocation) ?? undefined}
        onPress={handleMapPress}
        showsUserLocation={permissionStatus === 'granted'}
        showsMyLocationButton={false}
      >
        {marker ? (
          <Marker
            coordinate={marker}
            title="Sua vaga"
            description={label || 'Minha vaga'}
            draggable
            onDragEnd={(e) => {
              setMarker(e.nativeEvent.coordinate);
              setMarkerTouched(true);
            }}
          />
        ) : null}
      </MapView>

      <View style={styles.panel}>
        <Text style={styles.panelTitle}>Onde você estacionou?</Text>
        <Text style={styles.hint}>
          Toque no mapa (ou arraste o marcador) para ajustar o ponto exato da vaga.
        </Text>

        {permissionDenied ? (
          <View style={styles.deniedBox}>
            <Text style={styles.deniedText}>
              {canAskAgain
                ? 'Localização bloqueada. Toque no botão abaixo para permitir o acesso ao GPS.'
                : 'Localização bloqueada. Libere a permissão nas configurações do aparelho para continuar.'}
            </Text>
            {canAskAgain ? (
              <BigButton
                title="PERMITIR LOCALIZAÇÃO"
                icon="✅"
                color={colors.warning}
                onPress={() => parkingController.requestAccess()}
              />
            ) : null}
            <BigButton
              title="ABRIR AJUSTES DO APARELHO"
              icon="⚙️"
              color={colors.primaryDark}
              onPress={() => Linking.openSettings().catch(() => null)}
              style={styles.secondaryButton}
            />
          </View>
        ) : null}

        <TextInput
          style={styles.input}
          value={label}
          onChangeText={setLabel}
          placeholder='Ex.: "Shopping P3 - 2º andar"'
          placeholderTextColor={colors.muted}
          maxLength={60}
          returnKeyType="done"
        />

        <BigButton
          title="📍 SALVAR VAGA"
          subtitle={marker ? 'Registra a localização do seu carro' : 'Aguardando o GPS…'}
          onPress={handleSave}
          disabled={!marker || loading}
          style={styles.saveButton}
        />

        <BigButton
          title={locating ? '⏳ LOCALIZANDO…' : 'USAR MINHA LOCALIZAÇÃO ATUAL'}
          icon="🎯"
          color={colors.primaryDark}
          onPress={useMyLocation}
          disabled={locating}
          style={styles.secondaryButton}
        />

        {latestSpot ? (
          <BigButton
            title="VER ROTA PARA A ÚLTIMA VAGA"
            icon="🧭"
            color={colors.success}
            onPress={() => navigation.navigate('Route')}
            style={styles.secondaryButton}
          />
        ) : null}
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
    backgroundColor: colors.background,
  },
  map: {
    flex: 1,
  },
  panel: {
    backgroundColor: colors.card,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 18,
    paddingBottom: 28,
    borderTopWidth: 1,
    borderColor: colors.border,
    gap: 10,
    ...shadows.card,
  },
  panelTitle: {
    fontSize: 19,
    fontWeight: '800',
    color: colors.text,
    textAlign: 'center',
  },
  hint: {
    fontSize: 13,
    color: colors.muted,
    textAlign: 'center',
    marginBottom: 4,
  },
  deniedBox: {
    gap: 10,
  },
  deniedText: {
    fontSize: 13,
    color: colors.danger,
    textAlign: 'center',
  },
  input: {
    borderWidth: 2,
    borderColor: colors.border,
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
    color: colors.text,
    backgroundColor: colors.background,
  },
  saveButton: {
    marginTop: 4,
  },
  secondaryButton: {
    minHeight: 56,
  },
});