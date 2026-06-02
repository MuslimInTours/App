import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { Pressable, StyleSheet, Text, TextInput, View } from 'react-native';

import { Card } from '../components/Card';
import { Screen } from '../components/Screen';
import {
  startPasswordRecoverySession,
  updateRecoveredPassword,
} from '../services/passwordRecoveryService';
import { colors } from '../theme/colors';
import { useThemedStyles } from '../theme/ThemeProvider';
import { radius } from '../theme/radius';
import { spacing } from '../theme/spacing';

type PasswordResetScreenProps = {
  onDone: () => void;
};

export function PasswordResetScreen({ onDone }: PasswordResetScreenProps) {
  useStyles();

  const [confirmPassword, setConfirmPassword] = useState('');
  const [isInitializing, setIsInitializing] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>('Vérification du lien de récupération...');
  const [password, setPassword] = useState('');
  const [sessionReady, setSessionReady] = useState(false);

  useEffect(() => {
    startPasswordRecoverySession()
      .then(() => {
        setSessionReady(true);
        setMessage('Choisis un nouveau mot de passe pour ton accès admin.');
      })
      .catch(() => {
        setSessionReady(false);
        setMessage('Lien invalide ou expiré. Renvoie un nouveau lien depuis Supabase.');
      })
      .finally(() => setIsInitializing(false));
  }, []);

  const savePassword = async () => {
    const trimmedPassword = password.trim();

    if (trimmedPassword.length < 8) {
      setMessage('Le mot de passe doit contenir au moins 8 caractères.');
      return;
    }
    if (trimmedPassword !== confirmPassword.trim()) {
      setMessage('Les deux mots de passe ne correspondent pas.');
      return;
    }

    setIsSaving(true);
    setMessage(null);

    try {
      await updateRecoveredPassword(trimmedPassword);
      setPassword('');
      setConfirmPassword('');
      setMessage('Mot de passe mis à jour. Tu peux ouvrir l’administration.');
      setSessionReady(false);
    } catch {
      setMessage('Impossible de mettre à jour le mot de passe. Renvoie un nouveau lien.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Screen
      headerIcon="key"
      title="Nouveau mot de passe"
      subtitle="Réinitialisation sécurisée de l’accès administrateur."
    >
      <Card>
        <View style={styles.headerRow}>
          <View style={styles.iconCircle}>
            <Ionicons color={colors.primary} name="lock-closed" size={24} />
          </View>
          <View style={styles.headerCopy}>
            <Text style={styles.cardTitle}>Accès admin</Text>
            <Text style={styles.cardText}>
              Cette page fonctionne uniquement depuis un lien de récupération Supabase valide.
            </Text>
          </View>
        </View>

        {sessionReady ? (
          <>
            <TextInput
              onChangeText={setPassword}
              placeholder="Nouveau mot de passe"
              placeholderTextColor={colors.muted}
              secureTextEntry
              style={styles.input}
              value={password}
            />
            <TextInput
              onChangeText={setConfirmPassword}
              placeholder="Confirmer le mot de passe"
              placeholderTextColor={colors.muted}
              secureTextEntry
              style={styles.input}
              value={confirmPassword}
            />
            <Pressable disabled={isSaving} onPress={savePassword} style={styles.primaryButton}>
              <Text style={styles.primaryButtonText}>
                {isSaving ? 'Enregistrement...' : 'Enregistrer le mot de passe'}
              </Text>
            </Pressable>
          </>
        ) : null}

        {!isInitializing ? (
          <Pressable onPress={onDone} style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>Ouvrir l’administration</Text>
          </Pressable>
        ) : null}
      </Card>

      {message ? <Text style={styles.message}>{message}</Text> : null}
    </Screen>
  );
}

const createStyles = () =>
  StyleSheet.create({
    cardText: {
      color: colors.muted,
      fontSize: 14,
      lineHeight: 20,
      marginTop: spacing.xs,
    },
    cardTitle: {
      color: colors.text,
      fontSize: 20,
      fontWeight: '900',
    },
    headerCopy: {
      flex: 1,
    },
    headerRow: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: spacing.md,
    },
    iconCircle: {
      alignItems: 'center',
      backgroundColor: colors.primarySoft,
      borderRadius: radius.pill,
      height: 54,
      justifyContent: 'center',
      width: 54,
    },
    input: {
      backgroundColor: colors.surface,
      borderColor: colors.border,
      borderRadius: radius.md,
      borderWidth: 1,
      color: colors.text,
      fontSize: 15,
      fontWeight: '700',
      marginTop: spacing.md,
      paddingHorizontal: spacing.md,
      paddingVertical: 13,
    },
    message: {
      color: colors.textInverse,
      fontSize: 13,
      fontWeight: '800',
      lineHeight: 19,
      marginTop: spacing.md,
      textAlign: 'center',
    },
    primaryButton: {
      alignItems: 'center',
      backgroundColor: colors.primary,
      borderRadius: radius.pill,
      marginTop: spacing.lg,
      paddingVertical: spacing.md,
    },
    primaryButtonText: {
      color: colors.textInverse,
      fontSize: 15,
      fontWeight: '900',
    },
    secondaryButton: {
      alignItems: 'center',
      borderColor: colors.borderStrong,
      borderRadius: radius.pill,
      borderWidth: 1,
      marginTop: spacing.sm,
      paddingVertical: spacing.md,
    },
    secondaryButtonText: {
      color: colors.accentSoft,
      fontSize: 14,
      fontWeight: '900',
    },
  });

let styles = createStyles();

function useStyles() {
  styles = useThemedStyles(createStyles);
}
