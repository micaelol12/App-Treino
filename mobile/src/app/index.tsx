import { Redirect } from 'expo-router';

import { useAuth } from '@/features/auth/presentation/auth-context';

export default function IndexRoute() {
  const { session } = useAuth();

  return <Redirect href={session ? '/treino' : '/login'} />;
}
