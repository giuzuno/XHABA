import { router, Slot, usePathname } from 'expo-router';
import { useEffect } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const GOLD = '#c8a96e';
const BG = '#0f0f0f';

const NAV_ITEMS = [
  { route: '/feed',     icon: '⌂', label: 'Feed'     },
  { route: '/buscar',   icon: '⊹', label: 'Buscar'   },
  { route: '/battle',   icon: '⚡', label: 'Battles'  },
  { route: '/mensajes', icon: '✉', label: 'Mensajes' },
  { route: '/perfil',   icon: '◉', label: 'Perfil'   },
];

export default function RootLayout() {
  const pathname = usePathname();
  const showNav = NAV_ITEMS.map(i => i.route).includes(pathname);

  useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      * { scrollbar-width: none !important; }
      *::-webkit-scrollbar { display: none !important; }
    `;
    document.head.appendChild(style);
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Slot />
      </View>

      {showNav && (
        <View style={styles.navbar}>
          {NAV_ITEMS.map(({ route, icon, label }) => {
            const activo = pathname === route;
            return (
              <TouchableOpacity
                key={route}
                style={styles.navItem}
                onPress={() => router.replace(route as any)}
              >
                <View style={[styles.iconWrapper, activo && styles.iconWrapperActivo]}>
                  <Text style={[styles.navIcon, activo && styles.navIconActivo]}>
                    {icon}
                  </Text>
                </View>
                <Text style={[styles.navLabel, activo && styles.navLabelActivo]}>
                  {label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container:         { flex: 1, backgroundColor: BG },
  content:           { flex: 1 },
  navbar: {
    flexDirection:   'row',
    borderTopWidth:  1,
    borderTopColor:  '#1e1e1e',
    backgroundColor: '#0a0a0a',
    paddingTop:      10,
    paddingBottom:   24,
  },
  navItem: {
    flex:            1,
    alignItems:      'center',
    gap:             4,
  },
  iconWrapper: {
    width:           36,
    height:          36,
    borderRadius:    18,
    justifyContent:  'center',
    alignItems:      'center',
  },
  iconWrapperActivo: {
    backgroundColor: 'rgba(200,169,110,0.12)',
  },
  navIcon: {
    fontSize:        20,
    color:           '#333',
  },
  navIconActivo: {
    color:           GOLD,
  },
  navLabel: {
    fontSize:        10,
    color:           '#333',
    letterSpacing:   0.5,
  },
  navLabelActivo: {
    color:           GOLD,
    fontWeight:      '600',
  },
});