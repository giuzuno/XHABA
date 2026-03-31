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
import { supabase } from '../lib/supabase';

export default function Index() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

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

    async function handleLogin() {
  setLoading(true);
  setMessage('');
  const { data, error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    setMessage(error.message);
  } else if (data.session) {
    router.replace('/feed');
  }
  setLoading(false);

  }

async function handleRegister() {
  setLoading(true);
  setMessage('');
  const { data, error } = await supabase.auth.signUp({ email, password });
  if (error) {
    setMessage(error.message);
    setLoading(false);
    return;
  }
  if (data.user) {
    router.replace('/onboarding');
  } else {
    setMessage('¡Revisa tu correo para confirmar tu cuenta!');
  }
  setLoading(false);
}

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>Xhaba</Text>
      <Text style={styles.slogan}>Tu closet inteligente</Text>

      <TextInput
        style={styles.input}
        placeholder="Correo electrónico"
        placeholderTextColor="#666"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <TextInput
        style={styles.input}
        placeholder="Contraseña"
        placeholderTextColor="#666"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      {message ? <Text style={styles.message}>{message}</Text> : null}

      <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
        {loading ? (
          <ActivityIndicator color="#000" />
        ) : (
          <Text style={styles.buttonText}>Entrar</Text>
        )}
      </TouchableOpacity>

      <TouchableOpacity style={styles.buttonOutline} onPress={handleRegister} disabled={loading}>
        <Text style={styles.buttonOutlineText}>Crear cuenta</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  logo: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 2,
    marginBottom: 8,
  },
  slogan: {
    fontSize: 16,
    color: '#AAAAAA',
    letterSpacing: 1,
    marginBottom: 48,
  },
  input: {
    width: '100%',
    backgroundColor: '#111111',
    borderWidth: 1,
    borderColor: '#333333',
    borderRadius: 12,
    padding: 16,
    color: '#FFFFFF',
    fontSize: 16,
    marginBottom: 16,
  },
  button: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonText: {
    color: '#000000',
    fontSize: 16,
    fontWeight: 'bold',
  },
  buttonOutline: {
    width: '100%',
    borderWidth: 1,
    borderColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  buttonOutlineText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  message: {
    color: '#FF4444',
    marginBottom: 16,
    textAlign: 'center',
  },
});
