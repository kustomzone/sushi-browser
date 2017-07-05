import { ipcMain } from 'electron'
import {history,image} from './databaseFork'

ipcMain.on('fetch-history', async (event, range) => {
  console.log(range)
  const cond =  !Object.keys(range).length ? range :
  { updated_at: (
    range.start === void 0 ? { $lte: range.end } :
      range.end === void 0 ? { $gte: range.start } :
      { $gte: range.start ,$lte: range.end }
  )}
  const data = await history.find_sort([cond],[{ updated_at: -1 }])
  event.sender.send('history-reply', data);
})


ipcMain.on('fetch-frequently-history', async (event, range) => {
  console.log(range)
  const data = await history.find_sort_limit([{}],[{ count: -1 }],[80])
  const images = await image.find({ url: { $in: data.map(x=>x.location) }})
  event.sender.send('history-reply', data.map(x=>{
    if(!x.capture){
      const img = images.find(im=>im.url == x.location)
      if(img){
        x.capture = img.path
      }
    }
    return {...x, path:x.capture ? x.capture : (void 0)}
  }));
})

ipcMain.on('search-history', async (event, cond) => {
  if(Array.isArray(cond)){
    const arr = []
    for (let e of cond) {
      e = new RegExp(e,'i')
      arr.push({ $or: [{ title: e }, { location: e }]})
    }
    cond = cond.length == 1 ? arr[0] : { $and: arr}
  }
  else{
    cond = { $or: [{ title: cond }, { location: cond }]}
  }
  const data = await history.find_sort([cond],[{ updated_at: -1 }])
  event.sender.send('history-reply', data);
})