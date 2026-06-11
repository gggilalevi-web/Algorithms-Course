import { createClient } from '@/lib/supabase/server'
import LandingPage from '@/components/landing/LandingPage'
import type { Topic } from '@/lib/types'

export default async function Page() {
  const supabase = await createClient()
  const { data: topics } = await supabase.from('topics').select('*').order('order_index')

  return <LandingPage topics={(topics as Topic[]) ?? []} />
}
