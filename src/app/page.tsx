import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function Home() {
  const cookieStore = await cookies();
  const companyId = cookieStore.get('sustainance_company_id')?.value;

  if (companyId) {
    redirect('/dashboard');
  } else {
    redirect('/auth');
  }
}
