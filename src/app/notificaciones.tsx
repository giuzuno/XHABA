import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { supabase } from '../lib/supabase';

const GOLD = '#c8a96e';
const BG = '#0f0f0f';
const BORDER = '#1e1e1e';

const TIPO_ICON: any = {
  like:               '♥',
  comentario:         '◎',
  seguidor:           '◉',
  batalla:            '⚡',
  historia_like:      '♥',
  historia_comentario:'◎',
  battle_ganador:     '🏆',
  mensaje:            '✉',
};

const TIPO_COLOR: any = {
  like:               '#c8a96e',
  comentario:         '#7eb8c9',
  seguidor:           '#9e7ec9',
  batalla:            '#c97e7e',
  historia_like:      '#c8a96e',
  historia_comentario:'#7eb8c9',
  battle_ganador:     '#ffd700',
  mensaje:            '#7ec9a0',
};

const TIPO_TEXTO: any = {
  like:               'le dio like a tu outfit',
  comentario:         'comentó tu outfit',
  seguidor:           'empezó a seguirte',
  batalla:            'te retó en Battles',
  historia_like:      'le dio like a tu historia',
  historia_comentario:'respondió tu historia',
  battle_ganador:     '¡ganaste un Battle!',
  mensaje:            'te envió un mensaje',
};

