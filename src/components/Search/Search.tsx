import type { FC } from 'react'
import type { SearchProps } from './types'

const Search: FC<SearchProps> = ({ loading, handleSearch }) => {
  return (
    <>
      <label className="sr-only" htmlFor="search">
        Search For Movies
      </label>
      <input
        className={`mx-auto my-6 max-h-14 min-w-[200px] max-w-[800px] cursor-pointer rounded py-2 pl-6 pr-6 pt-2 text-2xl xl:text-3xl ${
          loading
            ? 'animate-border bg-white bg-gradient-to-r from-teal-500 via-purple-500 to-pink-500 text-white  transition'
            : ''
        }
        `}
        onChange={(e) => handleSearch(e)}
        id="search"
        placeholder="Search for Movies"
        type="search"
      />
      <a className="clear" id="clearQuery" href="#">
        <img
          src="data:image/gif;base64,R0lGODlhAQABAID%2FAMDAwAAAACH5BAEAAAAALAAAAAABAAEAAAICRAEAOw%3D%3D"
          alt=""
        />
      </a>
    </>
  )
}

export default Search
