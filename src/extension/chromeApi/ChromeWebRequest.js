import {webContents, ipcMain} from 'electron'
import uuid from "node-uuid"

const methods = ['onBeforeRequest','onBeforeSendHeaders','onSendHeaders','onHeadersReceived','onResponseStarted','onBeforeRedirect','onCompleted','onErrorOccurred']

let self
export default class ChromeWebRequest {
  constructor(appId){
    self = this
    this.appId = appId
    ipcMain.on('chrome-webNavigation-onCreatedNavigationTarget',(e,tab)=>{
      console.log(tab)
      for(let cont of webContents.getAllWebContents()){
        cont.send('chrome-webRequestBG-add-tab',tab)
      }
    })
  }



}

