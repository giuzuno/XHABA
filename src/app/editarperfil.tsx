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

export default function EditarPerfil() {
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [loading, setLoading] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [mensaje, setMensaje] = useState('');

  useEffect(() => {
    cargarPerfil();
  }, []);

  async function cargarPerfil() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('perfiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (data) {
      setUsername(data.username || '');
      setBio(data.bio || '');
    }
    setCargando(false);
  }

  async function guardar() {
    if (!username) {
      setMensaje('El nombre de usuario es obligatorio');
      return;
    }
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('perfiles')
      .upsert({
        user_id: user.id,
        username,
        bio,
      }, { onConflict: 'user_id' });

    if (error) {
      setMensaje('Error al guardar');
    } else {
      setMensaje('¡Perfil actualizado!');
      setTimeout(() => router.replace('/perfil'), 1000);
    }
    setLoading(false);
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace('/perfil')}>
          <Text style={styles.back}>← Perfil</Text>
        </TouchableOpacity>
        <Text style={styles.titulo}>Editar perfil</Text>
        <View style={{ width: 60 }} />
      </View>

      {cargando ? (
        <ActivityIndicator color="#fff" style={{ marginTop: 40 }} />
      ) : (
        <View style={styles.form}>
          <Text style={styles.label}>Nombre de usuario</Text>
          <TextInput
            style={styles.input}
            placeholder="@tunombre"
            placeholderTextColor="#666"
            value={username}
            onChangeText={setUsername}
            autoCapitalize="none"
          />

          <Text style={styles.label}>Bio</Text>
          <TextInput
            style={[styles.input, styles.inputBio]}
            placeholder="Cuéntanos sobre tu estilo..."
            placeholderTextColor="#666"
            value={bio}
            onChangeText={setBio}
            multiline
          />

          {mensaje ? (
            <Text style={styles.mensaje}>{mensaje}</Text>
          ) : null}

          <TouchableOpacity
            style={styles.btnGuardar}
            onPress={guardar}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={styles.btnGuardarText}>Guardar</Text>
            )}
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  back: {
    color: '#fff',
    fontSize: 14,
  },
  titulo: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  form: {
    padding: 24,
    gap: 8,
  },
  label: {
    color: '#aaa',
    fontSize: 13,
    marginBottom: 4,
    marginTop: 12,
  },
  input: {
    backgroundColor: '#111',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 12,
    padding: 14,
    color: '#fff',
    fontSize: 16,
  },
  inputBio: {
    minHeight: 100,
    textAlignVertical: 'top',
  },
  mensaje: {
    color: '#4CAF50',
    textAlign: 'center',
    marginTop: 12,
    fontSize: 14,
  },
  btnGuardar: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    marginTop: 24,
  },
  btnGuardarText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 16,
  },
});