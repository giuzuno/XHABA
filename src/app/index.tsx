import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { supabase } from '../lib/supabase';

const GOLD = '#c8a96e';
const BG = '#0f0f0f';
const BORDER = '#1e1e1e';

function HangerSVG({ size = 40, color = '#c8a96e' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 3C10.9 3 10 3.9 10 5C10 5.74 10.4 6.38 11 6.73V8L3 14H21L13 8V6.73C13.6 6.38 14 5.74 14 5C14 3.9 13.1 3 12 3Z"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M3 16C3 17 4 18 5 18H19C20 18 21 17 21 16"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </Svg>
  );
}

type Modo = 'login' | 'registro' | 'recuperar';

export default function Index() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingGoogle, setLoadingGoogle] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'error' | 'success'>('error');
  const [modo, setModo] = useState<Modo>('login');

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) router.replace('/feed');
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (_event === 'SIGNED_IN') router.replace('/feed');
      if (_event === 'SIGNED_OUT') router.replace('/');
    });

    return () => subscription.unsubscribe();
  }, []);

  function showMessage(text: string, type: 'error' | 'success' = 'error') {
    setMessage(text);
    setMessageType(type);
  }

  async function handleLogin() {
    if (!email || !password) return showMessage('Completa todos los campos');
    setLoading(true);
    setMessage('');
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) showMessage(error.message);
    else if (data.session) router.replace('/feed');
    setLoading(false);
  }

  async function handleRegister() {
    if (!email || !password) return showMessage('Completa todos los campos');
    if (password.length < 6) return showMessage('La contraseña debe tener al menos 6 caracteres');
    setLoading(true);
    setMessage('');
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      showMessage(error.message);
    } else if (data.user) {
      router.replace('/onboarding');
    } else {
      showMessage('¡Revisa tu correo para confirmar tu cuenta!', 'success');
    }
    setLoading(false);
  }

  async function handleRecuperar() {
    if (!email) return showMessage('Ingresa tu correo primero');
    setLoading(true);
    setMessage('');
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'https://xhaba.vercel.app/reset-password',
    });
    if (error) {
      showMessage(error.message);
    } else {
      showMessage('¡Revisa tu correo! Te enviamos un link para restablecer tu contraseña.', 'success');
    }
    setLoading(false);
  }

  async function handleGoogle() {
    setLoadingGoogle(true);
    setMessage('');
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: typeof window !== 'undefined'
          ? `${window.location.origin}/feed`
          : 'https://xhaba.vercel.app/feed',
      },
    });
    if (error) showMessage(error.message);
    setLoadingGoogle(false);
  }

  return (
    <View style={styles.container}>
      {/* Logo */}
      <View style={styles.logoContainer}>
        <HangerSVG size={48} color={GOLD} />
        <Text style={styles.logo}>
          xhab<Text style={{ color: GOLD }}>a</Text>
        </Text>
      </View>
      <Text style={styles.slogan}>tu closet inteligente</Text>

      {/* Tabs */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, modo === 'login' && styles.tabActivo]}
          onPress={() => { setModo('login'); setMessage(''); }}
        >
          <Text style={[styles.tabText, modo === 'login' && styles.tabTextoActivo]}>entrar</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, modo === 'registro' && styles.tabActivo]}
          onPress={() => { setModo('registro'); setMessage(''); }}
        >
          <Text style={[styles.tabText, modo === 'registro' && styles.tabTextoActivo]}>registro</Text>
        </TouchableOpacity>
      </View>

      {/* Formulario */}
      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="correo electrónico"
          placeholderTextColor="#333"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
        />

        {modo !== 'recuperar' && (
          <TextInput
            style={styles.input}
            placeholder="contraseña"
            placeholderTextColor="#333"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        )}

        {message ? (
          <Text style={[styles.message, messageType === 'success' && styles.messageSuccess]}>
            {message}
          </Text>
        ) : null}

        {modo === 'login' && (
          <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
            {loading
              ? <ActivityIndicator color="#000" />
              : <Text style={styles.buttonText}>entrar</Text>
            }
          </TouchableOpacity>
        )}

        {modo === 'registro' && (
          <TouchableOpacity style={styles.button} onPress={handleRegister} disabled={loading}>
            {loading
              ? <ActivityIndicator color="#000" />
              : <Text style={styles.buttonText}>crear cuenta</Text>
            }
          </TouchableOpacity>
        )}

        {modo === 'recuperar' && (
          <TouchableOpacity style={styles.button} onPress={handleRecuperar} disabled={loading}>
            {loading
              ? <ActivityIndicator color="#000" />
              : <Text style={styles.buttonText}>enviar link</Text>
            }
          </TouchableOpacity>
        )}

        {modo === 'login' && (
          <TouchableOpacity
            style={styles.linkBtn}
            onPress={() => { setModo('recuperar'); setMessage(''); }}
          >
            <Text style={styles.linkText}>¿olvidaste tu contraseña?</Text>
          </TouchableOpacity>
        )}

        {modo === 'recuperar' && (
          <TouchableOpacity
            style={styles.linkBtn}
            onPress={() => { setModo('login'); setMessage(''); }}
          >
            <Text style={styles.linkText}>← volver al login</Text>
          </TouchableOpacity>
        )}

        {/* Divisor */}
        <View style={styles.divisor}>
          <View style={styles.divisorLinea} />
          <Text style={styles.divisorTexto}>o</Text>
          <View style={styles.divisorLinea} />
        </View>

        {/* Google */}
        <TouchableOpacity
          style={styles.googleBtn}
          onPress={handleGoogle}
          disabled={loadingGoogle}
        >
          {loadingGoogle ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Text style={styles.googleIcon}>G</Text>
              <Text style={styles.googleText}>continuar con Google</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 8,
  },
  logo: {
    fontSize: 42,
    fontWeight: '800',
    color: '#fff',
    letterSpacing: 3,
    fontStyle: 'italic',
  },
  slogan: {
    fontSize: 13,
    color: '#333',
    letterSpacing: 2,
    marginBottom: 40,
  },
  tabs: {
    flexDirection: 'row',
    backgroundColor: '#111',
    borderRadius: 12,
    padding: 4,
    marginBottom: 24,
    width: '100%',
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  tabActivo:       { backgroundColor: GOLD },
  tabText: {
    color: '#333',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  tabTextoActivo:  { color: '#000' },
  form:            { width: '100%', gap: 12 },
  input: {
    width: '100%',
    backgroundColor: '#111',
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    padding: 16,
    color: '#fff',
    fontSize: 15,
  },
  message:         { color: '#ff4444', fontSize: 13, textAlign: 'center' },
  messageSuccess:  { color: '#4caf50' },
  button: {
    width: '100%',
    backgroundColor: GOLD,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  buttonText: {
    color: '#000',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  linkBtn:         { alignItems: 'center', paddingVertical: 4 },
  linkText:        { color: '#444', fontSize: 13, letterSpacing: 0.3 },
  divisor: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginVertical: 4,
  },
  divisorLinea:    { flex: 1, height: 1, backgroundColor: BORDER },
  divisorTexto:    { color: '#333', fontSize: 12 },
  googleBtn: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  googleIcon: {
    color: '#000',
    fontSize: 18,
    fontWeight: '800',
  },
  googleText: {
    color: '#000',
    fontSize: 14,
    fontWeight: '600',
  },
});