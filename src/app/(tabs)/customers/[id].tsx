import { useLocalSearchParams } from 'expo-router';

import { CustomerProfile } from '@/components/customer-profile';

export default function CustomerTabScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return <CustomerProfile id={id} tab />;
}
