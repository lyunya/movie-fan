import type { FC, ReactNode } from 'react'

interface SearchResultsProps {
  children: ReactNode
}

const SearchResults: FC<SearchResultsProps> = ({ children }) => {
  return (
    <div className="mx-auto flex w-full max-w-screen-xl flex-wrap justify-center gap-x-4 gap-y-8 px-4 sm:px-8">
      {children}
    </div>
  )
}

export default SearchResults
