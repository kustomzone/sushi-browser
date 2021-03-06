/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this file,
 * You can obtain one at http://mozilla.org/MPL/2.0/. */

const path = require('path')
const moment = require('moment')
const fs = require('fs')
const {dialog,app,BrowserWindow,ipcMain} = require('electron')
import {favorite} from './databaseFork'
const os = require('os')

function createBookmarkHTML(ret) {
  const breakTag = os.EOL
  const title = 'Bookmarks'

  return `<!DOCTYPE NETSCAPE-Bookmark-file-1>
<!-- This is an automatically generated file. It will be read and overwritten. DO NOT EDIT! -->
<META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
<TITLE>${title}</TITLE>
<H1>${title}</H1>
<DL><p>
    <DT><H3 PERSONAL_TOOLBAR_FOLDER="true">Bookmarks Bar</H3>
${ret.join(breakTag)}
</DL><p>`
}

ipcMain.on('export-bookmark',_=>{
  const focusedWindow = BrowserWindow.getFocusedWindow()
  const fileName = moment().format('DD_MM_YYYY') + '.html'
  const defaultPath = path.join(app.getPath('downloads'), fileName)

  dialog.showSaveDialog(focusedWindow, {
    defaultPath: defaultPath,
    filters: [{
      name: 'HTML',
      extensions: ['html']
    }]
  }, (fileName) => {
    if (fileName) {
      getAllFavorites().then(ret=>{
        fs.writeFileSync(fileName, createBookmarkHTML(ret))
      })
    }
  })
})


async function recurSelect(keys,indent){
  const favorites = await favorite.find({key:{$in: keys}})
  const space = '  '.repeat(indent)
  const ret = []
  for(let x of favorites){
    if(x.is_file){
      ret.push(`${space}<DT><A HREF="${x.url}" ADD_DATE="${Math.round(x.created_at / 1000)}">${x.title}</A>`)
    }
    else if(x.children.length > 0){
      if(keys[0]!='root'){
        ret.push(`${space}<DT><H3 ADD_DATE="${Math.round(x.created_at / 1000)}" LAST_MODIFIED="${Math.round(x.updated_at / 1000)}">${x.title}</H3>`)
      }
      ret.push(`${space}<DL><p>`)
      ret.push(...(await recurSelect(x.children,indent+2)))
      ret.push(`${space}</DL><p>`)
    }
  }
  return ret
}

async function getAllFavorites(){
  let list = []
  const ret = await recurSelect(['root'],2)
  return ret
}