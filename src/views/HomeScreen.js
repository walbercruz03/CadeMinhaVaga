/**
 * Tela inicial - cartão de status da vaga + botões bem visíveis
 * para SALVAR VAGA e VER ROTA.
 */
import { Alert, Linking, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import parkingController, {
  formatDistance,
  useParkingState,
} from '../controllers/ParkingController';
import BigButton from './components/BigButton';
import { colors, shadows } from './theme';

/** Formata "YYYY-MM-DD HH:MM:SS" (SQLite) para "dd/mm/aaaa às HH:MM". */
function formatDate(value) {
  if (!value) return '';
  const [datePart, timePart = ''] = String(value).split(' ');
  const [year, month, day] = datePart.split('-');
  const [hour, minute] = timePart.split(':');
  if (!year || !month || !day) return String(value);
  return `${day}/${month}/${year} às ${hour ?? '--'}:${minute ?? '--'}`;
}

export default function HomeScreen({ navigation }) {
  const { currentLocation, latestSpot, distanceMeters, permissionStatus, canAskAgain, spots, error } =
    useParkingState();
  const permissionDenied = permissionStatus === 'denied';

  const confirmDelete = () => {
    Alert.alert('Excluir vaga', `Remover "${latestSpot.label}" do histórico?`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: () => parkingController.deleteSpot(latestSpot.id),
      },
    ]);
  };

  return (
    <ScrollView contentContainerStyle={styles.container} keyboardShouldPersistTaps="handled">
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>🚗 Cadê Minha Vaga?</Text>
        <Text style={styles.heroSubtitle}>
          Salve onde você estacionou e encontre seu carro em segundos.
        </Text>
      </View>

      {permissionDenied ? (
        <View style={[styles.card, styles.warningCard]}>
          <Text style={styles.cardTitle}>📍 Localização desativada</Text>
          <Text style={styles.cardText}>
            {canAskAgain
              ? 'Permita o acesso ao GPS para salvar sua vaga e calcular a rota até o carro.'
              : 'O acesso à localização foi bloqueado. Libere a permissão nas configurações do app para continuar.'}
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
          />
        </View>
      ) : null}

      {latestSpot ? (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>📍 {latestSpot.label}</Text>
          <Text style={styles.cardText}>Salva em {formatDate(latestSpot.createdAt)}</Text>
          <Text style={styles.distance}>
            {distanceMeters != null
              ? `Você está a ${formatDistance(distanceMeters)} da vaga`
              : 'Ative o GPS para ver a distância'}
          </Text>

          <BigButton
            title="VER ROTA"
            subtitle="Abrir o caminho até o carro"
            icon="🧭"
            color={colors.success}
            onPress={() => navigation.navigate('Route')}
            style={styles.spacing}
          />
          <BigButton
            title="SALVAR NOVA VAGA"
            subtitle="Estacionou em outro lugar?"
            icon="📍"
            onPress={() => navigation.navigate('SaveSpot')}
            style={styles.spacing}
          />

          <Pressable onPress={confirmDelete} hitSlop={8}>
            <Text style={styles.deleteText}>Excluir vaga salva</Text>
          </Pressable>
        </View>
      ) : (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Nenhuma vaga salva ainda</Text>
          <Text style={styles.cardText}>
            Toque no botão abaixo para registrar a localização do seu carro.
          </Text>
          <BigButton
            title="SALVAR VAGA"
            subtitle="Guarde a localização do seu carro"
            icon="📍"
            onPress={() => navigation.navigate('SaveSpot')}
            style={styles.spacing}
          />
          <BigButton
            title="VER ROTA"
            subtitle="Salve uma vaga primeiro"
            icon="🧭"
            color={colors.success}
            disabled={!latestSpot}
            onPress={() => navigation.navigate('Route')}
            style={styles.spacing}
          />
        </View>
      )}

      <View style={styles.card}>
        <Text style={styles.cardTitle}>📡 Status do GPS</Text>
        <Text style={styles.cardText}>
          {currentLocation
            ? `Posição atual: ${currentLocation.latitude.toFixed(5)}, ${currentLocation.longitude.toFixed(5)}`
            : 'Aguardando sinal de localização…'}
        </Text>
        <Text style={styles.cardText}>
          {spots.length} vaga(s) salva(s) no histórico local (SQLite).
        </Text>
      </View>

      {error ? <Text style={styles.error}>⚠️ {error}</Text> : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 16,
    paddingBottom: 32,
    gap: 14,
  },
  hero: {
    backgroundColor: colors.primary,
    borderRadius: 20,
    padding: 18,
    ...shadows.card,
  },
  heroTitle: {
    color: colors.white,
    fontSize: 22,
    fontWeight: '800',
  },
  heroSubtitle: {
    color: 'rgba(255,255,255,0.92)',
    fontSize: 14,
    marginTop: 6,
    lineHeight: 20,
  },
  card: {
    backgroundColor: colors.card,
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: colors.border,
    ...shadows.card,
  },
  warningCard: {
    borderColor: colors.warning,
    borderWidth: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: colors.text,
    marginBottom: 6,
  },
  cardText: {
    fontSize: 14,
    color: colors.muted,
    lineHeight: 20,
    marginBottom: 4,
  },
  distance: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primaryDark,
    marginVertical: 10,
  },
  spacing: {
    marginTop: 12,
  },
  deleteText: {
    marginTop: 14,
    textAlign: 'center',
    color: colors.danger,
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
  error: {
    color: colors.danger,
    textAlign: 'center',
    fontSize: 13,
  },
});