import { router } from 'expo-router';
import {
    FlatList,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from 'react-native';

const GOLD = '#c8a96e';
const BG = '#0f0f0f';
const BORDER = '#1e1e1e';

// Placeholder — luego conectamos a Supabase real
const NOTIFS_MOCK = [
  { id: 1, tipo: 'like',      usuario: 'sofia_mx',    texto: 'le dio like a tu outfit',         tiempo: '2m',  leida: false },
  { id: 2, tipo: 'comentario', usuario: 'carlos.v',   texto: 'comentó: "fuego ese look 🔥"',    tiempo: '15m', leida: false },
  { id: 3, tipo: 'seguidor',  usuario: 'mia.looks',   texto: 'empezó a seguirte',               tiempo: '1h',  leida: false },
  { id: 4, tipo: 'like',      usuario: 'uriel__',     texto: 'le dio like a tu outfit',         tiempo: '3h',  leida: true  },
  { id: 5, tipo: 'battle',    usuario: 'xhaba',       texto: 'tu outfit fue retado en Battles', tiempo: '5h',  leida: true  },
  { id: 6, tipo: 'seguidor',  usuario: 'dana.fit',    texto: 'empezó a seguirte',               tiempo: '1d',  leida: true  },
];

const TIPO_ICON: any = {
  like:       '♥',
  comentario: '◎',
  seguidor:   '◉',
  battle:     '⚡',
};

const TIPO_COLOR: any = {
  like:       '#c8a96e',
  comentario: '#7eb8c9',
  seguidor:   '#9e7ec9',
  battle:     '#c97e7e',
};

export default function Notificaciones() {
  const sinLeer = NOTIFS_MOCK.filter(n => !n.leida).length;

  function renderNotif({ item }: any) {
    return (
      <TouchableOpacity
        style={[styles.notif, !item.leida && styles.notifNoLeida]}
        activeOpacity={0.7}
      >
        {/* Indicador no leída */}
        {!item.leida && <View style={styles.dotNoLeida} />}

        {/* Ícono tipo */}
        <View style={[styles.tipoIcon, { backgroundColor: `${TIPO_COLOR[item.tipo]}18` }]}>
          <Text style={[styles.tipoIconText, { color: TIPO_COLOR[item.tipo] }]}>
            {TIPO_ICON[item.tipo]}
          </Text>
        </View>

        {/* Avatar usuario */}
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {item.usuario[0].toUpperCase()}
          </Text>
        </View>

        {/* Texto */}
        <View style={styles.notifInfo}>
          <Text style={styles.notifTexto}>
            <Text style={styles.notifUsuario}>{item.usuario} </Text>
            {item.texto}
          </Text>
          <Text style={styles.notifTiempo}>{item.tiempo}</Text>
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
          {sinLeer > 0 && (
            <Text style={styles.tituloCount}> ({sinLeer})</Text>
          )}
        </Text>
        <TouchableOpacity>
          <Text style={styles.marcarTodas}>todo leído</Text>
        </TouchableOpacity>
      </View>

      {/* Lista */}
      <FlatList
        data={NOTIFS_MOCK}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 52,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
  },
  btnBack: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnBackText: {
    color: GOLD,
    fontSize: 22,
  },
  titulo: {
    color: '#fff',
    fontSize: 15,
    fontWeight: '700',
    letterSpacing: 1,
  },
  tituloCount: {
    color: GOLD,
    fontWeight: '400',
  },
  marcarTodas: {
    color: '#333',
    fontSize: 12,
    letterSpacing: 0.5,
  },
  seccion: {
    color: '#2a2a2a',
    fontSize: 11,
    letterSpacing: 1.5,
    paddingHorizontal: 20,
    paddingVertical: 12,
    textTransform: 'uppercase',
  },
  notif: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: BORDER,
    position: 'relative',
  },
  notifNoLeida: {
    backgroundColor: '#111',
  },
  dotNoLeida: {
    position: 'absolute',
    left: 6,
    top: '50%',
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: GOLD,
  },
  tipoIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tipoIconText: {
    fontSize: 13,
  },
  avatar: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#1a1a1a',
    borderWidth: 1,
    borderColor: '#2a2a2a',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    color: '#888',
    fontWeight: 'bold',
    fontSize: 14,
  },
  notifInfo: {
    flex: 1,
    gap: 3,
  },
  notifTexto: {
    color: '#666',
    fontSize: 13,
    lineHeight: 18,
  },
  notifUsuario: {
    color: '#fff',
    fontWeight: '700',
  },
  notifTiempo: {
    color: '#2a2a2a',
    fontSize: 11,
    letterSpacing: 0.5,
  },
});