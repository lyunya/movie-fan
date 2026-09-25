import { fetchNewsDigest } from '@/server/news'
import NewsClient from './NewsClient'
export const metadata = { title: 'The latest reel' }
export const revalidate = 1800
export default async function NewsPage() {
  const digest = await fetchNewsDigest()
  return <NewsClient {...digest} />
}
