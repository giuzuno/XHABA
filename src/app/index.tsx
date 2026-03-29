import { StyleSheet, Text, View } from 'react-native';

export default function Index() {
  return (
    <View style={styles.container}>
      <Text style={styles.logo}>Xhaba</Text>
      <Text style={styles.slogan}>Tu closet inteligente</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logo: {
    fontSize: 48,
    fontWeight: 'bold',
    color: '#FFFFFF',
    letterSpacing: 2,
  },
  slogan: {
    fontSize: 16,
    color: '#AAAAAA',
    marginTop: 8,
    letterSpacing: 1,
  },
});
