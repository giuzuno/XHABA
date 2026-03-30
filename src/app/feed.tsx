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
import { supabase } from '../lib/supabase';

export default function Feed() {
  const [outfits, setOutfits] = useState<any[]>([]);
  const [descripcion, setDescripcion] = useState('');
  const [imagen, setImagen] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    cargarOutfits();
  }, []);

  async function cargarOutfits() {
    const { data } = await supabase
      .from('outfits')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setOutfits(data);
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

 async function subirImagen(uri: string, userId: string) {
  const fileName = `${userId}/${Date.now()}.jpg`;
  
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

  if (error) {
    console.log('error subiendo imagen:', error);
    return null;
  }

  const { data: urlData } = supabase.storage
    .from('outfits')
    .getPublicUrl(fileName);

  return urlData.publicUrl;
}

  async function publicar() {
  if (!descripcion && !imagen) return;
  setLoading(true);
  const { data: { user } } = await supabase.auth.getUser();
  console.log('usuario:', user?.id);
  console.log('imagen:', imagen ? 'hay imagen' : 'no hay imagen');
  
  let imagen_url = null;
  if (imagen && user) {
    imagen_url = await subirImagen(imagen, user.id);
    console.log('imagen_url resultado:', imagen_url);
  }
  
  const { error } = await supabase.from('outfits').insert({
    user_id: user?.id,
    descripcion,
    imagen_url,
    likes: 0,
    created_at: new Date().toISOString(),
  });
  
  console.log('error insert:', error);
  setDescripcion('');
  setImagen(null);
  await cargarOutfits();
  setLoading(false);
}

  async function darLike(id: string, likesActuales: number) {
    await supabase
      .from('outfits')
      .update({ likes: likesActuales + 1 })
      .eq('id', id);
    cargarOutfits();
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.replace('/');
  }

  function renderOutfit({ item }: any) {
    return (
      <View style={styles.card}>
        {item.imagen_url ? (
          <Image 
  source={{ uri: item.imagen_url }} 
  style={styles.imagen}
  resizeMode="contain"
/>
        ) : (
          <View style={styles.imagenPlaceholder}>
            <Text style={styles.placeholderText}>📸</Text>
          </View>
        )}
        <View style={styles.cardInfo}>
          <Text style={styles.descripcion}>{item.descripcion}</Text>
          <TouchableOpacity
            style={styles.likeBtn}
            onPress={() => darLike(item.id, item.likes || 0)}
          >
            <Text style={styles.likeText}>❤️ {item.likes || 0}</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.logo}>Xhaba</Text>
        <TouchableOpacity onPress={handleLogout}>
          <Text style={styles.salir}>Salir</Text>
        </TouchableOpacity>
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
            placeholder="Describe tu outfit..."
            placeholderTextColor="#666"
            value={descripcion}
            onChangeText={setDescripcion}
            multiline
          />
          <TouchableOpacity
            style={styles.btnPublicar}
            onPress={publicar}
            disabled={loading}
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
          keyExtractor={(item) => item.id}
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
    padding: 20,
    paddingTop: 40,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  logo: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  salir: {
    color: '#666',
    fontSize: 14,
  },
  publicar: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
    flexDirection: 'row',
    gap: 12,
  },
  btnFoto: {
    width: 64,
    height: 64,
    backgroundColor: '#111',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  btnFotoText: {
    fontSize: 24,
  },
  preview: {
    width: 64,
    height: 64,
  },
  inputContainer: {
    flex: 1,
    gap: 8,
  },
  input: {
    backgroundColor: '#111',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 12,
    padding: 12,
    color: '#fff',
    fontSize: 14,
    minHeight: 44,
  },
  btnPublicar: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  btnPublicarText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 14,
  },
  card: {
    borderBottomWidth: 1,
    borderBottomColor: '#222',
    padding: 16,
  },

  imagen: {
  width: '100%',
  height: 400,
  borderRadius: 12,
  marginBottom: 12,
},

  imagenPlaceholder: {
    width: '100%',
    height: 200,
    backgroundColor: '#111',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  placeholderText: {
    fontSize: 48,
  },
  cardInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  descripcion: {
    color: '#fff',
    fontSize: 16,
    flex: 1,
  },
  likeBtn: {
    padding: 8,
  },
  likeText: {
    fontSize: 18,
  },
  vacio: {
    color: '#666',
    textAlign: 'center',
    marginTop: 60,
    fontSize: 16,
  },
});
