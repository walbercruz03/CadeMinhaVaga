/**
 * Botão grande e de alto contraste usado nas ações principais
 * ("Salvar vaga", "Ver rota") das views.
 */
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { colors } from '../theme';

export default function BigButton({
  title,
  subtitle,
  icon,
  color = colors.primary,
  onPress,
  disabled = false,
  style,
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: color },
        pressed && styles.pressed,
        disabled && styles.disabled,
        style,
      ]}
      android_ripple={{ color: 'rgba(255,255,255,0.25)' }}
    >
      {icon ? <Text style={styles.icon}>{icon}</Text> : null}
      <View style={styles.labels}>
        <Text style={styles.title}>{title}</Text>
        {subtitle ? <Text style={styles.subtitle}>{subtitle}</Text> : null}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    minHeight: 68,
    borderRadius: 18,
    paddingVertical: 14,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#0B1B3A',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
    elevation: 4,
  },
  pressed: {
    opacity: 0.85,
    transform: [{ scale: 0.99 }],
  },
  disabled: {
    opacity: 0.45,
  },
  icon: {
    fontSize: 30,
    marginRight: 14,
  },
  labels: {
    flexShrink: 1,
    alignItems: 'center',
  },
  title: {
    color: colors.white,
    fontSize: 20,
    fontWeight: '800',
    letterSpacing: 0.4,
    textAlign: 'center',
  },
  subtitle: {
    color: 'rgba(255,255,255,0.92)',
    fontSize: 13,
    marginTop: 2,
    textAlign: 'center',
  },
});