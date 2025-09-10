import { auth } from '@/auth';
import NavClient from './NavClient';

export default async function Nav() {
  const session = await auth();
  const logged = !!session?.user;
  const label =
    (session?.user?.email as string | undefined) ||
    (session?.user?.name as string | undefined) ||
    undefined;

  return <NavClient logged={logged} userLabel={label} />;
}