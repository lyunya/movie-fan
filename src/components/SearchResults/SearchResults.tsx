import type { FC } from 'react'
import type { SearchResultsProps } from './types'

const SearchResults:FC<SearchResultsProps> = ({ movieCards }) => {
  return (
    <div className='flex my-12 mx-auto w-full sm:w-11/12 justify-evenly flex-wrap	gap-8'>
      {movieCards}
    </div>
  )
}

export default SearchResults