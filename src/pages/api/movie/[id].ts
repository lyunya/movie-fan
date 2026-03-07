import type { NextApiRequest, NextApiResponse } from 'next'
import { FLIXSTER_API_MOVIE_DETAILS_URL, RAPID_API_HOST } from '@/data/Constants'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { id } = req.query
  if (!id || typeof id !== 'string') {
    return res.status(400).json({ error: 'id parameter is required' })
  }

  const response = await fetch(`${FLIXSTER_API_MOVIE_DETAILS_URL}${id}`, {
    method: 'GET',
    headers: {
      'X-RapidAPI-Key': process.env.RAPID_API_KEY as string,
      'X-RapidAPI-Host': RAPID_API_HOST,
    },
  })
  const data = await response.json()
  return res.status(200).json(data)
}
