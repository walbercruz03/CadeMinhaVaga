/**
 * Pin do mapa - bolota colorida com emoji usado dentro do <Marker> do
 * MapLibre (que exige uma view React como conteúdo do marcador).
 */
import { StyleSheet, Text, View } from 'react-native';

export default function MapPin({ emoji = '📍', color = '#C62828', size = 40 }) {
  return (
    <View style={styles.wrapper}>
      <View
        style={[
          styles.circle,
          { width: size, height: size, borderRadius: size / 2, backgroundColor: color },
        ]}
      >
        <Text style={[styles.emoji, { fontSize: size * 0.5 }]}>{emoji}</Text>
      </View>
      <View style={[styles.tail, { borderTopColor: color }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    alignItems: 'center',
  },
  circle: {
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#0B1B3A',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 3,
    elevation: 5,
  },
  tail: {
    width: 0,
    height: 0,
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 10,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    marginTop: -1,
  },
});
