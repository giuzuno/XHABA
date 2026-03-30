import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { supabase } from '../lib/supabase';

export default function Perfil() {
  const [usuario, setUsuario] = useState<any>(null);
  const [outfits, setOutfits] = useState<any[]>([]);
  const [totalLikes, setTotalLikes] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [editando, setEditando] = useState(false);
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState('');

  useEffect(() => {
    cargarPerfil();
  }, []);

  async function cargarPerfil() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setUsuario(user);

    const { data: perfilData } = await supabase
      .from('perfiles')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (perfilData) {
      setUsername(perfilData.username || '');
      setBio(perfilData.bio || '');
    }

    const { data } = await supabase
      .from('outfits')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (data) {
      setOutfits(data);
      const likes = data.reduce((acc: number, o: any) => acc + (o.likes || 0), 0);
      setTotalLikes(likes);
    }
    setCargando(false);
  }

  async function guardar() {
    if (!username) {
      setMensaje('El nombre es obligatorio');
      return;
    }
    setGuardando(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase.from('perfiles').upsert({
      user_id: user.id,
      username,
      bio,
    }, { onConflict: 'user_id' });

    setMensaje('¡Guardado!');
    setEditando(false);
    setMensaje('');
    setGuardando(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace('/');
  }

  function renderOutfit({ item }: any) {
    return (
      <View style={styles.gridItem}>
        {item.imagen_url ? (
          <Image
            source={{ uri: item.imagen_url }}
            style={styles.gridImagen}
            resizeMode="cover"
          />
        ) : (
          <View style={styles.gridPlaceholder}>
            <Text style={styles.placeholderText}>👕</Text>
          </View>
        )}
        <Text style={styles.gridLikes}>❤️ {item.likes || 0}</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace('/feed')}>
          <Text style={styles.back}>← Feed</Text>
        </TouchableOpacity>
        <Text style={styles.titulo}>Mi perfil</Text>
        <TouchableOpacity onPress={() => setEditando(!editando)}>
          <Text style={styles.editar}>{editando ? 'Cancelar' : 'Editar'}</Text>
        </TouchableOpacity>
      </View>

      {cargando ? (
        <ActivityIndicator color="#fff" style={{ marginTop: 40 }} />
      ) : (
        <>
          <View style={styles.perfil}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>👤</Text>
            </View>
            {editando ? (
              <View style={styles.formEditar}>
                <TextInput
                  style={styles.input}
                  placeholder="@tunombre"
                  placeholderTextColor="#666"
                  value={username}
                  onChangeText={setUsername}
                  autoCapitalize="none"
                />
                <TextInput
                  style={styles.input}
                  placeholder="Tu bio..."
                  placeholderTextColor="#666"
                  value={bio}
                  onChangeText={setBio}
                />
                {mensaje ? <Text style={styles.mensaje}>{mensaje}</Text> : null}
                <TouchableOpacity style={styles.btnGuardar} onPress={guardar} disabled={guardando}>
                  {guardando ? <ActivityIndicator color="#000" /> : <Text style={styles.btnGuardarText}>Guardar</Text>}
                </TouchableOpacity>
              </View>
            ) : (
              <>
                <Text style={styles.usernameText}>{username || usuario?.email}</Text>
                {bio ? <Text style={styles.bioText}>{bio}</Text> : null}
                <View style={styles.stats}>
                  <View style={styles.stat}>
                    <Text style={styles.statNum}>{outfits.length}</Text>
                    <Text style={styles.statLabel}>Outfits</Text>
                  </View>
                  <View style={styles.stat}>
                    <Text style={styles.statNum}>{totalLikes}</Text>
                    <Text style={styles.statLabel}>Likes</Text>
                  </View>
                </View>
              </>
            )}
          </View>

          <FlatList
            data={outfits}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderOutfit}
            numColumns={3}
            columnWrapperStyle={{ flexWrap: 'wrap' }}
            contentContainerStyle={{ paddingBottom: 40 }}
            ListEmptyComponent={
              <Text style={styles.vacio}>Aún no has publicado outfits 👕</Text>
            }
          />
        </>
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
  editar: {
    color: '#fff',
    fontSize: 14,
  },
  perfil: {
    alignItems: 'center',
    paddingVertical: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#222',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 36,
  },
  usernameText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  bioText: {
    color: '#aaa',
    fontSize: 14,
    marginBottom: 16,
    textAlign: 'center',
    paddingHorizontal: 40,
  },
  formEditar: {
    width: '80%',
    gap: 10,
  },
  input: {
    backgroundColor: '#111',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 12,
    padding: 12,
    color: '#fff',
    fontSize: 14,
  },
  mensaje: {
    color: '#4CAF50',
    textAlign: 'center',
    fontSize: 13,
  },
  btnGuardar: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  btnGuardarText: {
    color: '#000',
    fontWeight: 'bold',
  },
  stats: {
    flexDirection: 'row',
    gap: 40,
    marginTop: 12,
  },
  stat: {
    alignItems: 'center',
  },
  statNum: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
  },
  statLabel: {
    color: '#555',
    fontSize: 12,
    marginTop: 2,
  },
  gridItem: {
    width: '32%',
    height: 150,
    margin: '0.5%',
  },
  gridImagen: {
    width: '100%',
    height: '100%',
    borderRadius: 4,
  },
  gridPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#111',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 32,
  },
  gridLikes: {
    position: 'absolute',
    bottom: 4,
    left: 4,
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  vacio: {
    color: '#555',
    textAlign: 'center',
    marginTop: 60,
    fontSize: 16,
  },
});