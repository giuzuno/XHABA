import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { supabase } from '../lib/supabase';

const GOLD = '#c8a96e';
const BG = '#0f0f0f';
const BORDER = '#1e1e1e';

export default function Perfil() {
  const [usuario, setUsuario] = useState<any>(null);
  const [outfits, setOutfits] = useState<any[]>([]);
  const [totalLikes, setTotalLikes] = useState(0);
  const [seguidores, setSeguidores] = useState(0);
  const [siguiendo, setSiguiendo] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [editando, setEditando] = useState(false);
  const [username, setUsername] = useState('');
  const [bio, setBio] = useState('');
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarLocal, setAvatarLocal] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [subiendo, setSubiendo] = useState(false);
  const [mensaje, setMensaje] = useState('');

  useEffect(() => {
    cargarPerfil();
  }, []);

  async function cargarPerfil() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    setUsuario(user);

    const { data: perfilData } = await supabase
      .from('perfiles').select('*').eq('user_id', user.id).single();

    if (perfilData) {
      setUsername(perfilData.username || '');
      setBio(perfilData.bio || '');
      setAvatarUrl(perfilData.avatar_url || null);
    }

    const { data } = await supabase
      .from('outfits').select('*').eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (data) {
      setOutfits(data);
      setTotalLikes(data.reduce((acc: number, o: any) => acc + (o.likes || 0), 0));
    }

    const { count: countSeg } = await supabase
      .from('seguidores').select('*', { count: 'exact', head: true })
      .eq('following_id', user.id);
    setSeguidores(countSeg || 0);

    const { count: countSig } = await supabase
      .from('seguidores').select('*', { count: 'exact', head: true })
      .eq('follower_id', user.id);
    setSiguiendo(countSig || 0);

    setCargando(false);
  }

  async function seleccionarAvatar() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (!file) return;

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Mostrar preview local inmediatamente
      const localUrl = URL.createObjectURL(file);
      setAvatarLocal(localUrl);
      setSubiendo(true);

      try {
        const fileName = `avatars/${user.id}_${Date.now()}.jpg`;
        const { error } = await supabase.storage
          .from('outfits')
          .upload(fileName, file, { contentType: file.type, upsert: true });

        if (error) {
          console.log('Error subiendo:', error);
          setSubiendo(false);
          return;
        }

        const { data: urlData } = supabase.storage
          .from('outfits').getPublicUrl(fileName);
        const url = urlData.publicUrl;

        setAvatarUrl(url);
        setAvatarLocal(null);

        await supabase.from('perfiles').upsert({
          user_id: user.id, username, bio, avatar_url: url,
        }, { onConflict: 'user_id' });

        setMensaje('¡Foto actualizada!');
        setTimeout(() => setMensaje(''), 2000);
      } catch (err) {
        console.log('Error:', err);
      }
      setSubiendo(false);
    };
    input.click();
  }

  async function guardar() {
    if (!username) { setMensaje('El nombre es obligatorio'); return; }
    setGuardando(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    await supabase.from('perfiles').upsert({
      user_id: user.id, username, bio, avatar_url: avatarUrl,
    }, { onConflict: 'user_id' });
    setMensaje('¡Guardado!');
    setTimeout(() => setMensaje(''), 2000);
    setEditando(false);
    setGuardando(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace('/');
  }

  function renderAvatar() {
    const src = avatarLocal || avatarUrl;
    if (src) {
      return (
        <img
          src={src}
          style={{
            width: 90,
            height: 90,
            borderRadius: 45,
            objectFit: 'cover',
            display: 'block',
            border: `2px solid ${GOLD}`,
          }}
        />
      );
    }
    return (
      <View style={styles.avatarPlaceholder}>
        <Text style={styles.avatarLetra}>
          {username ? username[0].toUpperCase() : '?'}
        </Text>
      </View>
    );
  }

  function renderOutfit({ item }: any) {
    return (
      <View style={styles.gridItem}>
        {item.imagen_url ? (
          <img
            src={item.imagen_url}
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
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
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace('/feed')}>
          <Text style={styles.back}>←</Text>
        </TouchableOpacity>
        <Text style={styles.titulo}>mi perfil</Text>
        <TouchableOpacity onPress={() => { setEditando(!editando); setMensaje(''); }}>
          <Text style={styles.editar}>{editando ? 'cancelar' : 'editar'}</Text>
        </TouchableOpacity>
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
              <TouchableOpacity onPress={seleccionarAvatar} style={styles.avatarWrap}>
                {subiendo ? (
                  <View style={styles.avatarPlaceholder}>
                    <ActivityIndicator color={GOLD} />
                  </View>
                ) : renderAvatar()}
                <View style={styles.avatarEditBadge}>
                  <Text style={styles.avatarEditText}>+</Text>
                </View>
              </TouchableOpacity>

              {mensaje ? <Text style={styles.mensaje}>{mensaje}</Text> : null}

              {editando ? (
                <View style={styles.formEditar}>
                  <TextInput
                    style={styles.input}
                    placeholder="@tunombre"
                    placeholderTextColor="#333"
                    value={username}
                    onChangeText={setUsername}
                    autoCapitalize="none"
                  />
                  <TextInput
                    style={styles.input}
                    placeholder="tu bio..."
                    placeholderTextColor="#333"
                    value={bio}
                    onChangeText={setBio}
                    multiline
                  />
                  <TouchableOpacity style={styles.btnGuardar} onPress={guardar} disabled={guardando}>
                    {guardando
                      ? <ActivityIndicator color="#000" />
                      : <Text style={styles.btnGuardarText}>guardar</Text>
                    }
                  </TouchableOpacity>
                </View>
              ) : (
                <>
                  <Text style={styles.usernameText}>@{username || usuario?.email}</Text>
                  {bio ? <Text style={styles.bioText}>{bio}</Text> : null}

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
                    <View style={styles.statDivider} />
                    <View style={styles.stat}>
                      <Text style={styles.statNum}>{seguidores}</Text>
                      <Text style={styles.statLabel}>seguidores</Text>
                    </View>
                    <View style={styles.statDivider} />
                    <View style={styles.stat}>
                      <Text style={styles.statNum}>{siguiendo}</Text>
                      <Text style={styles.statLabel}>siguiendo</Text>
                    </View>
                  </View>

                  <TouchableOpacity style={styles.btnSalir} onPress={handleLogout}>
                    <Text style={styles.btnSalirText}>cerrar sesión</Text>
                  </TouchableOpacity>
                </>
              )}

              <View style={styles.gridHeader}>
                <Text style={styles.gridHeaderText}>mis outfits</Text>
              </View>
            </View>
          }
          ListEmptyComponent={
            <Text style={styles.vacio}>aún no has publicado outfits 👕</Text>
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
  back:            { color: GOLD, fontSize: 22 },
  titulo:          { color: '#fff', fontSize: 15, fontWeight: '700', letterSpacing: 1 },
  editar:          { color: GOLD, fontSize: 13, letterSpacing: 0.5 },
  perfil:          { alignItems: 'center', paddingVertical: 28, gap: 10 },
  avatarWrap:      { position: 'relative', marginBottom: 4 },
  avatarPlaceholder: {
    width:           90,
    height:          90,
    borderRadius:    45,
    backgroundColor: '#1a1a1a',
    borderWidth:     2,
    borderColor:     GOLD,
    justifyContent:  'center',
    alignItems:      'center',
  },
  avatarLetra:     { color: GOLD, fontSize: 32, fontWeight: 'bold' },
  avatarEditBadge: {
    position:        'absolute',
    bottom:          0,
    right:           0,
    width:           26,
    height:          26,
    borderRadius:    13,
    backgroundColor: GOLD,
    justifyContent:  'center',
    alignItems:      'center',
    borderWidth:     2,
    borderColor:     BG,
  },
  avatarEditText:  { color: '#000', fontSize: 16, fontWeight: 'bold' },
  usernameText:    { color: '#fff', fontSize: 17, fontWeight: '700', letterSpacing: 0.5 },
  bioText:         { color: '#444', fontSize: 13, textAlign: 'center', paddingHorizontal: 40 },
  formEditar:      { width: '80%', gap: 10 },
  input: {
    backgroundColor: '#111',
    borderWidth:     1,
    borderColor:     BORDER,
    borderRadius:    12,
    padding:         14,
    color:           '#fff',
    fontSize:        14,
  },
  mensaje:         { color: '#4caf50', textAlign: 'center', fontSize: 13 },
  btnGuardar: {
    backgroundColor: GOLD,
    borderRadius:    12,
    padding:         14,
    alignItems:      'center',
  },
  btnGuardarText:  { color: '#000', fontWeight: 'bold', fontSize: 14 },
  stats: {
    flexDirection:   'row',
    gap:             16,
    alignItems:      'center',
    marginTop:       4,
  },
  stat:            { alignItems: 'center', gap: 2 },
  statNum:         { color: '#fff', fontSize: 18, fontWeight: '800' },
  statLabel:       { color: '#333', fontSize: 10, letterSpacing: 0.5 },
  statDivider:     { width: 1, height: 28, backgroundColor: BORDER },
  btnSalir: {
    borderWidth:     1,
    borderColor:     '#222',
    borderRadius:    20,
    paddingVertical: 6,
    paddingHorizontal: 20,
    marginTop:       4,
  },
  btnSalirText:    { color: '#333', fontSize: 12, letterSpacing: 0.5 },
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
  gridPlaceholder: {
    width:           '100%',
    height:          '100%',
    backgroundColor: '#111',
    justifyContent:  'center',
    alignItems:      'center',
  },
  placeholderText: { fontSize: 28 },
  gridOverlay:     { position: 'absolute', bottom: 4, left: 4 },
  gridLikes:       { color: '#fff', fontSize: 11, fontWeight: '700' },
  vacio:           { color: '#333', textAlign: 'center', marginTop: 60, fontSize: 14 },
});