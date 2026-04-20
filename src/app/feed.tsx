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
import Svg, { Line, Path } from 'react-native-svg';
import { supabase } from '../lib/supabase';

const GOLD = '#c8a96e';
const BG = '#0f0f0f';
const CARD_BG = '#111';
const BORDER = '#1e1e1e';

const CATEGORIA_COLORES: any = {
  '👕 Casual':     '#0d0d1a',
  '🏋️ Deportivo': '#0d1a0d',
  '👔 Formal':     '#12101a',
  '🌆 Urbano':     '#1a0d0d',
  '🏖️ Playa':      '#1a180d',
  '❄️ Invierno':   '#0d161a',
  '🎉 Fiesta':     '#1a0d18',
};

function HangerSVG({ size = 24, color = '#c8a96e' }: { size?: number; color?: string }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 3C10.9 3 10 3.9 10 5C10 5.74 10.4 6.38 11 6.73V8L3 14H21L13 8V6.73C13.6 6.38 14 5.74 14 5C14 3.9 13.1 3 12 3Z"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Line x1="3" y1="14" x2="3" y2="16" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <Line x1="21" y1="14" x2="21" y2="16" stroke={color} strokeWidth="1.5" strokeLinecap="round" />
      <Path
        d="M3 16C3 17 4 18 5 18H19C20 18 21 17 21 16"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </Svg>
  );
}

function XhabaLogo() {
  return (
    <View style={styles.logoContainer}>
      <HangerSVG size={28} color={GOLD} />
      <Text style={styles.logoText}>
        xhab<Text style={{ color: GOLD }}>a</Text>
      </Text>
    </View>
  );
}

