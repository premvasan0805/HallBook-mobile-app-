import { StyleSheet, Switch, Text, View } from 'react-native';

import { Card, Divider } from '@/components/primitives';
import { useTheme } from '@/lib/theme-context';

export type ToggleItem = { key: string; title: string; sub?: string };

export function ToggleList({
  items,
  values,
  onChange,
}: {
  items: ToggleItem[];
  values: Record<string, boolean>;
  onChange: (key: string, v: boolean) => void;
}) {
  const { C, T } = useTheme();
  return (
    <Card style={{ padding: 0 }}>
      {items.map((it, i) => (
        <View key={it.key}>
          <View style={st.row}>
            <View style={{ flex: 1 }}>
              <Text style={T.bodyMedium}>{it.title}</Text>
              {it.sub ? <Text style={T.caption}>{it.sub}</Text> : null}
            </View>
            <Switch
              value={!!values[it.key]}
              onValueChange={(v) => onChange(it.key, v)}
              trackColor={{ true: C.primary, false: C.borderStrong }}
              thumbColor={C.onPrimary}
            />
          </View>
          {i < items.length - 1 ? <Divider inset={16} /> : null}
        </View>
      ))}
    </Card>
  );
}

const st = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, minHeight: 64 },
});
