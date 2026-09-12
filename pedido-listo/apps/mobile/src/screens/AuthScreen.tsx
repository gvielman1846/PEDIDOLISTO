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
import { colors } from '../theme';

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
  onSignOut,
}: Props) {
  const [mode, setMode] = useState<'signin' | 'signup'>(
    legacyBusinessName ? 'signup' : 'signin'
  );
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
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.emoji}>🍲</Text>
        <Text style={styles.title}>
          {pendingEmail
            ? 'Falta crear tu cocina'
            : legacyBusinessName
              ? `Protege ${legacyBusinessName}`
              : 'PedidoListo Cocina'}
        </Text>
        <Text style={styles.subtitle}>
          {pendingEmail
            ? `Tu cuenta ${pendingEmail} ya existe pero todavia no tiene un negocio. Completa los datos para terminar, o pide la invitacion al dueno.`
            : legacyBusinessName
              ? 'Crea una cuenta para conservar esta cocina y abrirla desde cualquier telefono.'
              : mode === 'signin'
                ? 'Entra con tu correo. Si te invitaron, usa el mismo correo de la invitacion.'
                : 'Crea tu cuenta. Si eres el dueno, llena los datos del negocio. Si te invitaron, dejalo vacio.'}
        </Text>

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
              placeholder="tu@correo.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
            />

            <Text style={styles.label}>Contraseña</Text>
            <TextInput
              style={styles.input}
              value={password}
              onChangeText={setPassword}
              placeholder="Minimo 8 caracteres"
              secureTextEntry
              autoCapitalize="none"
              autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
            />
          </>
        )}

        {needsBusiness && (
          <>
            <Text style={styles.section}>Datos de tu negocio</Text>
            <Text style={styles.hint}>
              Solo el dueno llena esto. El equipo entra despues con una invitacion.
            </Text>
            <Text style={styles.label}>Nombre de la cocina</Text>
            <TextInput
              style={styles.input}
              value={businessName}
              onChangeText={setBusinessName}
              placeholder="Ej. Cocina de Maria"
            />
            <Text style={styles.label}>Link del catalogo</Text>
            <TextInput
              style={styles.input}
              value={slug}
              onChangeText={setSlug}
              placeholder="cocina-de-maria"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <Text style={styles.label}>WhatsApp del negocio</Text>
            <TextInput
              style={styles.input}
              value={whatsapp}
              onChangeText={setWhatsapp}
              placeholder="5512345678"
              keyboardType="phone-pad"
            />
            <Text style={styles.label}>Colonia / direccion</Text>
            <TextInput
              style={styles.input}
              value={address}
              onChangeText={setAddress}
              placeholder="Alta California, Tlajomulco"
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
                ? 'Crear mi cocina'
                : mode === 'signin'
                  ? 'Entrar'
                  : legacyBusinessName
                    ? 'Proteger mi cocina'
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
  scroll: { padding: 24, paddingTop: 48, paddingBottom: 48 },
  emoji: { fontSize: 46, textAlign: 'center' },
  title: { fontSize: 24, fontWeight: '800', color: colors.text, textAlign: 'center', marginTop: 10 },
  subtitle: { fontSize: 14, color: colors.muted, textAlign: 'center', marginTop: 8, marginBottom: 22, lineHeight: 20 },
  tabs: { flexDirection: 'row', backgroundColor: colors.surface, borderRadius: 12, padding: 4, marginBottom: 12 },
  tab: { flex: 1, padding: 10, borderRadius: 9, alignItems: 'center' },
  tabActive: { backgroundColor: colors.accentSoft },
  tabText: { color: colors.muted, fontWeight: '700' },
  tabTextActive: { color: colors.accentDark },
  section: { fontSize: 16, fontWeight: '800', color: colors.text, marginTop: 22 },
  label: { fontSize: 13, fontWeight: '600', color: colors.muted, marginBottom: 6, marginTop: 13 },
  input: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    fontSize: 16,
    color: colors.text,
  },
  error: { color: colors.danger, fontSize: 13, lineHeight: 18, marginTop: 14 },
  notice: { color: colors.accentDark, fontSize: 12, lineHeight: 18, marginTop: 12 },
  hint: { fontSize: 12, color: colors.muted, marginTop: 6, lineHeight: 18 },
  button: { backgroundColor: colors.accent, borderRadius: 14, padding: 16, alignItems: 'center', marginTop: 24 },
  buttonDisabled: { opacity: 0.65 },
  buttonText: { color: 'white', fontSize: 16, fontWeight: '800' },
  linkButton: { padding: 14, alignItems: 'center', marginTop: 4 },
  linkText: { color: colors.muted, fontSize: 14, fontWeight: '700' },
});
