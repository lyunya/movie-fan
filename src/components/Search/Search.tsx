import type { FC } from 'react'
import type { SearchProps } from './types'

const Search: FC<SearchProps> = ({ handleSearch }) => {
  return (
    <>
      <label className='sr-only' htmlFor='search'>Search For Movies</label> 
      <input className='min-w-[200px] max-w-[800px] max-h-14 mx-auto rounded pl-4 pr-6 py-2 my-6 text-2xl xl:text-3xl pt-2' onChange={(e) => handleSearch(e)}
        id="search"
      placeholder="Search for Movies"
      type='search' />
    </>

  )
}

export default Search
