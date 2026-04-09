import { router, Slot, usePathname } from 'expo-router';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

export default function RootLayout() {
  const pathname = usePathname();
  const showNav = ['/feed', '/perfil', '/battle', '/buscar'].includes(pathname);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Slot />
      </View>

      {showNav && (
        <View style={styles.navbar}>
          <TouchableOpacity
            style={styles.navItem}
            onPress={() => router.replace('/feed')}
          >
            <Text style={[styles.navIcon, pathname === '/feed' && styles.navActivo]}>
              🏠
            </Text>
            <Text style={[styles.navLabel, pathname === '/feed' && styles.navLabelActivo]}>
              Feed
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
           style={styles.navItem}
            onPress={() => router.replace('/feed')}
          >
          <Text style={[styles.navIcon, pathname === '/feed' && styles.navActivo]}>
           ➕
           </Text>
           <Text style={[styles.navLabel, pathname === '/feed' && styles.navLabelActivo]}>
            Publicar
          </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
            onPress={() => router.replace('/battle')}
          >
            <Text style={[styles.navIcon, pathname === '/battle' && styles.navActivo]}>
              ⚔️
            </Text>
            <Text style={[styles.navLabel, pathname === '/battle' && styles.navLabelActivo]}>
              Battles
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.navItem}
            onPress={() => router.replace('/perfil')}
          >
            <Text style={[styles.navIcon, pathname === '/perfil' && styles.navActivo]}>
              👤
            </Text>
            <Text style={[styles.navLabel, pathname === '/perfil' && styles.navLabelActivo]}>
              Perfil
            </Text>
          </TouchableOpacity>
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
  content: {
    flex: 1,
  },
  navbar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#1a1a1a',
    backgroundColor: '#000',
    paddingVertical: 8,
    paddingBottom: 16,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
  },
  navIcon: {
    fontSize: 22,
    opacity: 0.4,
  },
  navLabel: {
    fontSize: 11,
    color: '#555',
  },
  navActivo: {
    opacity: 1,
  },
  navLabelActivo: {
    color: '#fff',
  },
});