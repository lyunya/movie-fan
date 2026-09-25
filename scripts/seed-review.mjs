import { PrismaClient } from '@prisma/client'
const url=new URL(process.env.DATABASE_URL||'')
if(!['localhost','127.0.0.1'].includes(url.hostname))throw new Error('Review fixtures require a local database')
const db=new PrismaClient()
const user=await db.user.upsert({where:{id:'local-review-member'},update:{},create:{id:'local-review-member',name:'Alex',handle:'alex_at_the_movies',bio:'Strange worlds, good company, and films that stay with you.',publicWatchlist:true}})
await db.session.upsert({where:{sessionToken:'local-review-session'},update:{expires:new Date('2030-01-01')},create:{sessionToken:'local-review-session',userId:user.id,expires:new Date('2030-01-01')}})
for(const [id,name,year,rating,watched,saved] of [['329865','Arrival','2016',5,true,true],['157336','Interstellar','2014',4,true,false],['120','The Lord of the Rings: The Fellowship of the Ring','2001',5,true,false],['550','Fight Club','1999',null,false,true],['27205','Inception','2010',null,false,true]]){
 await db.watchListItem.upsert({where:{userId_movieId:{userId:user.id,movieId:id}},update:{},create:{userId:user.id,movieId:id,emsVersionId:id,name,directedBy:'',durationMinutes:116,genres:['Drama','Science Fiction'],releaseDate:`${year}-01-01`,userRating:rating,watched,inWatchlist:saved,favorite:rating===5,savedAt:saved?new Date():null}})
}
console.log('Local review member ready')
await db.$disconnect()