export default function Notificaciones() {
  const [notifs, setNotifs] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    cargarUsuario();
  }, []);

  useEffect(() => {
    if (userId) cargarNotifs();
  }, [userId]);

  async function cargarUsuario() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) setUserId(user.id);
  }

  async function cargarNotifs() {
    if (!userId) return;

    const { data } = await supabase
      .from('notificaciones')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (data) {
      // Traer usernames de los que enviaron la notif
      const deUserIds = [...new Set(data.map((n: any) => n.de_user_id))];
      const { data: perfiles } = await supabase
        .from('perfiles')
        .select('user_id, username, avatar_url')
        .in('user_id', deUserIds);

      const perfilesMap: any = {};
      if (perfiles) perfiles.forEach((p: any) => { perfilesMap[p.user_id] = p; });

      setNotifs(data.map((n: any) => ({
        ...n,
        username: perfilesMap[n.de_user_id]?.username || 'Usuario',
        avatar_url: perfilesMap[n.de_user_id]?.avatar_url || null,
      })));
    }

    // Marcar todas como leídas
    await supabase
      .from('notificaciones')
      .update({ leida: true })
      .eq('user_id', userId)
      .eq('leida', false);

    setCargando(false);
  }

  async function marcarTodasLeidas() {
    if (!userId) return;
    await supabase
      .from('notificaciones')
      .update({ leida: true })
      .eq('user_id', userId);
    setNotifs(notifs.map(n => ({ ...n, leida: true })));
  }

  function tiempoAtras(fecha: string) {
    const diff = Math.floor((Date.now() - new Date(fecha).getTime()) / 1000);
    if (diff < 60) return 'ahora';
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    return `${Math.floor(diff / 86400)}d`;
  }

  const sinLeer = notifs.filter(n => !n.leida).length;

  function renderNotif({ item }: any) {
    const color = TIPO_COLOR[item.tipo] || GOLD;
    const icon = TIPO_ICON[item.tipo] || '•';
    const texto = TIPO_TEXTO[item.tipo] || 'interactuó contigo';

    return (
      <TouchableOpacity
        style={[styles.notif, !item.leida && styles.notifNoLeida]}
        activeOpacity={0.7}
        onPress={() => {
          if (item.tipo === 'mensaje') router.replace('/mensajes');
          else if (item.tipo === 'seguidor') {
            router.push({ pathname: '/[id]', params: { id: item.de_user_id } });
          }
        }}
      >
        {!item.leida && <View style={styles.dotNoLeida} />}

        {/* Ícono tipo */}
        <View style={[styles.tipoIcon, { backgroundColor: `${color}18` }]}>
          <Text style={[styles.tipoIconText, { color }]}>{icon}</Text>
        </View>

        {/* Avatar */}
        <View style={styles.avatar}>
          {item.avatar_url ? (
            <img
              src={item.avatar_url}
              style={{ width: 38, height: 38, borderRadius: 19, objectFit: 'cover', display: 'block' }}
            />
          ) : (
            <Text style={styles.avatarText}>
              {(item.username || 'U')[0].toUpperCase()}
            </Text>
          )}
        </View>

        {/* Texto */}
        <View style={styles.notifInfo}>
          <Text style={styles.notifTexto}>
            <Text style={styles.notifUsuario}>{item.username} </Text>
            {texto}
          </Text>
          <Text style={styles.notifTiempo}>{tiempoAtras(item.created_at)}</Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.btnBack}>
          <Text style={styles.btnBackText}>←</Text>
        </TouchableOpacity>
        <Text style={styles.titulo}>
          notificaciones
          {sinLeer > 0 && <Text style={styles.tituloCount}> ({sinLeer})</Text>}
        </Text>
        <TouchableOpacity onPress={marcarTodasLeidas}>
          <Text style={styles.marcarTodas}>todo leído</Text>
        </TouchableOpacity>
      </View>

      {cargando ? (
        <ActivityIndicator color={GOLD} style={{ marginTop: 40 }} />
      ) : notifs.length === 0 ? (
        <View style={styles.vacioCont}>
          <Text style={styles.vacioIcon}>🔔</Text>
          <Text style={styles.vacio}>sin notificaciones aún</Text>
        </View>
      ) : (
        <FlatList
          data={notifs}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderNotif}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingBottom: 40 }}
          ListHeaderComponent={
            sinLeer > 0 ? (
              <Text style={styles.seccion}>nuevas</Text>
            ) : null
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container:     { flex: 1, backgroundColor: BG },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 52, paddingBottom: 14,
    borderBottomWidth: 1, borderBottomColor: BORDER,
  },
  btnBack:       { width: 36, height: 36, justifyContent: 'center', alignItems: 'center' },
  btnBackText:   { color: GOLD, fontSize: 22 },
  titulo:        { color: '#fff', fontSize: 15, fontWeight: '700', letterSpacing: 1 },
  tituloCount:   { color: GOLD, fontWeight: '400' },
  marcarTodas:   { color: '#333', fontSize: 12, letterSpacing: 0.5 },
  seccion: {
    color: '#2a2a2a', fontSize: 11, letterSpacing: 1.5,
    paddingHorizontal: 20, paddingVertical: 12,
  },
  notif: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingVertical: 14,
    gap: 12, borderBottomWidth: 1, borderBottomColor: BORDER,
    position: 'relative',
  },
  notifNoLeida:  { backgroundColor: '#111' },
  dotNoLeida: {
    position: 'absolute', left: 6, top: '50%',
    width: 6, height: 6, borderRadius: 3, backgroundColor: GOLD,
  },
  tipoIcon: {
    width: 28, height: 28, borderRadius: 14,
    justifyContent: 'center', alignItems: 'center',
  },
  tipoIconText:  { fontSize: 13 },
  avatar: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: '#1a1a1a', borderWidth: 1, borderColor: '#2a2a2a',
    justifyContent: 'center', alignItems: 'center', overflow: 'hidden',
  },
  avatarText:    { color: '#888', fontWeight: 'bold', fontSize: 14 },
  notifInfo:     { flex: 1, gap: 3 },
  notifTexto:    { color: '#666', fontSize: 13, lineHeight: 18 },
  notifUsuario:  { color: '#fff', fontWeight: '700' },
  notifTiempo:   { color: '#2a2a2a', fontSize: 11, letterSpacing: 0.5 },
  vacioCont: {
    flex: 1, justifyContent: 'center', alignItems: 'center',
    gap: 12, opacity: 0.4, marginTop: 80,
  },
  vacioIcon:     { fontSize: 36 },
  vacio:         { color: '#555', fontSize: 14, letterSpacing: 0.5 },
});