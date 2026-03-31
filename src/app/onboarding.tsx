import { router } from 'expo-router';
import { useState } from 'react';
import {
    ActivityIndicator,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View,
} from 'react-native';
import { supabase } from '../lib/supabase';

export default function Onboarding() {
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function guardar() {
    if (!username) {
      setError('El nombre de usuario es obligatorio');
      return;
    }
    if (username.length < 3) {
      setError('Debe tener al menos 3 caracteres');
      return;
    }
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error: err } = await supabase
      .from('perfiles')
      .upsert({
        user_id: user.id,
        username: username.toLowerCase().trim(),
        bio,
      }, { onConflict: 'user_id' });

    if (err) {
      setError('Error al guardar. Intenta otro nombre.');
      setLoading(false);
      return;
    }

    router.replace('/feed');
    setLoading(false);
  }

  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <Text style={styles.logo}>Xhaba</Text>
        <Text style={styles.slogan}>Tu closet inteligente</Text>
      </View>

      <View style={styles.form}>
        <Text style={styles.titulo}>¡Bienvenido! 👋</Text>
        <Text style={styles.subtitulo}>
          Elige tu nombre de usuario para continuar
        </Text>

        <Text style={styles.label}>Nombre de usuario</Text>
        <View style={styles.inputContainer}>
          <Text style={styles.arroba}>@</Text>
          <TextInput
            style={styles.input}
            placeholder="tunombre"
            placeholderTextColor="#666"
            value={username}
            onChangeText={(t) => {
              setUsername(t.replace(/\s/g, '').toLowerCase());
              setError('');
            }}
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        <Text style={styles.label}>Bio (opcional)</Text>
        <TextInput
          style={styles.inputBio}
          placeholder="Cuéntanos sobre tu estilo..."
          placeholderTextColor="#666"
          value={bio}
          onChangeText={setBio}
          multiline
        />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity
          style={[styles.btn, !username && styles.btnDesactivado]}
          onPress={guardar}
          disabled={loading || !username}
        >
          {loading ? (
            <ActivityIndicator color="#000" />
          ) : (
            <Text style={styles.btnText}>Entrar a Xhaba →</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
    padding: 24,
    justifyContent: 'center',
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  logo: {
    fontSize: 42,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 2,
  },
  slogan: {
    color: '#555',
    fontSize: 14,
    letterSpacing: 1,
    marginTop: 4,
  },
  form: {
    gap: 12,
  },
  titulo: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  subtitulo: {
    color: '#666',
    fontSize: 14,
    marginBottom: 16,
  },
  label: {
    color: '#aaa',
    fontSize: 13,
    marginBottom: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#111',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 12,
    paddingHorizontal: 14,
  },
  arroba: {
    color: '#666',
    fontSize: 16,
    marginRight: 4,
  },
  input: {
    flex: 1,
    padding: 14,
    color: '#fff',
    fontSize: 16,
  },
  inputBio: {
    backgroundColor: '#111',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 12,
    padding: 14,
    color: '#fff',
    fontSize: 14,
    minHeight: 80,
    textAlignVertical: 'top',
  },
  error: {
    color: '#FF4444',
    fontSize: 13,
  },
  btn: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  btnDesactivado: {
    backgroundColor: '#222',
  },
  btnText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 16,
  },
});