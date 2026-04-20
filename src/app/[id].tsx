import { router, useLocalSearchParams } from 'expo-router';
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

const GOLD = '#c8a96e';
const BG = '#0f0f0f';
const BORDER = '#1e1e1e';

export default function Usuario() {
  const { id: otroUserId } = useLocalSearchParams();
  const [perfil, setPerfil] = useState<any>(null);
  const [outfits, setOutfits] = useState<any[]>([]);
  const [totalLikes, setTotalLikes] = useState(0);
  const [siguiendo, setSiguiendo] = useState(false);
  const [meSignue, setMeSignue] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargarTodo();
  }, []);

  async function cargarTodo() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setUserId(user.id);

    const { data: perfilData } = await supabase
      .from('perfiles').select('*').eq('user_id', otroUserId).single();
    if (perfilData) setPerfil(perfilData);

    const { data: outfitsData } = await supabase
      .from('outfits').select('*').eq('user_id', otroUserId)
      .order('created_at', { ascending: false });
    if (outfitsData) {
      setOutfits(outfitsData);
      setTotalLikes(outfitsData.reduce((acc: number, o: any) => acc + (o.likes || 0), 0));
    }

    const { data: sigData } = await supabase
      .from('seguidores').select('*')
      .eq('follower_id', user.id).eq('following_id', otroUserId).single();
    setSiguiendo(!!sigData);

    const { data: meSigneData } = await supabase
      .from('seguidores').select('*')
      .eq('follower_id', otroUserId).eq('following_id', user.id).single();
    setMeSignue(!!meSigneData);

    setCargando(false);
  }

  async function toggleSeguir() {
    if (!userId) return;
    if (siguiendo) {
      await supabase.from('seguidores').delete()
        .eq('follower_id', userId).eq('following_id', otroUserId);
      setSiguiendo(false);
    } else {
      await supabase.from('seguidores').insert({ follower_id: userId, following_id: otroUserId });
      setSiguiendo(true);
    }
  }

  function renderOutfit({ item }: any) {
    return (
      <View style={styles.gridItem}>
        {item.imagen_url ? (
          <Image source={{ uri: item.imagen_url }} style={styles.gridImagen} resizeMode="cover" />
        ) : (
          <View style={styles.gridPlaceholder}>
            <Text style={styles.placeholderText}>👕</Text>
          </View>
        )}
        <View style={styles.gridOverlay}>
          <Text style={styles.gridLikes}>♥ {item.likes || 0}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.btnBack}>
          <Text style={styles.btnBackText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.titulo}>perfil</Text>
        <View style={{ width: 36 }} />
      </View>

      {cargando ? (
        <ActivityIndicator color={GOLD} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={outfits}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderOutfit}
          numColumns={3}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
          ListHeaderComponent={
            <View style={styles.perfil}>
              {/* Avatar */}
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {(perfil?.username || 'U')[0].toUpperCase()}
                </Text>
              </View>

              <Text style={styles.username}>@{perfil?.username || 'usuario'}</Text>
              {perfil?.bio ? <Text style={styles.bio}>{perfil.bio}</Text> : null}

              {/* Stats */}
              <View style={styles.stats}>
                <View style={styles.stat}>
                  <Text style={styles.statNum}>{outfits.length}</Text>
                  <Text style={styles.statLabel}>outfits</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.stat}>
                  <Text style={styles.statNum}>{totalLikes}</Text>
                  <Text style={styles.statLabel}>likes</Text>
                </View>
              </View>

              {/* Botones */}
              <View style={styles.botones}>
                <TouchableOpacity
                  style={[styles.btnSeguir, siguiendo && styles.btnSiguiendo]}
                  onPress={toggleSeguir}
                >
                  <Text style={[styles.btnSeguirText, siguiendo && styles.btnSiguiendoText]}>
                    {siguiendo ? '✓ siguiendo' : '+ seguir'}
                  </Text>
                </TouchableOpacity>

                {siguiendo && meSignue && (
                  <TouchableOpacity
                    style={styles.btnMensaje}
                    onPress={() => router.push({
                      pathname: '/mensajes',
                      params: { userId: otroUserId, username: perfil?.username }
                    })}
                  >
                    <Text style={styles.btnMensajeText}>✉ mensaje</Text>
                  </TouchableOpacity>
                )}
              </View>

              {siguiendo && !meSignue && (
                <Text style={styles.noSigneMsg}>
                  cuando te siga de vuelta podrán enviarse mensajes
                </Text>
              )}

              <View style={styles.gridHeader}>
                <Text style={styles.gridHeaderText}>outfits</Text>
              </View>
            </View>
          }
          ListEmptyComponent={
            <Text style={styles.vacio}>sin outfits publicados</Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: BG },
  header: {
    flexDirection:   'row',
    justifyContent:  'space-between',
    alignItems:      'center',
    paddingHorizontal: 20,
    paddingTop:      52,
    paddingBottom:   14,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  btnBack:         { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
  btnBackText:     { color: GOLD, fontSize: 22 },
  titulo: {
    color:           '#fff',
    fontSize:        15,
    fontWeight:      '700',
    letterSpacing:   1,
  },
  perfil: {
    alignItems:      'center',
    paddingVertical: 28,
    gap:             10,
  },
  avatar: {
    width:           80,
    height:          80,
    borderRadius:    40,
    backgroundColor: '#1a1a1a',
    borderWidth:     2,
    borderColor:     GOLD,
    justifyContent:  'center',
    alignItems:      'center',
    marginBottom:    4,
  },
  avatarText:      { color: GOLD, fontSize: 30, fontWeight: 'bold' },
  username:        { color: '#fff', fontSize: 17, fontWeight: '700', letterSpacing: 0.5 },
  bio:             { color: '#444', fontSize: 13, textAlign: 'center', paddingHorizontal: 40 },
  stats: {
    flexDirection:   'row',
    gap:             32,
    alignItems:      'center',
    marginTop:       4,
  },
  stat:            { alignItems: 'center', gap: 2 },
  statNum:         { color: '#fff', fontSize: 20, fontWeight: '800' },
  statLabel:       { color: '#333', fontSize: 11, letterSpacing: 0.5 },
  statDivider:     { width: 1, height: 30, backgroundColor: BORDER },
  botones: {
    flexDirection:   'row',
    gap:             10,
    marginTop:       4,
  },
  btnSeguir: {
    borderWidth:     1,
    borderColor:     '#2a2a2a',
    borderRadius:    20,
    paddingVertical: 8,
    paddingHorizontal: 24,
  },
  btnSiguiendo: {
    backgroundColor: 'rgba(200,169,110,0.1)',
    borderColor:     GOLD,
  },
  btnSeguirText:   { color: '#555', fontWeight: '600', fontSize: 13 },
  btnSiguiendoText: { color: GOLD },
  btnMensaje: {
    backgroundColor: '#161616',
    borderWidth:     1,
    borderColor:     BORDER,
    borderRadius:    20,
    paddingVertical: 8,
    paddingHorizontal: 20,
  },
  btnMensajeText:  { color: '#fff', fontSize: 13 },
  noSigneMsg:      { color: '#2a2a2a', fontSize: 11, textAlign: 'center', paddingHorizontal: 40 },
  gridHeader: {
    width:           '100%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth:  1,
    borderTopColor:  BORDER,
    marginTop:       8,
  },
  gridHeaderText:  { color: '#2a2a2a', fontSize: 11, letterSpacing: 1.5 },
  gridItem: {
    width:           '33.33%',
    aspectRatio:     1,
    padding:         1,
    position:        'relative',
  },
  gridImagen:      { width: '100%', height: '100%' },
  gridPlaceholder: {
    width:           '100%',
    height:          '100%',
    backgroundColor: '#111',
    justifyContent:  'center',
    alignItems:      'center',
  },
  placeholderText: { fontSize: 28 },
  gridOverlay: {
    position:        'absolute',
    bottom:          4,
    left:            4,
  },
  gridLikes:       { color: '#fff', fontSize: 11, fontWeight: '700' },
  vacio:           { color: '#333', textAlign: 'center', marginTop: 60, fontSize: 14 },
});