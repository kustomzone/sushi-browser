const ipc = chrome.ipcRenderer

document.title = url.split("/").slice(-1)[0]
const myPlayer = videojs('main-video')

myPlayer.src(type ? {type, src:url}: url)

function onMouseDown(){
  myPlayer.requestFullscreen()
  document.removeEventListener('mousedown',onMouseDown)
}
document.addEventListener('mousedown',onMouseDown)

document.addEventListener('wheel',(e)=>{
  const now = myPlayer.currentTime()
  myPlayer.currentTime(now + (e.deltaY > 0 ? 1 : -1) * 5);

},{passive: true})
setTimeout(_=>ipc.send('force-click',{x: Math.round(window.innerWidth / 2) ,y:Math.round(window.innerHeight / 2) }),100)