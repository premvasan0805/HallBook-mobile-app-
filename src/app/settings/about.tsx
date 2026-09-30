import { Ionicons } from '@expo/vector-icons';
import { StyleSheet, Text, View } from 'react-native';

import { Card, Screen } from '@/components/primitives';
import { makeStyles, useTheme } from '@/lib/theme-context';

export default function AboutScreen() {
  const t = useTheme();
  const st = useSt();
  return (
    <Screen title="About" back>
      <View style={st.brand}>
        <View style={st.logo}>
          <Ionicons name="flower-outline" size={32} color={t.C.primary} />
        </View>
        <Text style={t.T.screenTitle}>Banyan Meadows</Text>
        <Text style={t.T.secondary}>Version 1.0.0</Text>
      </View>
      <Card>
        <Text style={t.T.body}>
          Banyan Meadows helps marriage halls manage bookings, customers, payments, rates and auspicious dates from a
          single mobile app.
        </Text>
      </Card>
    </Screen>
  );
}

const useSt = makeStyles((t) =>
  StyleSheet.create({
    brand: { alignItems: 'center', gap: 4, paddingVertical: 24 },
    logo: {
      width: 72,
      height: 72,
      borderRadius: 22,
      backgroundColor: t.C.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 8,
    },
  }),
);
