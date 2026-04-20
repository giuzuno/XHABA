import { router, useLocalSearchParams } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
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

export default function Mensajes() {
  const { userId: otroUserId, username: otroUsername } = useLocalSearchParams();
  const [mensajes, setMensajes] = useState<any[]>([]);
  const [conversaciones, setConversaciones] = useState<any[]>([]);
  const [texto, setTexto] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);
  const flatListRef = useRef<any>(null);

  // Si viene con otroUserId es vista de chat, si no es lista de conversaciones
  const esChatDirecto = !!otroUserId;

  useEffect(() => {
    cargarUsuario();
  }, []);

  useEffect(() => {
    if (!userId) return;
    if (esChatDirecto) {
      cargarMensajes();
      suscribirRealtime();
    } else {
      cargarConversaciones();
    }
  }, [userId]);

  async function cargarUsuario() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) setUserId(user.id);
  }

  // ── Realtime ──
  function suscribirRealtime() {
    const canal = supabase
      .channel('mensajes_realtime')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'mensajes',
      }, () => {
        cargarMensajes();
      })
      .subscribe();

    return () => { supabase.removeChannel(canal); };
  }

  async function cargarMensajes() {
    const { data } = await supabase
      .from('mensajes')
      .select('*')
      .or(`and(de_user_id.eq.${userId},para_user_id.eq.${otroUserId}),and(de_user_id.eq.${otroUserId},para_user_id.eq.${userId})`)
      .order('created_at', { ascending: true });

    if (data) setMensajes(data);
    setCargando(false);
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
  }

  async function cargarConversaciones() {
    const { data } = await supabase
      .from('mensajes')
      .select('*')
      .or(`de_user_id.eq.${userId},para_user_id.eq.${userId}`)
      .order('created_at', { ascending: false });

    if (!data) { setCargando(false); return; }

    // Agrupar por conversación — quedarnos con el último mensaje de cada una
    const mapa: any = {};
    data.forEach((m: any) => {
      const otroId = m.de_user_id === userId ? m.para_user_id : m.de_user_id;
      if (!mapa[otroId]) mapa[otroId] = m;
    });

    // Traer usernames
    const otrosIds = Object.keys(mapa);
    const { data: perfiles } = await supabase
      .from('perfiles')
      .select('user_id, username')
      .in('user_id', otrosIds);

    const perfilesMap: any = {};
    if (perfiles) perfiles.forEach((p: any) => { perfilesMap[p.user_id] = p.username; });

    setConversaciones(otrosIds.map((id) => ({
      otroUserId: id,
      otroUsername: perfilesMap[id] || 'Usuario',
      ultimoMensaje: mapa[id].texto,
      created_at: mapa[id].created_at,
    })));

    setCargando(false);
  }

  async function enviar() {
    if (!texto.trim() || !userId) return;
    const textoEnviar = texto.trim();
    setTexto('');
    await supabase.from('mensajes').insert({
      de_user_id: userId,
      para_user_id: otroUserId,
      texto: textoEnviar,
      created_at: new Date().toISOString(),
    });
    cargarMensajes();
  }

  function tiempoAtras(fecha: string) {
    const diff = Math.floor((Date.now() - new Date(fecha).getTime()) / 1000);
    if (diff < 60) return 'ahora';
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    return `${Math.floor(diff / 86400)}d`;
  }

  // ── Vista: lista de conversaciones ──
  function renderConversaciones() {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.titulo}>mensajes</Text>
        </View>
        {cargando ? (
          <ActivityIndicator color={GOLD} style={{ marginTop: 40 }} />
        ) : conversaciones.length === 0 ? (
          <View style={styles.vacioCont}>
            <Text style={styles.vacioIcon}>✉</Text>
            <Text style={styles.vacio}>sin conversaciones aún</Text>
            <Text style={styles.vacioSub}>ve a un perfil y envía un mensaje</Text>
          </View>
        ) : (
          <FlatList
            data={conversaciones}
            keyExtractor={(item) => item.otroUserId}
            showsVerticalScrollIndicator={false}
            renderItem={({ item }) => (
              <TouchableOpacity
                style={styles.convItem}
                onPress={() => router.push(`/mensajes?userId=${item.otroUserId}&username=${item.otroUsername}` as any)}
              >
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {item.otroUsername[0].toUpperCase()}
                  </Text>
                </View>
                <View style={styles.convInfo}>
                  <Text style={styles.convUsername}>@{item.otroUsername}</Text>
                  <Text style={styles.convUltimo} numberOfLines={1}>
                    {item.ultimoMensaje}
                  </Text>
                </View>
                <Text style={styles.convTiempo}>{tiempoAtras(item.created_at)}</Text>
              </TouchableOpacity>
            )}
          />
        )}
      </View>
    );
  }

  // ── Vista: chat directo ──
  function renderChat() {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()} style={styles.btnBack}>
            <Text style={styles.btnBackText}>←</Text>
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>
                {String(otroUsername || 'U')[0].toUpperCase()}
              </Text>
            </View>
            <Text style={styles.headerUsername}>@{otroUsername}</Text>
          </View>
        </View>

        {cargando ? (
          <ActivityIndicator color={GOLD} style={{ marginTop: 40 }} />
        ) : (
          <FlatList
            ref={flatListRef}
            data={mensajes}
            keyExtractor={(item) => item.id.toString()}
            renderItem={({ item }) => {
              const esMio = item.de_user_id === userId;
              return (
                <View style={[styles.mensajeContainer, esMio ? styles.mensajeMio : styles.mensajeOtro]}>
                  <View style={[styles.burbuja, esMio ? styles.burbujasMia : styles.burbujasOtro]}>
                    <Text style={[styles.mensajeTexto, esMio ? styles.mensajeTextoMio : styles.mensajeTextoOtro]}>
                      {item.texto}
                    </Text>
                  </View>
                </View>
              );
            }}
            contentContainerStyle={styles.lista}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <Text style={styles.vacio}>inicia la conversación 👋</Text>
            }
          />
        )}

        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="escribe un mensaje..."
            placeholderTextColor="#333"
            value={texto}
            onChangeText={setTexto}
            multiline
          />
          <TouchableOpacity
            style={[styles.btnEnviar, !texto.trim() && styles.btnEnviarDesactivado]}
            onPress={enviar}
            disabled={!texto.trim()}
          >
            <Text style={[styles.btnEnviarText, !texto.trim() && { color: '#333' }]}>→</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return esChatDirecto ? renderChat() : renderConversaciones();
}

