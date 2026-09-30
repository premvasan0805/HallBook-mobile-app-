import { useState } from 'react';
import { Text } from 'react-native';

import { SegmentedTabs } from '@/components/form';
import { Screen } from '@/components/primitives';
import { ToggleList } from '@/components/toggle-list';
import { useTheme } from '@/lib/theme-context';

export default function AppSettingsScreen() {
  const { T } = useTheme();
  const [lang, setLang] = useState<'en' | 'ta'>('en');
  const [v, setV] = useState<Record<string, boolean>>({ compact: false, haptics: true });
  return (
    <Screen title="App Settings" back>
      <Text style={T.overline}>Language</Text>
      <SegmentedTabs
        value={lang}
        onChange={setLang}
        options={[
          { key: 'en', label: 'English' },
          { key: 'ta', label: 'தமிழ்' },
        ]}
      />
      <Text style={[T.overline, { marginTop: 8 }]}>Display</Text>
      <ToggleList
        values={v}
        onChange={(k, val) => setV((s) => ({ ...s, [k]: val }))}
        items={[
          { key: 'compact', title: 'Compact amounts', sub: 'Show ₹1.5L instead of ₹1,50,000 in lists' },
          { key: 'haptics', title: 'Haptic feedback', sub: 'Vibrate lightly on key actions' },
        ]}
      />
    </Screen>
  );
}
