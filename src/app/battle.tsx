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

export default function Battle() {
  const [battles, setBattles] = useState<any[]>([]);
  const [cargando, setCargando] = useState(true);
  const [creando, setCreando] = useState(false);
  const [imagen1, setImagen1] = useState<string | null>(null);
  const [imagen2, setImagen2] = useState<string | null>(null);
  const [descripcion, setDescripcion] = useState('');
  const [publicando, setPublicando] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [misVotos, setMisVotos] = useState<number[]>([]);
  const [duracion, setDuracion] = useState('24');

  useEffect(() => {
    cargarUsuario();
    cargarBattles();
    const intervalo = setInterval(cargarBattles, 30000);
    return () => clearInterval(intervalo);
  }, []);

  async function cargarUsuario() {
    const { data: { user } } = await supabase.auth.getUser();
    if (user) setUserId(user.id);
  }

  async function cargarBattles() {
    const { data } = await supabase
      .from('battles')
      .select('*')
      .order('created_at', { ascending: false });
    if (data) setBattles(data);

    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      const { data: votosData } = await supabase
        .from('votos_battle')
        .select('battle_id')
        .eq('user_id', user.id);
      if (votosData) setMisVotos(votosData.map((v: any) => v.battle_id));
    }
    setCargando(false);
  }

  async function seleccionarImagen(numero: number) {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e: any) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => {
        if (numero === 1) setImagen1(ev.target?.result as string);
        else setImagen2(ev.target?.result as string);
      };
      reader.readAsDataURL(file);
    };
    input.click();
  }

  async function subirImagen(uri: string, uid: string) {
    const fileName = `battles/${uid}/${Date.now()}.jpg`;
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

  async function publicarBattle() {
    if (!imagen1 || !imagen2) return;
    setPublicando(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const url1 = await subirImagen(imagen1, user.id);
    const url2 = await subirImagen(imagen2, user.id);

    const horas = parseInt(duracion) || 24;
    const expires = new Date();
    expires.setHours(expires.getHours() + horas);

    await supabase.from('battles').insert({
      user_id: user.id,
      outfit1_url: url1,
      outfit2_url: url2,
      votos1: 0,
      votos2: 0,
      descripcion,
      expires_at: expires.toISOString(),
      created_at: new Date().toISOString(),
    });

    setImagen1(null);
    setImagen2(null);
    setDescripcion('');
    setCreando(false);
    await cargarBattles();
    setPublicando(false);
  }

  async function votar(battleId: number, opcion: number, votos1: number, votos2: number) {
    if (!userId) return;
    if (misVotos.includes(battleId)) return;

    await supabase.from('votos_battle').insert({
      user_id: userId,
      battle_id: battleId,
    });

    if (opcion === 1) {
      await supabase.from('battles').update({ votos1: votos1 + 1 }).eq('id', battleId);
    } else {
      await supabase.from('battles').update({ votos2: votos2 + 1 }).eq('id', battleId);
    }
    cargarBattles();
  }

  function tiempoRestante(expires_at: string) {
    const ahora = new Date();
    const expira = new Date(expires_at);
    const diff = expira.getTime() - ahora.getTime();
    if (diff <= 0) return null;
    const horas = Math.floor(diff / 3600000);
    const minutos = Math.floor((diff % 3600000) / 60000);
    if (horas > 0) return `⏱ ${horas}h ${minutos}m restantes`;
    return `⏱ ${minutos}m restantes`;
  }

  function ganador(votos1: number, votos2: number) {
    if (votos1 > votos2) return '🏆 Ganó el Outfit A';
    if (votos2 > votos1) return '🏆 Ganó el Outfit B';
    return '🤝 Empate';
  }

  function renderBattle({ item }: any) {
    const yaVoto = misVotos.includes(item.id);
    const totalVotos = (item.votos1 || 0) + (item.votos2 || 0);
    const pct1 = totalVotos > 0 ? Math.round((item.votos1 / totalVotos) * 100) : 50;
    const pct2 = totalVotos > 0 ? Math.round((item.votos2 / totalVotos) * 100) : 50;
    const terminada = item.expires_at && new Date(item.expires_at) < new Date();
    const tiempo = item.expires_at ? tiempoRestante(item.expires_at) : null;

    return (
      <View style={styles.battleCard}>
        <Text style={styles.battleTitulo}>⚔️ Closet Battle</Text>
        {item.descripcion ? (
          <Text style={styles.battleDesc}>{item.descripcion}</Text>
        ) : null}

        {terminada ? (
          <View style={styles.ganadorBanner}>
            <Text style={styles.ganadorText}>{ganador(item.votos1, item.votos2)}</Text>
            <Text style={styles.totalVotos}>{totalVotos} votos en total</Text>
          </View>
        ) : tiempo ? (
          <Text style={styles.tiempoRestante}>{tiempo}</Text>
        ) : null}

        <View style={styles.battleOutfits}>
          <TouchableOpacity
            style={styles.battleOutfit}
            onPress={() => votar(item.id, 1, item.votos1 || 0, item.votos2 || 0)}
            disabled={yaVoto || terminada}
          >
            {item.outfit1_url ? (
              <Image source={{ uri: item.outfit1_url }} style={styles.battleImagen} resizeMode="cover" />
            ) : null}
            <View style={[
              styles.battleBar,
              { backgroundColor: yaVoto || terminada ? '#fff' : '#333' }
            ]}>
              <Text style={[
                styles.battlePct,
                { color: yaVoto || terminada ? '#000' : '#fff' }
              ]}>
                {yaVoto || terminada ? `${pct1}%` : 'Votar A'}
              </Text>
            </View>
          </TouchableOpacity>

          <Text style={styles.vs}>VS</Text>

          <TouchableOpacity
            style={styles.battleOutfit}
            onPress={() => votar(item.id, 2, item.votos1 || 0, item.votos2 || 0)}
            disabled={yaVoto || terminada}
          >
            {item.outfit2_url ? (
              <Image source={{ uri: item.outfit2_url }} style={styles.battleImagen} resizeMode="cover" />
            ) : null}
            <View style={[
              styles.battleBar,
              { backgroundColor: yaVoto || terminada ? '#fff' : '#333' }
            ]}>
              <Text style={[
                styles.battlePct,
                { color: yaVoto || terminada ? '#000' : '#fff' }
              ]}>
                {yaVoto || terminada ? `${pct2}%` : 'Votar B'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>

        {!terminada && !yaVoto && (
          <Text style={styles.totalVotos}>{totalVotos} votos</Text>
        )}
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.replace('/feed')}>
          <Text style={styles.back}>← Feed</Text>
        </TouchableOpacity>
        <Text style={styles.titulo}>⚔️ Battles</Text>
        <TouchableOpacity onPress={() => setCreando(!creando)}>
          <Text style={styles.crear}>{creando ? 'Cancelar' : '+ Nueva'}</Text>
        </TouchableOpacity>
      </View>

      {creando && (
        <View style={styles.formBattle}>
          <Text style={styles.formTitulo}>Sube tus dos outfits</Text>
          <View style={styles.fotosContainer}>
            <TouchableOpacity
              style={styles.fotoBtn}
              onPress={() => seleccionarImagen(1)}
            >
              {imagen1 ? (
                <Image source={{ uri: imagen1 }} style={styles.fotoPreview} resizeMode="cover" />
              ) : (
                <Text style={styles.fotoBtnText}>📸 Outfit A</Text>
              )}
            </TouchableOpacity>
            <Text style={styles.vs}>VS</Text>
            <TouchableOpacity
              style={styles.fotoBtn}
              onPress={() => seleccionarImagen(2)}
            >
              {imagen2 ? (
                <Image source={{ uri: imagen2 }} style={styles.fotoPreview} resizeMode="cover" />
              ) : (
                <Text style={styles.fotoBtnText}>📸 Outfit B</Text>
              )}
            </TouchableOpacity>
          </View>

          <View style={styles.duracionContainer}>
            <Text style={styles.duracionLabel}>Duración de la battle:</Text>
            <View style={styles.duracionBtns}>
              {['1', '6', '12', '24'].map((h) => (
                <TouchableOpacity
                  key={h}
                  style={[styles.duracionBtn, duracion === h && styles.duracionBtnActivo]}
                  onPress={() => setDuracion(h)}
                >
                  <Text style={[styles.duracionBtnText, duracion === h && styles.duracionBtnTextoActivo]}>
                    {h}h
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <TextInput
            style={styles.input}
            placeholder="Descripción opcional..."
            placeholderTextColor="#666"
            value={descripcion}
            onChangeText={setDescripcion}
          />
          <TouchableOpacity
            style={[styles.btnPublicar, (!imagen1 || !imagen2) && styles.btnDesactivado]}
            onPress={publicarBattle}
            disabled={publicando || !imagen1 || !imagen2}
          >
            {publicando ? (
              <ActivityIndicator color="#000" />
            ) : (
              <Text style={styles.btnPublicarText}>⚔️ ¡Iniciar Battle!</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {cargando ? (
        <ActivityIndicator color="#fff" style={{ marginTop: 40 }} />
      ) : battles.length === 0 ? (
        <Text style={styles.vacio}>No hay battles aún. ¡Crea el primero! ⚔️</Text>
      ) : (
        <FlatList
          data={battles}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderBattle}
          contentContainerStyle={{ paddingBottom: 40 }}
        />
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
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
  },
  back: {
    color: '#fff',
    fontSize: 14,
  },
  titulo: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  crear: {
    color: '#fff',
    fontSize: 14,
  },
  formBattle: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
    gap: 12,
  },
  formTitulo: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  fotosContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  fotoBtn: {
    width: 140,
    height: 180,
    backgroundColor: '#111',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  fotoPreview: {
    width: '100%',
    height: '100%',
  },
  fotoBtnText: {
    color: '#666',
    fontSize: 14,
    textAlign: 'center',
  },
  duracionContainer: {
    gap: 8,
  },
  duracionLabel: {
    color: '#aaa',
    fontSize: 13,
  },
  duracionBtns: {
    flexDirection: 'row',
    gap: 8,
  },
  duracionBtn: {
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 20,
    paddingVertical: 6,
    paddingHorizontal: 16,
  },
  duracionBtnActivo: {
    backgroundColor: '#fff',
    borderColor: '#fff',
  },
  duracionBtnText: {
    color: '#666',
    fontSize: 13,
    fontWeight: 'bold',
  },
  duracionBtnTextoActivo: {
    color: '#000',
  },
  input: {
    backgroundColor: '#111',
    borderWidth: 1,
    borderColor: '#333',
    borderRadius: 12,
    padding: 12,
    color: '#fff',
    fontSize: 14,
  },
  btnPublicar: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 14,
    alignItems: 'center',
  },
  btnDesactivado: {
    backgroundColor: '#333',
  },
  btnPublicarText: {
    color: '#000',
    fontWeight: 'bold',
    fontSize: 16,
  },
  battleCard: {
    borderBottomWidth: 1,
    borderBottomColor: '#1a1a1a',
    padding: 16,
    gap: 12,
  },
  battleTitulo: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  battleDesc: {
    color: '#aaa',
    fontSize: 14,
    textAlign: 'center',
  },
  ganadorBanner: {
    backgroundColor: '#1a1a1a',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
    gap: 4,
  },
  ganadorText: {
    color: '#FFD700',
    fontSize: 18,
    fontWeight: 'bold',
  },
  tiempoRestante: {
    color: '#aaa',
    fontSize: 13,
    textAlign: 'center',
  },
  battleOutfits: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  battleOutfit: {
    flex: 1,
    gap: 8,
  },
  battleImagen: {
    width: '100%',
    height: 200,
    borderRadius: 12,
  },
  battleBar: {
    borderRadius: 8,
    padding: 8,
    alignItems: 'center',
  },
  battlePct: {
    fontWeight: 'bold',
    fontSize: 14,
  },
  vs: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  totalVotos: {
    color: '#555',
    fontSize: 12,
    textAlign: 'center',
  },
  vacio: {
    color: '#555',
    textAlign: 'center',
    marginTop: 60,
    fontSize: 16,
  },
});