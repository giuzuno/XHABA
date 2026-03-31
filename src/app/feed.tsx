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
  View
} from 'react-native';
import { supabase } from '../lib/supabase';

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

  useEffect(() => {
    cargarUsuario();
    cargarOutfits();
    cargarSiguiendo();
  }, []);

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
        perfilesData.forEach((p: any) => {
          perfilesMap[p.user_id] = p.username;
        });
      }

      const outfitsConNombre = data.map((o: any) => ({
        ...o,
        username: perfilesMap[o.user_id] || null,
      }));

      setOutfits(outfitsConNombre);
    }

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: likesData } = await supabase
        .from('likes')
        .select('outfit_id')
        .eq('user_id', user.id);
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
      reader.onload = (ev) => {
        setImagen(ev.target?.result as string);
      };
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
      .from('outfits')
      .upload(fileName, blob, { contentType: 'image/jpeg' });
    if (error) return null;
    const { data: urlData } = supabase.storage
      .from('outfits')
      .getPublicUrl(fileName);
    return urlData.publicUrl;
  }

  async function publicar() {
    if (!descripcion && !imagen) return;
    setLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    let imagen_url = null;
    if (imagen && user) {
      imagen_url = await subirImagen(imagen, user.id);
    }
    await supabase.from('outfits').insert({
      user_id: user?.id,
      descripcion,
      imagen_url,
      categoria,
      likes: 0,
      created_at: new Date().toISOString(),
    });
    setDescripcion('');
    setImagen(null);
    setCategoria('');
    await cargarOutfits();
    setLoading(false);
  }

  async function darLike(id: number, likesActuales: number) {
    if (!userId) return;
    if (misLikes.includes(id)) return;
    await supabase.from('likes').insert({ user_id: userId, outfit_id: id });
    await supabase
      .from('outfits')
      .update({ likes: likesActuales + 1 })
      .eq('id', id);
    cargarOutfits();
  }

  async function cargarComentarios(outfitId: number) {
    const { data } = await supabase
      .from('comentarios')
      .select('*')
      .eq('outfit_id', outfitId)
      .order('created_at', { ascending: true });

    if (data) {
      const perfilesIds = [...new Set(data.map((c: any) => c.user_id))];
      const { data: perfilesData } = await supabase
        .from('perfiles')
        .select('user_id, username')
        .in('user_id', perfilesIds);

      const perfilesMap: any = {};
      if (perfilesData) {
        perfilesData.forEach((p: any) => {
          perfilesMap[p.user_id] = p.username;
        });
      }

      const comentariosConNombre = data.map((c: any) => ({
        ...c,
        username: perfilesMap[c.user_id] || 'Usuario',
      }));

      setComentarios((prev: any) => ({ ...prev, [outfitId]: comentariosConNombre }));
    }
  }

  async function publicarComentario(outfitId: number) {
    const texto = nuevoComentario[outfitId];
    if (!texto) return;
    await supabase.from('comentarios').insert({
      user_id: userId,
      outfit_id: outfitId,
      texto,
      created_at: new Date().toISOString(),
    });
    setNuevoComentario((prev: any) => ({ ...prev, [outfitId]: '' }));
    cargarComentarios(outfitId);
  }

  async function cargarSiguiendo() {
    if (!userId) return;
    const { data } = await supabase
      .from('seguidores')
      .select('following_id')
      .eq('follower_id', userId);
    if (data) setSiguiendo(data.map((s: any) => s.following_id));
  }

  async function toggleSeguir(otherUserId: string) {
    if (!userId) return;
    if (siguiendo.includes(otherUserId)) {
      await supabase
        .from('seguidores')
        .delete()
        .eq('follower_id', userId)
        .eq('following_id', otherUserId);
      setSiguiendo(siguiendo.filter((id) => id !== otherUserId));
    } else {
      await supabase
        .from('seguidores')
        .insert({ follower_id: userId, following_id: otherUserId });
      setSiguiendo([...siguiendo, otherUserId]);
    }
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace('/');
  }

  function tiempoAtras(fecha: string) {
    const ahora = new Date();
    const creado = new Date(fecha);
    const diff = Math.floor((ahora.getTime() - creado.getTime()) / 1000);
    if (diff < 60) return 'ahora';
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    return `${Math.floor(diff / 86400)}d`;
  }

  function renderOutfit({ item }: any) {
    const esMio = item.user_id === userId;
    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>👤</Text>
          </View>
          <View style={styles.cardHeaderInfo}>
            <Text style={styles.username}>
              {item.username || (esMio ? 'Tú' : 'Usuario')}
            </Text>
            <Text style={styles.tiempo}>{tiempoAtras(item.created_at)}</Text>
          </View>
          {!esMio && (
            <TouchableOpacity
              style={[
                styles.btnSeguir,
                siguiendo.includes(item.user_id) && styles.btnSiguiendo,
              ]}
              onPress={() => toggleSeguir(item.user_id)}
            >
              <Text style={[
                styles.btnSeguirText,
                siguiendo.includes(item.user_id) && styles.btnSiguiendoText,
              ]}>
                {siguiendo.includes(item.user_id) ? 'Siguiendo' : 'Seguir'}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {item.imagen_url ? (
          <Image
            source={{ uri: item.imagen_url }}
            style={styles.imagen}
            resizeMode="contain"
          />
        ) : null}

        <View style={styles.cardFooter}>
          <View style={styles.acciones}>
            <TouchableOpacity
              style={styles.likeBtn}
              onPress={() => darLike(item.id, item.likes || 0)}
              disabled={misLikes.includes(item.id)}
            >
              <Text style={styles.likeText}>
                {misLikes.includes(item.id) ? '❤️' : '🤍'} {item.likes || 0}
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                const showing = !mostrarComentarios[item.id];
                setMostrarComentarios((prev: any) => ({ ...prev, [item.id]: showing }));
                if (showing) cargarComentarios(item.id);
              }}
            >
              <Text style={styles.btnComentario}>
                💬 {comentarios[item.id]?.length || 0}
              </Text>
            </TouchableOpacity>
          </View>

          {item.categoria ? (
            <Text style={styles.categoriaTag}>{item.categoria}</Text>
          ) : null}

          {item.descripcion ? (
            <Text style={styles.descripcion}>{item.descripcion}</Text>
          ) : null}

          {mostrarComentarios[item.id] && (
            <View style={styles.comentariosContainer}>
              {(comentarios[item.id] || []).map((c: any) => (
                <View key={c.id} style={styles.comentario}>
                  <Text style={styles.comentarioUser}>{c.username}</Text>
                  <Text style={styles.comentarioTexto}>{c.texto}</Text>
                </View>
              ))}
              <View style={styles.inputComentario}>
                <TextInput
                  style={styles.inputComentarioTexto}
                  placeholder="Escribe un comentario..."
                  placeholderTextColor="#666"
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
      <View style={styles.header}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Text style={styles.logo}>🧥 Xhaba</Text>
        </View>
        <View style={{ flexDirection: 'row', gap: 16 }}>
          <TouchableOpacity onPress={handleLogout}>
            <Text style={styles.salir}>Salir</Text>
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.publicar}>
        <TouchableOpacity style={styles.btnFoto} onPress={seleccionarImagen}>
          {imagen ? (
            <Image source={{ uri: imagen }} style={styles.preview} />
          ) : (
            <Text style={styles.btnFotoText}>📸</Text>
          )}
        </TouchableOpacity>
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="¿Qué outfit usas hoy?"
            placeholderTextColor="#666"
            value={descripcion}
            onChangeText={setDescripcion}
            multiline
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
          <TouchableOpacity
            style={[styles.btnPublicar, (!descripcion && !imagen) && styles.btnDesactivado]}
            onPress={publicar}
            disabled={loading || (!descripcion && !imagen)}
          >
            {loading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={styles.btnPublicarText}>Publicar</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>

      {cargando ? (
        <ActivityIndicator color="#fff" style={{ marginTop: 40 }} />
      ) : outfits.length === 0 ? (
        <Text style={styles.vacio}>Sé el primero en publicar un outfit 👕</Text>
      ) : (
        <FlatList
          data={outfits}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderOutfit}
          contentContainerStyle={{ paddingBottom: 40 }}
        />
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
  logo: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  salir: {
    color: '#555',
    fontSize: 14,
  },
  publicar: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
    flexDirection: 'row',
    gap: 12,
  },
  btnFoto: {
    width: 56,
    height: 56,
    backgroundColor: '#111',
    borderRadius: 28,
    borderWidth: 1,
    borderColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  btnFotoText: {
    fontSize: 20,
  },
  preview: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  inputContainer: {
    flex: 1,
    gap: 8,
  },
  input: {
    backgroundColor: '#000',
    borderWidth: 0,
    padding: 8,
    color: '#fff',
    fontSize: 16,
    minHeight: 44,
  },
     categorias: {
     flexDirection: 'row',
     flexWrap: 'wrap',
     gap: 8,
     marginTop: 4,
    },
  categoriaBtn: {
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 12,
    marginRight: 8,
  },
  categoriaBtnActivo: {
    backgroundColor: '#fff',
    borderColor: '#fff',
  },
  categoriaBtnText: {
    color: '#666',
    fontSize: 12,
  },
  categoriaBtnTextoActivo: {
    color: '#000',
    fontWeight: 'bold',
  },
  categoriaTag: {
    color: '#888',
    fontSize: 12,
    marginTop: 4,
  },
  btnPublicar: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 8,
    paddingHorizontal: 20,
    alignSelf: 'flex-end',
  },
  btnDesactivado: {
    backgroundColor: '#333',
  },
  btnPublicarText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 14,
  },
  card: {
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
    paddingVertical: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 12,
    gap: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#222',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 18,
  },
  cardHeaderInfo: {
    flex: 1,
  },
  username: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  },
  tiempo: {
    color: '#555',
    fontSize: 12,
  },
  imagen: {
    width: '100%',
    height: 400,
    marginBottom: 8,
  },
  cardFooter: {
    paddingHorizontal: 16,
    gap: 6,
  },
  likeBtn: {
    alignSelf: 'flex-start',
  },
  likeText: {
    fontSize: 16,
  },
  descripcion: {
    color: '#ccc',
    fontSize: 14,
    lineHeight: 20,
  },
  vacio: {
    color: '#555',
    textAlign: 'center',
    marginTop: 60,
    fontSize: 16,
  },
  acciones: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
  },
  btnComentario: {
    fontSize: 16,
    color: '#fff',
  },
  comentariosContainer: {
    marginTop: 12,
    gap: 8,
  },
  comentario: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'flex-start',
  },
  comentarioUser: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 13,
  },
  comentarioTexto: {
    color: '#ccc',
    fontSize: 13,
    flex: 1,
  },
  inputComentario: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 8,
  },
  inputComentarioTexto: {
    flex: 1,
    backgroundColor: '#111',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
    color: '#fff',
    fontSize: 13,
  },
  btnEnviar: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  btnSeguir: {
    borderWidth: 1,
    borderColor: '#fff',
    borderRadius: 20,
    paddingVertical: 4,
    paddingHorizontal: 14,
  },
  btnSiguiendo: {
    backgroundColor: '#fff',
  },
  btnSeguirText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  btnSiguiendoText: {
    color: '#000',
  },
});