import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, gradients } from '../theme';

export interface SignUpData {
  email: string;
  password: string;
  businessName: string;
  slug: string;
  whatsapp: string;
  address: string;
}

interface Props {
  legacyBusinessName?: string;
  pendingEmail?: string | null;
  loading: boolean;
  error: string | null;
  notice?: string | null;
  onSignIn: (email: string, password: string) => void;
  onSignUp: (data: SignUpData) => void;
  onForgotPassword: (email: string) => void;
  onSignOut: () => void;
}

export function AuthScreen({
  legacyBusinessName,
  pendingEmail,
  loading,
  error,
  notice,
  onSignIn,
  onSignUp,
  onForgotPassword,
  onSignOut,
}: Props) {
  const [mode, setMode] = useState<'signin' | 'signup'>(
    legacyBusinessName ? 'signup' : 'signin'
  );
  const insets = useSafeAreaInsets();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [slug, setSlug] = useState('');
  const [whatsapp, setWhatsapp] = useState('');
  const [address, setAddress] = useState('');

  function submit() {
    if (pendingEmail) {
      onSignUp({ email: pendingEmail, password: '', businessName, slug, whatsapp, address });
      return;
    }
    if (mode === 'signin') {
      onSignIn(email.trim(), password);
      return;
    }
    onSignUp({ email: email.trim(), password, businessName, slug, whatsapp, address });
  }

  const needsBusiness = Boolean(pendingEmail) || (mode === 'signup' && !legacyBusinessName);

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.scroll,
          { paddingTop: insets.top + 32, paddingBottom: insets.bottom + 48 },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <LinearGradient colors={gradients.subtle} style={styles.intro}>
          <View style={styles.logoMark}>
            <Text style={styles.logoText}>P</Text>
          </View>
          <Text style={styles.kicker}>TU NEGOCIO, EN MOVIMIENTO</Text>
          <Text style={styles.title}>
            {pendingEmail
              ? 'Falta crear tu negocio'
              : legacyBusinessName
                ? `Protege ${legacyBusinessName}`
                : 'PedidoListo'}
          </Text>
          <Text style={styles.subtitle}>
            {pendingEmail
              ? `Tu cuenta ${pendingEmail} ya existe pero todavia no tiene un negocio. Completa los datos para terminar, o pide la invitacion al dueno.`
              : legacyBusinessName
                ? 'Crea una cuenta para conservar este negocio y abrirlo desde cualquier telefono.'
                : mode === 'signin'
                  ? 'Entra con tu correo y tu contraseña. Si te invitaron, usa el mismo correo de la invitacion.'
                  : 'Crea tu cuenta. Te enviaremos un correo con un link para activarla y elegir tu contraseña.'}
          </Text>
        </LinearGradient>

        {!pendingEmail && (
          <>
            <View style={styles.tabs}>
              <TouchableOpacity
                style={[styles.tab, mode === 'signin' && styles.tabActive]}
                onPress={() => setMode('signin')}
              >
                <Text style={[styles.tabText, mode === 'signin' && styles.tabTextActive]}>
                  Iniciar sesion
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.tab, mode === 'signup' && styles.tabActive]}
                onPress={() => setMode('signup')}
              >
                <Text style={[styles.tabText, mode === 'signup' && styles.tabTextActive]}>
                  Crear cuenta
                </Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.label}>Correo</Text>
            <TextInput
              style={styles.input}
              value={email}
              onChangeText={setEmail}
              placeholder="Ej. maria.lopez@gmail.com"
              placeholderTextColor={colors.muted}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
            />

            {mode === 'signin' ? (
              <>
                <Text style={styles.label}>Contraseña</Text>
                <TextInput
                  style={styles.input}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Ej. minimo 8 caracteres"
                  placeholderTextColor={colors.muted}
                  secureTextEntry
                  autoCapitalize="none"
                  autoComplete="current-password"
                />
                <TouchableOpacity
                  style={styles.forgotButton}
                  onPress={() => onForgotPassword(email.trim())}
                  disabled={loading}
                >
                  <Text style={styles.forgotText}>¿Olvidaste tu contraseña?</Text>
                </TouchableOpacity>
              </>
            ) : (
              <Text style={styles.hint}>
                No pongas contraseña aqui. Despues de crear la cuenta, el link del correo te deja activarla y elegirla.
              </Text>
            )}
          </>
        )}

        {needsBusiness && (
          <>
            <Text style={styles.section}>Datos de tu negocio</Text>
            <Text style={styles.hint}>
              Solo el dueno llena esto. El equipo entra despues con una invitacion.
            </Text>
            <Text style={styles.label}>Nombre del negocio</Text>
            <TextInput
              style={styles.input}
              value={businessName}
              onChangeText={setBusinessName}
              placeholder="Ej. Taqueria El Guero"
              placeholderTextColor={colors.muted}
            />
            <Text style={styles.label}>Link del catalogo</Text>
            <TextInput
              style={styles.input}
              value={slug}
              onChangeText={setSlug}
              placeholder="Ej. taqueria-el-guero"
              placeholderTextColor={colors.muted}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Text style={styles.label}>WhatsApp del negocio</Text>
            <TextInput
              style={styles.input}
              value={whatsapp}
              onChangeText={setWhatsapp}
              placeholder="Ej. 3312345678"
              placeholderTextColor={colors.muted}
              keyboardType="phone-pad"
            />
            <Text style={styles.label}>Colonia / direccion</Text>
            <TextInput
              style={styles.input}
              value={address}
              onChangeText={setAddress}
              placeholder="Ej. Alta California Residencial, Tlajomulco"
              placeholderTextColor={colors.muted}
            />
          </>
        )}

        {error && <Text style={styles.error}>{error}</Text>}
        {notice && <Text style={styles.notice}>{notice}</Text>}

        <TouchableOpacity
          style={[styles.button, loading && styles.buttonDisabled]}
          onPress={submit}
          disabled={loading}
        >
          <Text style={styles.buttonText}>
            {loading
              ? 'Procesando...'
              : pendingEmail
                ? 'Crear mi negocio'
                : mode === 'signin'
                  ? 'Entrar'
                  : legacyBusinessName
                    ? 'Proteger mi negocio'
                    : 'Crear cuenta'}
          </Text>
        </TouchableOpacity>

        {pendingEmail && (
          <TouchableOpacity style={styles.linkButton} onPress={onSignOut} disabled={loading}>
            <Text style={styles.linkText}>Usar otra cuenta</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  scroll: { padding: 20 },
  intro: {
    borderRadius: 28,
    paddingHorizontal: 24,
    paddingVertical: 28,
    alignItems: 'center',
    marginBottom: 18,
    borderWidth: 1,
    borderColor: colors.border,
  },
  logoMark: {
    width: 58,
    height: 58,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.accent,
    transform: [{ rotate: '-7deg' }],
  },
  logoText: { fontSize: 30, fontWeight: '900', color: colors.onAccent },
  kicker: { fontSize: 10, letterSpacing: 2, fontWeight: '900', color: colors.accentDark, marginTop: 20 },
  title: { fontSize: 30, lineHeight: 35, fontWeight: '900', color: colors.text, textAlign: 'center', marginTop: 8 },
  subtitle: { fontSize: 14, color: colors.muted, textAlign: 'center', marginTop: 10, lineHeight: 20 },
  tabs: { flexDirection: 'row', backgroundColor: colors.surface, borderRadius: 16, padding: 4, marginBottom: 12, borderWidth: 1, borderColor: colors.border },
  tab: { flex: 1, padding: 11, borderRadius: 12, alignItems: 'center' },
  tabActive: { backgroundColor: colors.accentSoft },
  tabText: { color: colors.muted, fontWeight: '700' },
  tabTextActive: { color: colors.accentDark },
  section: { fontSize: 20, fontWeight: '900', color: colors.text, marginTop: 24 },
  label: { fontSize: 12, fontWeight: '800', color: colors.textSoft, marginBottom: 7, marginTop: 14, letterSpacing: 0.2 },
  input: {
    backgroundColor: colors.input,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 16,
    padding: 15,
    fontSize: 16,
    color: colors.text,
  },
  error: { color: colors.danger, fontSize: 13, lineHeight: 18, marginTop: 14 },
  notice: { color: colors.success, fontSize: 12, lineHeight: 18, marginTop: 12 },
  hint: { fontSize: 12, color: colors.muted, marginTop: 6, lineHeight: 18 },
  forgotButton: { alignSelf: 'flex-start', paddingVertical: 10 },
  forgotText: { color: colors.accentDark, fontSize: 14, fontWeight: '700' },
  button: { backgroundColor: colors.accent, borderRadius: 16, padding: 17, alignItems: 'center', marginTop: 24 },
  buttonDisabled: { opacity: 0.65 },
  buttonText: { color: colors.onAccent, fontSize: 16, fontWeight: '900' },
  linkButton: { padding: 14, alignItems: 'center', marginTop: 4 },
  linkText: { color: colors.muted, fontSize: 14, fontWeight: '700' },
});
