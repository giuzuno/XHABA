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
        stroke={color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
      />
      <Path
        d="M3 16C3 17 4 18 5 18H19C20 18 21 17 21 16"
        stroke={color} strokeWidth="1.5" strokeLinecap="round"
      />
    </Svg>
  );
}

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmar, setConfirmar] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState<'error' | 'success'>('error');
  const [listo, setListo] = useState(false);

  useEffect(() => {
    // Supabase maneja el token automáticamente desde la URL
    supabase.auth.onAuthStateChange(async (event) => {
      if (event === 'PASSWORD_RECOVERY') {
        // Usuario autenticado con el token del email
        setListo(true);
      }
    });
  }, []);

  async function handleReset() {
    if (!password) return showMessage('Ingresa tu nueva contraseña');
    if (password.length < 6) return showMessage('Mínimo 6 caracteres');
    if (password !== confirmar) return showMessage('Las contraseñas no coinciden');

    setLoading(true);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      showMessage(error.message);
    } else {
      showMessage('¡Contraseña actualizada!', 'success');
      setTimeout(() => router.replace('/feed'), 2000);
    }
    setLoading(false);
  }

  function showMessage(text: string, type: 'error' | 'success' = 'error') {
    setMessage(text);
    setMessageType(type);
  }

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <HangerSVG size={48} color={GOLD} />
        <Text style={styles.logo}>
          xhab<Text style={{ color: GOLD }}>a</Text>
        </Text>
      </View>

      <Text style={styles.titulo}>nueva contraseña</Text>
      <Text style={styles.subtitulo}>elige una contraseña segura para tu cuenta</Text>

      <View style={styles.form}>
        <TextInput
          style={styles.input}
          placeholder="nueva contraseña"
          placeholderTextColor="#333"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <TextInput
          style={styles.input}
          placeholder="confirmar contraseña"
          placeholderTextColor="#333"
          value={confirmar}
          onChangeText={setConfirmar}
          secureTextEntry
        />

        {message ? (
          <Text style={[styles.message, messageType === 'success' && styles.messageSuccess]}>
            {message}
          </Text>
        ) : null}

        <TouchableOpacity
          style={[styles.button, (!password || !confirmar) && styles.buttonDisabled]}
          onPress={handleReset}
          disabled={loading || !password || !confirmar}
        >
          {loading
            ? <ActivityIndicator color="#000" />
            : <Text style={styles.buttonText}>actualizar contraseña</Text>
          }
        </TouchableOpacity>

        <TouchableOpacity style={styles.linkBtn} onPress={() => router.replace('/')}>
          <Text style={styles.linkText}>← volver al inicio</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: BG,
    alignItems: 'center', justifyContent: 'center', padding: 24,
  },
  logoContainer: {
    flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 32,
  },
  logo: {
    fontSize: 42, fontWeight: '800', color: '#fff', letterSpacing: 3, fontStyle: 'italic',
  },
  titulo: {
    color: '#fff', fontSize: 20, fontWeight: '700', letterSpacing: 1, marginBottom: 8,
  },
  subtitulo: {
    color: '#333', fontSize: 13, letterSpacing: 0.5, marginBottom: 32, textAlign: 'center',
  },
  form:            { width: '100%', gap: 12 },
  input: {
    width: '100%', backgroundColor: '#111', borderWidth: 1, borderColor: BORDER,
    borderRadius: 12, padding: 16, color: '#fff', fontSize: 15,
  },
  message:         { color: '#ff4444', fontSize: 13, textAlign: 'center' },
  messageSuccess:  { color: '#4caf50' },
  button: {
    width: '100%', backgroundColor: GOLD, borderRadius: 12,
    padding: 16, alignItems: 'center',
  },
  buttonDisabled:  { backgroundColor: '#1a1a1a' },
  buttonText:      { color: '#000', fontSize: 15, fontWeight: '700', letterSpacing: 0.5 },
  linkBtn:         { alignItems: 'center', paddingVertical: 4 },
  linkText:        { color: '#444', fontSize: 13 },
});