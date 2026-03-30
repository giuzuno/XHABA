import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
    ActivityIndicator,
    FlatList,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';
import { supabase } from '../lib/supabase';

export default function Perfil() {
  const [usuario, setUsuario] = useState<any>(null);
  const [outfits, setOutfits] = useState<any[]>([]);
  const [totalLikes, setTotalLikes] = useState(0);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargarPerfil();
  }, []);

  async function cargarPerfil() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setUsuario(user);

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
        <TouchableOpacity onPress={handleLogout}>
          <Text style={styles.salir}>Salir</Text>
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
            <Text style={styles.email}>{usuario?.email}</Text>
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
          </View>

          <FlatList
            data={outfits}
            keyExtractor={(item) => item.id.toString()}
            renderItem={renderOutfit}
            numColumns={3} columnWrapperStyle={{ flexWrap: 'wrap' }}
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
  salir: {
    color: '#555',
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
  email: {
    color: '#aaa',
    fontSize: 14,
    marginBottom: 20,
  },
  stats: {
    flexDirection: 'row',
    gap: 40,
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