import { useState } from 'react';
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

export default function Buscar() {
  const [query, setQuery] = useState('');
  const [resultados, setResultados] = useState<any[]>([]);
  const [cargando, setCargando] = useState(false);
  const [buscado, setBuscado] = useState(false);

  async function buscar(texto: string) {
    setQuery(texto);
    if (texto.length < 2) {
      setResultados([]);
      setBuscado(false);
      return;
    }
    setCargando(true);
    const { data } = await supabase
      .from('perfiles')
      .select('user_id, username, bio')
      .ilike('username', `%${texto}%`)
      .limit(20);

    if (data) setResultados(data);
    setBuscado(true);
    setCargando(false);
  }

  function renderUsuario({ item }: any) {
    return (
      <TouchableOpacity style={styles.usuario}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>👤</Text>
        </View>
        <View style={styles.info}>
          <Text style={styles.username}>@{item.username}</Text>
          {item.bio ? (
            <Text style={styles.bio}>{item.bio}</Text>
          ) : null}
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.titulo}>🔍 Buscar</Text>
      </View>

      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Buscar usuarios..."
          placeholderTextColor="#666"
          value={query}
          onChangeText={buscar}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => {
            setQuery('');
            setResultados([]);
            setBuscado(false);
          }}>
            <Text style={styles.limpiar}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {cargando ? (
        <ActivityIndicator color="#fff" style={{ marginTop: 40 }} />
      ) : buscado && resultados.length === 0 ? (
        <Text style={styles.vacio}>No encontramos usuarios con ese nombre 🤷</Text>
      ) : (
        <FlatList
          data={resultados}
          keyExtractor={(item) => item.user_id}
          renderItem={renderUsuario}
          contentContainerStyle={{ paddingBottom: 40 }}
          ListHeaderComponent={
            resultados.length > 0 ? (
              <Text style={styles.resultadosLabel}>
                {resultados.length} resultado{resultados.length !== 1 ? 's' : ''}
              </Text>
            ) : null
          }
        />
      )}

      {!buscado && (
        <View style={styles.sugerencia}>
          <Text style={styles.sugerenciaIcon}>🔍</Text>
          <Text style={styles.sugerenciaTexto}>Busca usuarios por su nombre</Text>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  titulo: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    margin: 16,
    backgroundColor: '#111',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 12,
    paddingHorizontal: 16,
  },
  searchInput: {
    flex: 1,
    padding: 14,
    color: '#fff',
    fontSize: 16,
  },
  limpiar: {
    color: '#666',
    fontSize: 16,
    padding: 8,
  },
  resultadosLabel: {
    color: '#555',
    fontSize: 13,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  usuario: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#222',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 22,
  },
  info: {
    flex: 1,
  },
  username: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 15,
  },
  bio: {
    color: '#666',
    fontSize: 13,
    marginTop: 2,
  },
  vacio: {
    color: '#555',
    textAlign: 'center',
    marginTop: 60,
    fontSize: 16,
  },
  sugerencia: {
    alignItems: 'center',
    marginTop: 80,
    gap: 12,
  },
  sugerenciaIcon: {
    fontSize: 48,
  },
  sugerenciaTexto: {
    color: '#555',
    fontSize: 16,
  },
});