export default function Feed() {
  const [outfits, setOutfits] = useState<any[]>([]);
  const [descripcion, setDescripcion] = useState('');
  const [imagen, setImagen] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [misLikes, setMisLikes] = useState<number[]>([]);
  const [comentarios, setComentarios] = useState<any>({});
  const [siguiendo, setSiguiendo] = useState<string[]>([]);
  const [nuevoComentario, setNuevoComentario] = useState<any>({});
  const [mostrarComentarios, setMostrarComentarios] = useState<any>({});
  const [categoria, setCategoria] = useState('');
  const [notifCount] = useState(3);
  const [mostrarPublicar, setMostrarPublicar] = useState(false);

  useEffect(() => {
    cargarUsuario();
    cargarOutfits();
  }, []);

  useEffect(() => {
    if (userId) cargarSiguiendo();
  }, [userId]);

  async function cargarUsuario() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) setUserId(user.id);
  }

  async function cargarOutfits() {
    const { data } = await supabase
      .from('outfits')
      .select('*')
      .order('created_at', { ascending: false });

    if (data) {
      const userIds = [...new Set(data.map((o: any) => o.user_id))];
      const { data: perfilesData } = await supabase
        .from('perfiles')
        .select('user_id, username')
        .in('user_id', userIds);

      const perfilesMap: any = {};
      if (perfilesData) {
        perfilesData.forEach((p: any) => { perfilesMap[p.user_id] = p.username; });
      }

      setOutfits(data.map((o: any) => ({
        ...o,
        username: perfilesMap[o.user_id] || null,
      })));
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: likesData } = await supabase
        .from('likes').select('outfit_id').eq('user_id', user.id);
      if (likesData) setMisLikes(likesData.map((l: any) => l.outfit_id));
    }
    setCargando(false);
  }

  async function seleccionarImagen() {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => setImagen(ev.target?.result as string);
      reader.readAsDataURL(file);
    };
    input.click();
  }

  async function subirImagen(uri: string, uid: string) {
    const fileName = `${uid}/${Date.now()}.jpg`;
    const base64 = uri.split(',')[1];
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    const byteArray = new Uint8Array(byteNumbers);
    const blob = new Blob([byteArray], { type: 'image/jpeg' });
    const { error } = await supabase.storage
      .from('outfits').upload(fileName, blob, { contentType: 'image/jpeg' });
    if (error) return null;
    const { data: urlData } = supabase.storage.from('outfits').getPublicUrl(fileName);
    return urlData.publicUrl;
  }

  async function publicar() {
    if (!descripcion && !imagen) return;
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    let imagen_url = null;
    if (imagen && user) imagen_url = await subirImagen(imagen, user.id);
    await supabase.from('outfits').insert({
      user_id: user?.id, descripcion, imagen_url, categoria, likes: 0,
      created_at: new Date().toISOString(),
    });
    setDescripcion(''); setImagen(null); setCategoria('');
    setMostrarPublicar(false);
    await cargarOutfits();
    setLoading(false);
  }

  async function darLike(id: number, likesActuales: number) {
    if (!userId || misLikes.includes(id)) return;
    await supabase.from('likes').insert({ user_id: userId, outfit_id: id });
    await supabase.from('outfits').update({ likes: likesActuales + 1 }).eq('id', id);
    cargarOutfits();
  }

  async function cargarComentarios(outfitId: number) {
    const { data } = await supabase
      .from('comentarios').select('*').eq('outfit_id', outfitId)
      .order('created_at', { ascending: true });

    if (data) {
      const perfilesIds = [...new Set(data.map((c: any) => c.user_id))];
      const { data: perfilesData } = await supabase
        .from('perfiles').select('user_id, username').in('user_id', perfilesIds);
      const perfilesMap: any = {};
      if (perfilesData) perfilesData.forEach((p: any) => { perfilesMap[p.user_id] = p.username; });
      setComentarios((prev: any) => ({
        ...prev,
        [outfitId]: data.map((c: any) => ({ ...c, username: perfilesMap[c.user_id] || 'Usuario' }))
      }));
    }
  }

  async function publicarComentario(outfitId: number) {
    const texto = nuevoComentario[outfitId];
    if (!texto) return;
    await supabase.from('comentarios').insert({
      user_id: userId, outfit_id: outfitId, texto, created_at: new Date().toISOString(),
    });
    setNuevoComentario((prev: any) => ({ ...prev, [outfitId]: '' }));
    cargarComentarios(outfitId);
  }

  async function cargarSiguiendo() {
    if (!userId) return;
    const { data } = await supabase
      .from('seguidores').select('following_id').eq('follower_id', userId);
    if (data) setSiguiendo(data.map((s: any) => s.following_id));
  }

  async function toggleSeguir(otherUserId: string) {
    if (!userId) return;
    if (siguiendo.includes(otherUserId)) {
      await supabase.from('seguidores').delete()
        .eq('follower_id', userId).eq('following_id', otherUserId);
      setSiguiendo(siguiendo.filter((id) => id !== otherUserId));
    } else {
      await supabase.from('seguidores').insert({ follower_id: userId, following_id: otherUserId });
      setSiguiendo([...siguiendo, otherUserId]);
    }
  }

  function tiempoAtras(fecha: string) {
    const diff = Math.floor((Date.now() - new Date(fecha).getTime()) / 1000);
    if (diff < 60) return 'ahora';
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    return `${Math.floor(diff / 86400)}d`;
  }

  function irAPerfil(otroUserId: string, esMio: boolean) {
    if (esMio) {
      router.replace('/perfil');
    } else {
      router.push({ pathname: '/[id]', params: { id: otroUserId } });
    }
  }

  function renderOutfit({ item }: any) {
    const esMio = item.user_id === userId;
    const cardColor = CATEGORIA_COLORES[item.categoria] || CARD_BG;
    const yaLike = misLikes.includes(item.id);

    return (
      <View style={[styles.card, { backgroundColor: cardColor }]}>
        <View style={styles.cardHeader}>
          <TouchableOpacity
            style={styles.avatarWrap}
            onPress={() => irAPerfil(item.user_id, esMio)}
          >
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {(item.username || 'U')[0].toUpperCase()}
              </Text>
            </View>
            <View style={styles.onlineDot} />
          </TouchableOpacity>

          <View style={styles.cardHeaderInfo}>
            <TouchableOpacity onPress={() => irAPerfil(item.user_id, esMio)}>
              <Text style={styles.username}>
                {item.username || (esMio ? 'Tú' : 'Usuario')}
              </Text>
            </TouchableOpacity>
            <View style={styles.metaRow}>
              {item.categoria
                ? <Text style={styles.categoriaInline}>{item.categoria}</Text>
                : null}
              <Text style={styles.tiempo}>{tiempoAtras(item.created_at)}</Text>
            </View>
          </View>

          {!esMio && (
            <TouchableOpacity
              style={[styles.btnSeguir, siguiendo.includes(item.user_id) && styles.btnSiguiendo]}
              onPress={() => toggleSeguir(item.user_id)}
            >
              <Text style={[styles.btnSeguirText, siguiendo.includes(item.user_id) && styles.btnSiguiendoText]}>
                {siguiendo.includes(item.user_id) ? '✓ siguiendo' : '+ seguir'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {item.descripcion ? (
          <Text style={styles.descripcion}>
            <Text style={styles.usernameInline}>{item.username} </Text>
            {item.descripcion}
          </Text>
        ) : null}

        {item.imagen_url ? (
          <img
            src={item.imagen_url}
            style={{ width: '100%', height: 500, objectFit: 'contain', display: 'block', backgroundColor: '#000' }}
          />
        ) : null}

        <View style={styles.cardFooter}>
          <View style={styles.acciones}>
            <TouchableOpacity
              style={styles.accionBtn}
              onPress={() => darLike(item.id, item.likes || 0)}
              disabled={yaLike}
            >
              <Text style={[styles.accionIcon, yaLike && styles.accionIconActivo]}>
                {yaLike ? '♥' : '♡'}
              </Text>
              <Text style={[styles.accionNum, yaLike && { color: GOLD }]}>
                {item.likes || 0}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.accionBtn}
              onPress={() => {
                const showing = !mostrarComentarios[item.id];
                setMostrarComentarios((prev: any) => ({ ...prev, [item.id]: showing }));
                if (showing) cargarComentarios(item.id);
              }}
            >
              <Text style={styles.accionIcon}>◎</Text>
              <Text style={styles.accionNum}>{comentarios[item.id]?.length || 0}</Text>
            </TouchableOpacity>

            <TouchableOpacity style={styles.accionBtn}>
              <Text style={styles.accionIcon}>↗</Text>
            </TouchableOpacity>
          </View>

          {mostrarComentarios[item.id] && (
            <View style={styles.comentariosContainer}>
              {(comentarios[item.id] || []).map((c: any) => (
                <View key={c.id} style={styles.comentario}>
                  <Text style={styles.comentarioUser}>{c.username}</Text>
                  <Text style={styles.comentarioTexto}> {c.texto}</Text>
                </View>
              ))}
              <View style={styles.inputComentario}>
                <TextInput
                  style={styles.inputComentarioTexto}
                  placeholder="añadir comentario..."
                  placeholderTextColor="#333"
                  value={nuevoComentario[item.id] || ''}
                  onChangeText={(text) =>
                    setNuevoComentario((prev: any) => ({ ...prev, [item.id]: text }))
                  }
                />
                <TouchableOpacity onPress={() => publicarComentario(item.id)}>
                  <Text style={styles.btnEnviar}>→</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* HEADER FIJO */}
      <View style={styles.header}>
        <XhabaLogo />
        <View style={styles.headerActions}>
          {/* Botón publicar compacto */}
          <TouchableOpacity
            style={styles.btnPublicarHeader}
            onPress={() => setMostrarPublicar(!mostrarPublicar)}
          >
            <Text style={styles.btnPublicarHeaderText}>+ outfit</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() => router.push('/notificaciones' as any)}
          >
            <Text style={styles.headerBtnIcon}>🔔</Text>
            {notifCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{notifCount}</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.headerBtn}
            onPress={() => router.replace('/mensajes')}
          >
            <Text style={styles.headerBtnIcon}>✉</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* PUBLICAR — se despliega solo cuando se toca "+ outfit" */}
      {mostrarPublicar && (
        <View style={styles.publicar}>
          <TouchableOpacity style={styles.btnFoto} onPress={seleccionarImagen}>
            {imagen ? (
              <Image source={{ uri: imagen }} style={styles.preview} resizeMode="cover" />
            ) : (
              <Text style={styles.btnFotoText}>+</Text>
            )}
          </TouchableOpacity>

          <View style={styles.inputContainer}>
            <TextInput
              style={styles.input}
              placeholder="¿qué outfit usas hoy?"
              placeholderTextColor="#2e2e2e"
              value={descripcion}
              onChangeText={setDescripcion}
              multiline
              autoFocus
            />
            <View style={styles.categorias}>
              {['👕 Casual', '🏋️ Deportivo', '👔 Formal', '🌆 Urbano', '🏖️ Playa', '❄️ Invierno', '🎉 Fiesta'].map((cat) => (
                <TouchableOpacity
                  key={cat}
                  style={[styles.categoriaBtn, categoria === cat && styles.categoriaBtnActivo]}
                  onPress={() => setCategoria(categoria === cat ? '' : cat)}
                >
                  <Text style={[styles.categoriaBtnText, categoria === cat && styles.categoriaBtnTextoActivo]}>
                    {cat}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={styles.publicarRow}>
              <TouchableOpacity onPress={() => setMostrarPublicar(false)}>
                <Text style={styles.btnCancelar}>cancelar</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.btnPublicar, (!descripcion && !imagen) && styles.btnDesactivado]}
                onPress={publicar}
                disabled={loading || (!descripcion && !imagen)}
              >
                {loading
                  ? <ActivityIndicator color="#000" size="small" />
                  : <Text style={styles.btnPublicarText}>publicar</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        </View>
      )}

      {/* FEED */}
      {cargando ? (
        <ActivityIndicator color={GOLD} style={{ marginTop: 60 }} />
      ) : outfits.length === 0 ? (
        <View style={styles.vacioCont}>
          <Text style={styles.vacio}>sé el primero en publicar un outfit</Text>
        </View>
      ) : (
        <FlatList
          data={outfits}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderOutfit}
          contentContainerStyle={{ paddingBottom: 20 }}
          showsVerticalScrollIndicator={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: BG },

  // HEADER
  header: {
    flexDirection:   'row',
    justifyContent:  'space-between',
    alignItems:      'center',
    paddingHorizontal: 16,
    paddingTop:      52,
    paddingBottom:   12,
    backgroundColor: BG,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  logoContainer:   { flexDirection: 'row', alignItems: 'center', gap: 8 },
  logoText: {
    fontSize:        22,
    fontWeight:      '800',
    color:           '#fff',
    letterSpacing:   2,
    fontStyle:       'italic',
  },
  headerActions:   { flexDirection: 'row', gap: 6, alignItems: 'center' },
  btnPublicarHeader: {
    backgroundColor: GOLD,
    borderRadius:    20,
    paddingVertical: 6,
    paddingHorizontal: 14,
  },
  btnPublicarHeaderText: {
    color:           '#000',
    fontWeight:      '700',
    fontSize:        12,
    letterSpacing:   0.5,
  },
  headerBtn: {
    width:           36,
    height:          36,
    borderRadius:    18,
    backgroundColor: '#161616',
    borderWidth:     1,
    borderColor:     BORDER,
    justifyContent:  'center',
    alignItems:      'center',
  },
  headerBtnIcon:   { fontSize: 15 },
  badge: {
    position:        'absolute',
    top:             -2,
    right:           -2,
    backgroundColor: GOLD,
    borderRadius:    8,
    minWidth:        16,
    height:          16,
    justifyContent:  'center',
    alignItems:      'center',
    paddingHorizontal: 3,
  },
  badgeText:       { color: '#000', fontSize: 9, fontWeight: 'bold' },

  // PUBLICAR
  publicar: {
    padding:         16,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    flexDirection:   'row',
    gap:             12,
    backgroundColor: '#0a0a0a',
  },
  btnFoto: {
    width:           48,
    height:          48,
    backgroundColor: '#161616',
    borderRadius:    24,
    borderWidth:     1,
    borderColor:     GOLD,
    justifyContent:  'center',
    alignItems:      'center',
    overflow:        'hidden',
  },
  btnFotoText:     { fontSize: 22, color: GOLD },
  preview:         { width: 48, height: 48 },
  inputContainer:  { flex: 1, gap: 10 },
  input: {
    color:           '#fff',
    fontSize:        14,
    paddingVertical: 4,
    minHeight:       36,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  categorias:      { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  categoriaBtn: {
    borderWidth:     1,
    borderColor:     '#1e1e1e',
    borderRadius:    20,
    paddingVertical: 4,
    paddingHorizontal: 10,
  },
  categoriaBtnActivo: { backgroundColor: GOLD, borderColor: GOLD },
  categoriaBtnText:        { color: '#3a3a3a', fontSize: 11 },
  categoriaBtnTextoActivo: { color: '#000', fontWeight: 'bold' },
  publicarRow: {
    flexDirection:   'row',
    justifyContent:  'space-between',
    alignItems:      'center',
  },
  btnCancelar:     { color: '#333', fontSize: 13 },
  btnPublicar: {
    backgroundColor: GOLD,
    borderRadius:    20,
    paddingVertical: 8,
    paddingHorizontal: 22,
  },
  btnDesactivado:  { backgroundColor: '#161616' },
  btnPublicarText: { color: '#000', fontWeight: '700', fontSize: 13, letterSpacing: 0.8 },

  // CARDS
  separator:       { height: 1, backgroundColor: BORDER },
  card:            { backgroundColor: CARD_BG },
  cardHeader: {
    flexDirection:   'row',
    alignItems:      'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap:             10,
  },
  avatarWrap:      { position: 'relative' },
  avatar: {
    width:           36,
    height:          36,
    borderRadius:    18,
    backgroundColor: '#1a1a1a',
    borderWidth:     1.5,
    borderColor:     GOLD,
    justifyContent:  'center',
    alignItems:      'center',
  },
  avatarText:      { color: GOLD, fontWeight: 'bold', fontSize: 14 },
  onlineDot: {
    position:        'absolute',
    bottom:          0,
    right:           0,
    width:           9,
    height:          9,
    borderRadius:    5,
    backgroundColor: '#4caf50',
    borderWidth:     1.5,
    borderColor:     BG,
  },
  cardHeaderInfo:  { flex: 1 },
  username:        { color: '#fff', fontWeight: '700', fontSize: 13, letterSpacing: 0.3 },
  metaRow:         { flexDirection: 'row', gap: 6, alignItems: 'center', marginTop: 2 },
  categoriaInline: { color: GOLD, fontSize: 10, opacity: 0.7 },
  tiempo:          { color: '#2e2e2e', fontSize: 10 },
  btnSeguir: {
    borderWidth:     1,
    borderColor:     '#2a2a2a',
    borderRadius:    20,
    paddingVertical: 5,
    paddingHorizontal: 14,
  },
  btnSiguiendo:    { backgroundColor: 'rgba(200,169,110,0.1)', borderColor: GOLD },
  btnSeguirText:   { color: '#555', fontSize: 11, fontWeight: '600', letterSpacing: 0.3 },
  btnSiguiendoText: { color: GOLD },
  cardFooter: {
    paddingHorizontal: 16,
    paddingTop:      10,
    paddingBottom:   14,
    gap:             10,
  },
  descripcion: {
    color:           '#666',
    fontSize:        13,
    lineHeight:      19,
    paddingHorizontal: 16,
    paddingBottom:   8,
  },
  usernameInline:  { color: '#ccc', fontWeight: '700' },
  acciones:        { flexDirection: 'row', gap: 22, alignItems: 'center' },
  accionBtn:       { flexDirection: 'row', alignItems: 'center', gap: 6 },
  accionIcon:      { fontSize: 19, color: '#333' },
  accionIconActivo: { color: GOLD },
  accionNum:       { color: '#333', fontSize: 13, fontWeight: '600' },
  vacioCont: {
    flex:            1,
    justifyContent:  'center',
    alignItems:      'center',
    opacity:         0.4,
  },
  vacio:           { color: '#555', fontSize: 14, letterSpacing: 0.5 },
  comentariosContainer: {
    gap:             8,
    paddingTop:      10,
    borderTopWidth:  1,
    borderTopColor:  BORDER,
  },
  comentario:      { flexDirection: 'row', gap: 4 },
  comentarioUser:  { color: '#888', fontWeight: '700', fontSize: 12 },
  comentarioTexto: { color: '#555', fontSize: 12, flex: 1 },
  inputComentario: { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  inputComentarioTexto: {
    flex:            1,
    backgroundColor: '#0d0d0d',
    borderWidth:     1,
    borderColor:     BORDER,
    borderRadius:    20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    color:           '#fff',
    fontSize:        12,
  },
  btnEnviar:       { color: GOLD, fontSize: 18 },
});