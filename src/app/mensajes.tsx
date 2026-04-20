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

export default function Mensajes() {
  const { userId: otroUserId, username: otroUsername } = useLocalSearchParams();
  const [mensajes, setMensajes] = useState<any[]>([]);
  const [texto, setTexto] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [cargando, setCargando] = useState(true);
  const flatListRef = useRef<any>(null);

  useEffect(() => {
    cargarUsuario();
  }, []);

  useEffect(() => {
    if (userId) cargarMensajes();
  }, [userId]);

  async function cargarUsuario() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) setUserId(user.id);
  }

  async function cargarMensajes() {
    const { data } = await supabase
      .from('mensajes')
      .select('*')
      .or(`and(de_user_id.eq.${userId},para_user_id.eq.${otroUserId}),and(de_user_id.eq.${otroUserId},para_user_id.eq.${userId})`)
      .order('created_at', { ascending: true });

    if (data) setMensajes(data);
    setCargando(false);

    setTimeout(() => {
      flatListRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }

  async function enviar() {
    if (!texto.trim() || !userId) return;
    const textoEnviar = texto.trim();
    setTexto('');

    await supabase.from('mensajes').insert({
      de_user_id: userId,
      para_user_id: otroUserId,
      texto: textoEnviar,
      leido: false,
      created_at: new Date().toISOString(),
    });

    cargarMensajes();
  }

  function renderMensaje({ item }: any) {
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
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={styles.back}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerInfo}>
          <Text style={styles.headerUsername}>@{otroUsername}</Text>
        </View>
      </View>

      {cargando ? (
        <ActivityIndicator color="#fff" style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          ref={flatListRef}
          data={mensajes}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderMensaje}
          contentContainerStyle={styles.lista}
          ListEmptyComponent={
            <Text style={styles.vacio}>Inicia la conversación 👋</Text>
          }
        />
      )}

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Escribe un mensaje..."
          placeholderTextColor="#666"
          value={texto}
          onChangeText={setTexto}
          multiline
        />
        <TouchableOpacity
          style={[styles.btnEnviar, !texto.trim() && styles.btnEnviarDesactivado]}
          onPress={enviar}
          disabled={!texto.trim()}
        >
          <Text style={styles.btnEnviarText}>→</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
    gap: 12,
  },
  back: {
    color: '#fff',
    fontSize: 24,
  },
  headerInfo: {
    flex: 1,
  },
  headerUsername: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  lista: {
    padding: 16,
    gap: 8,
    flexGrow: 1,
  },
  mensajeContainer: {
    marginBottom: 8,
  },
  mensajeMio: {
    alignItems: 'flex-end',
  },
  mensajeOtro: {
    alignItems: 'flex-start',
  },
  burbuja: {
    maxWidth: '75%',
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  burbujasMia: {
    backgroundColor: '#fff',
  },
  burbujasOtro: {
    backgroundColor: '#1a1a1a',
  },
  mensajeTexto: {
    fontSize: 15,
  },
  mensajeTextoMio: {
    color: '#000',
  },
  mensajeTextoOtro: {
    color: '#fff',
  },
  vacio: {
    color: '#555',
    textAlign: 'center',
    marginTop: 60,
    fontSize: 16,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#1a1a1a',
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: '#111',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: '#fff',
    fontSize: 15,
    maxHeight: 100,
  },
  btnEnviar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
  },
  btnEnviarDesactivado: {
    backgroundColor: '#333',
  },
  btnEnviarText: {
    color: '#000',
    fontSize: 18,
    fontWeight: 'bold',
  },
});