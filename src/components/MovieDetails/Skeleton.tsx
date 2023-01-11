import Skeleton from 'react-loading-skeleton'
import 'react-loading-skeleton/dist/skeleton.css'

const MovieSkeleton = () => { 
  return (
    <div className="container mx-auto px-4 pb-20 h-full">
      <div className="flex flex-col justify-evenly md:flex-row items-center">
        <div className='h-fit w-1/2'>
          <p className='text-3xl xl:text-5xl pb-2 text-white pr-12'>         
            <Skeleton className='mb-2' count={5} enableAnimation={true} />
          </p>
        </div>
        <div className='h-64 w-64'>
          <Skeleton height='100%' /> 
        </div>

      </div>
    </div>
  )

}

export default MovieSkeleton