const styles = StyleSheet.create({
  container:       { flex: 1, backgroundColor: BG },
  header: {
    flexDirection:   'row',
    alignItems:      'center',
    paddingHorizontal: 20,
    paddingTop:      52,
    paddingBottom:   14,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    gap:             12,
  },
  titulo: {
    color:           '#fff',
    fontSize:        20,
    fontWeight:      '800',
    letterSpacing:   2,
    fontStyle:       'italic',
  },
  btnBack: {
    width:           36,
    height:          36,
    justifyContent:  'center',
    alignItems:      'center',
  },
  btnBackText:     { color: GOLD, fontSize: 22 },
  headerInfo: {
    flex:            1,
    flexDirection:   'row',
    alignItems:      'center',
    gap:             10,
  },
  headerUsername: {
    color:           '#fff',
    fontSize:        15,
    fontWeight:      '700',
  },
  avatar: {
    width:           40,
    height:          40,
    borderRadius:    20,
    backgroundColor: '#1a1a1a',
    borderWidth:     1.5,
    borderColor:     GOLD,
    justifyContent:  'center',
    alignItems:      'center',
  },
  avatarText:      { color: GOLD, fontWeight: 'bold', fontSize: 15 },
  lista:           { padding: 16, flexGrow: 1 },
  mensajeContainer: { marginBottom: 8 },
  mensajeMio:      { alignItems: 'flex-end' },
  mensajeOtro:     { alignItems: 'flex-start' },
  burbuja: {
    maxWidth:        '75%',
    borderRadius:    18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  burbujasMia:     { backgroundColor: GOLD },
  burbujasOtro:    { backgroundColor: '#1a1a1a' },
  mensajeTexto:    { fontSize: 14, lineHeight: 20 },
  mensajeTextoMio: { color: '#000', fontWeight: '500' },
  mensajeTextoOtro: { color: '#fff' },
  vacioCont: {
    flex:            1,
    justifyContent:  'center',
    alignItems:      'center',
    gap:             8,
    opacity:         0.4,
    marginTop:       80,
  },
  vacioIcon:       { fontSize: 36, color: GOLD },
  vacio:           { color: '#555', textAlign: 'center', fontSize: 14 },
  vacioSub:        { color: '#333', fontSize: 12, letterSpacing: 0.5 },
  inputContainer: {
    flexDirection:   'row',
    alignItems:      'center',
    padding:         12,
    borderTopWidth:  1,
    borderTopColor:  BORDER,
    gap:             8,
  },
  input: {
    flex:            1,
    backgroundColor: '#111',
    borderWidth:     1,
    borderColor:     BORDER,
    borderRadius:    20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color:           '#fff',
    fontSize:        14,
    maxHeight:       100,
  },
  btnEnviar: {
    width:           40,
    height:          40,
    borderRadius:    20,
    backgroundColor: GOLD,
    justifyContent:  'center',
    alignItems:      'center',
  },
  btnEnviarDesactivado: { backgroundColor: '#161616' },
  btnEnviarText:   { color: '#000', fontSize: 18, fontWeight: 'bold' },
  convItem: {
    flexDirection:   'row',
    alignItems:      'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    gap:             12,
  },
  convInfo:        { flex: 1, gap: 3 },
  convUsername:    { color: '#fff', fontWeight: '700', fontSize: 14 },
  convUltimo:      { color: '#333', fontSize: 12 },
  convTiempo:      { color: '#2a2a2a', fontSize: 11 },
});