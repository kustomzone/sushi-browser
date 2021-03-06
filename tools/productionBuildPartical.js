const sh = require('shelljs')
const path = require('path')
const fs = require('fs')
const glob = require("glob")

const MUON_VERSION = fs.readFileSync('../MUON_VERSION.txt').toString()
const APP_VERSION = fs.readFileSync('../VERSION.txt').toString()

const isWindows = process.platform === 'win32'
const isDarwin = process.platform === 'darwin'
const isLinux = process.platform === 'linux'
const outDir = 'release-packed'
const arch = 'x64'
const buildDir = `sushi-browser-${process.platform}-${arch}`
console.log(buildDir)

let appIcon
if (isWindows) {
  appIcon = 'res/app.ico'
} else if (isDarwin) {
  appIcon = 'res/app.icns'
} else {
  appIcon = 'res/app.png'
}


function escapeRegExp(string){
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}


function fileContentsReplace(file, reg, after) {
  if(typeof reg == "string"){
    reg = new RegExp(escapeRegExp(reg))
  }
  const datas = fs.readFileSync(file).toString()
  if (datas.match(reg)) {
    // console.log(file)
    const result = datas.replace(new RegExp(reg.toString().slice(1,-1), 'g'), after)
    fs.writeFileSync(file, result)
  }
}

function filesContentsReplace(files,reg,after){
  if(Array.isArray(files)){
    for (let file of files) {
      fileContentsReplace(file, reg, after);
    }
  }
  else{
    fileContentsReplace(files,reg,after)
  }
}


function build(){
  const platform = isLinux ? 'darwin,linux' : isWindows ? 'win32' : isDarwin ? 'darwin' : 'mas'
  const ret = sh.exec(`node ./node_modules/electron-packager/cli.js . ${isWindows ? 'brave' : 'sushi-browser'} --platform=${platform} --arch=x64 --overwrite --icon=${appIcon} --version=${MUON_VERSION}  --asar=true --app-version=${APP_VERSION} --build-version=${MUON_VERSION} --protocol="http" --protocol-name="HTTP Handler" --protocol="https" --protocol-name="HTTPS Handler" --version-string.ProductName="Sushi Browser" --version-string.Copyright="Copyright 2017, Sushi Browser" --version-string.FileDescription="Sushi" --asar-unpack-dir="{node_modules/{node-pty,youtube-dl/bin},node_modules/node-pty/**/*,resource/{bin,extension}/**/*}" --ignore="\\.(cache|babelrc|gitattributes|githug|gitignore|gitattributes|gitignore|gitkeep|gitmodules)|node_modules/(electron-installer-squirrel-windows|electron-installer-debian|node-gyp|npm|electron-download|electron-rebuild|electron-packager|electron-builder|electron-prebuilt|electron-rebuild|electron-winstaller-fixed|muon-winstaller|electron-installer-redhat|react-addons-perf|babel-polyfill|infinite-tree|babel-register|jsx-to-string|happypack|es5-ext|browser-sync-ui|gulp-uglify|devtron|electron$|deasync|webpack|babel-runtime|uglify-es|babel-plugin|7zip-bin|webdriverio|semantic-ui-react/(node_modules|src)|semantic-ui-react/dist/(commonjs|umd)|babili|babel-helper|react-dom|react|@types|@gulp-sourcemaps|js-beautify)|tools|sushi-browser-|release-packed|cppunitlite|happypack|es3ify"`)

  if(ret.code !== 0) {
    console.log("ERROR2")
    process.exit()
  }

  if (isWindows) {
    sh.mv(`brave-${process.platform}-${arch}`, buildDir)
    sh.mv(`${buildDir}/brave.exe`, `${buildDir}/sushi.exe`)
  }

  const pwd = sh.pwd().toString()
  if(isDarwin){
    sh.cd(`${buildDir}/sushi-browser.app/Contents/Resources`)
  }
  else{
    sh.cd(`${buildDir}/resources`)
  }
  if(sh.exec('asar e app.asar app').code !== 0) {
    console.log("ERROR5")
    process.exit()
  }
  sh.rm('app.asar')
  sh.rm('-rf','app/resource/bin')
  sh.rm('-rf','app/resource/extension')
  sh.rm('-rf','app/node_modules/node-pty')
  sh.rm('-rf','app/node_modules/youtube-dl/bin')
  // sh.cp(`${pwd}/resource/extensions.txt`, `app.asar.unpacked/resource/.`)

  if(sh.exec('asar pack app app.asar').code !== 0) {
    console.log("ERROR7")
    process.exit()
  }
  sh.rm('-rf','app')
  sh.cd(pwd)

  muonModify()

  if (isWindows) {
    const muonInstaller = require('muon-winstaller')
    const resultPromise = muonInstaller.createWindowsInstaller({
      appDirectory: buildDir,
      outputDirectory: outDir,
      title: 'Sushi Browser',
      authors: 'kura52',
      loadingGif: 'res/install.gif',
      // loadingGif: 'res/brave_splash_installing.gif',
      setupIcon: 'res/app.ico',
      iconUrl: 'https://sushib.me/favicon.ico',
      // signWithParams: format('-a -fd sha256 -f "%s" -p "%s" -t http://timestamp.verisign.com/scripts/timstamp.dll', path.resolve(cert), certPassword),
      noMsi: true,
      exe: 'sushi.exe'
    })
    resultPromise.then(() => {
      // sh.mv(`${outDir}/Setup.exe`,`${outDir}/sushi-browser-setup-${arch}.exe`)
    }, (e) => console.log(`No dice: ${e.message}`))
  }
  else if (isDarwin) {
    const identifier = fs.readFileSync(path.join(pwd,'../identifier.txt'))
    if (!identifier) {
      console.error('IDENTIFIER needs to be set to the certificate organization')
      process.exit(1)
    }

    if(sh.exec(`rm -f ${outDir}/sushi-browser.dmg`).code !== 0) {
      console.log("ERROR1")
      process.exit()
    }
    sh.cd(`${buildDir}/sushi-browser.app/Contents/Frameworks`)

    console.log(`codesign --deep --force --strict --verbose --sign ${identifier} *`)
    if(sh.exec(`codesign --deep --force --strict --verbose --sign ${identifier} *`).code !== 0) {
      console.log("ERROR2")
      process.exit()
    }
    sh.cd('../../..')

    if(sh.exec(`codesign --deep --force --strict --verbose --sign ${identifier} sushi-browser.app/`).code !== 0) {
      console.log("ERROR3")
      process.exit()
    }
    sh.cd('..')

    sh.mkdir('dist')
    console.log(`./node_modules/.bin/build --prepackaged="${buildDir}/sushi-browser.app" --mac=dmg --config=res/builderConfig.json`)
    if(sh.exec(`./node_modules/.bin/build --prepackaged="${buildDir}/sushi-browser.app" --mac=dmg --config=res/builderConfig.json`).code !== 0) {
      console.log("ERROR4")
      process.exit()
    }


    if(sh.exec(`ditto -c -k --sequesterRsrc --keepParent ${buildDir}/sushi-browser.app ${outDir}/sushi-browser-${APP_VERSION}.zip`).code !== 0) {
      console.log("ERROR6")
      process.exit()
    }


  }
  else if(isLinux){
    [`./node_modules/.bin/electron-installer-debian --src ${buildDir}/ --dest ${outDir}/ --arch amd64 --config res/linuxPackaging.json`,
      `./node_modules/.bin/electron-installer-redhat --src ${buildDir}/ --dest ${outDir}/ --arch x86_64 --config res/linuxPackaging.json`,
      `tar -jcvf ${outDir}/sushi-browser.tar.bz2 ./${buildDir}`].forEach(cmd=>{
      sh.exec(cmd, {async:true}, (code, stdout, stderr) => {
      })
    })
  }
}

function muonModify(){
  const dircs = []
  const pwd = sh.pwd().toString()
  dircs.push(buildDir)
  for(let dirc of dircs){
    const paths = glob.sync(`${pwd}/${dirc}/**/electron.asar`)
    console.log(paths)
    if(paths.length == 1){
      const base = paths[0].split("/").slice(0,-1).join("/")
      sh.cd(`${base}`)
      if(sh.exec('asar e electron.asar electron').code !== 0) {
        console.log("ERROR3")
        process.exit()
      }

      const file = path.join(sh.pwd().toString(),sh.ls('electron/browser/api/extensions.js')[0])

      const contents = fs.readFileSync(file).toString()
      const result = contents
        .replace('tabContents.close(tabContents)',"tabContents.hostWebContents && tabContents.hostWebContents.send('menu-or-key-events','closeTab',tabId)")
        .replace("evt.sender.send('chrome-tabs-create-response-' + responseId, tab.tabValue(), error)","evt.sender.send('chrome-tabs-create-response-' + responseId, tab && tab.tabValue(), error)")
        .replace('  if (updateProperties.active || updateProperties.selected || updateProperties.highlighted) {',
          `  if (updateProperties.active || updateProperties.selected || updateProperties.highlighted) {
    process.emit('chrome-tabs-updated-from-extension', tabId)`)
        .replace('  if (!error && createProperties.partition) {',`  if(!createProperties.openerTabId){
    const cont = win.webContents
    const key = Math.random().toString()
    ipcMain.once(\`get-focused-webContent-reply_${key}\`,(e,tabId)=>{
      const opener = webContents.fromTabID(tabId)
      ses = opener.session
      if (!error && createProperties.partition) {
        // createProperties.partition always takes precendence
        ses = session.fromPartition(createProperties.partition, {
          parent_partition: createProperties.parent_partition
        })
        // don't pass the partition info through
        delete createProperties.partition
        delete createProperties.parent_partition
      }

      if (error) {
        console.error(error)
        return cb(null, error)
      }

      createProperties.userGesture = true

      try {
        // handle url, active, index and pinned in browser-laptop
        webContents.createTab(
          win.webContents,
          ses,
          createProperties,
          (tab) => {
            if (tab) {
              cb(tab)
            } else {
              cb(null, 'An unexpected error occurred')
            }
          }
        )
      } catch (e) {
        console.error(e)
        cb(null, 'An unexpected error occurred: ' + e.message)
      }
    })
    cont.send('get-focused-webContent',key,void 0)
    return
  }

  if (!error && createProperties.partition) {`)


      fs.writeFileSync(file,result)

      const initFile = path.join(sh.pwd().toString(),sh.ls('electron/browser/init.js')[0])
      const contents2 = fs.readFileSync(initFile).toString()
      const result2 = contents2
        .replace('let packagePath = null',`let packagePath
const basePath = path.join(__dirname,'../..')
if(!fs.existsSync(path.join(basePath,'app.asar'))){
  const binPath = path.join(basePath,\`7zip/\${process.platform === 'win32' ? 'win' : process.platform === 'darwin' ? 'mac' : 'linux'}/7za\`)
  const execSync = require('child_process').execSync
  const dataPath = path.join(basePath,'app.asar.unpacked.7z')
  const result =  execSync(\`\${binPath} x -o"\${basePath}" "\${dataPath}"\`)
  fs.unlinkSync(dataPath)
  
  const dataPath2 = path.join(basePath,'app.asar.7z')
  const result2 =  execSync(\`\${binPath} x -o"\${basePath}" "\${dataPath2}"\`)
  fs.unlinkSync(dataPath2)
  
  fs.renameSync(path.join(basePath,'app'),path.join(basePath,'_app'))
}`)
      fs.writeFileSync(initFile,result2)
      sh.mv('app.asar.unpacked/resource/bin/7zip','.')

      if(sh.exec(`${isWindows ? '"C:/Program Files/7-Zip/7z.exe"' : '7z'} a -t7z -mx=9 app.asar.unpacked.7z app.asar.unpacked`).code !== 0) {
        console.log("ERROR1")
        process.exit()
      }
      sh.rm('-rf','app.asar.unpacked')

      if(sh.exec(`${isWindows ? '"C:/Program Files/7-Zip/7z.exe"' : '7z'} a -t7z -mx=9 app.asar.7z app.asar`).code !== 0) {
        console.log("ERROR2")
        process.exit()
      }
      sh.rm('-rf','app.asar')

      sh.mkdir('app')
      sh.cp('../../package.json','app/.')

      const file3 = path.join(sh.pwd().toString(),sh.ls('electron/browser/rpc-server.js')[0])

      const contents3 = fs.readFileSync(file3).toString()
      const result3 = contents3.replace('throw new Error(`Attempting','// throw new Error(`Attempting')

      fs.writeFileSync(file3,result3)

      if(sh.exec('asar pack electron electron.asar').code !== 0) {
        console.log("ERROR")
        process.exit()
      }
      sh.rm('-rf','electron')

    }

  }
  sh.cd(pwd)
}

const RELEASE_DIRECTORY = 'sushi-browser-release'
const start = Date.now()
sh.cd('../../')

// Move base directory
sh.cd(RELEASE_DIRECTORY)
const pwd = sh.pwd().toString()
console.log(pwd)

glob.sync(`${pwd}/**/*.js.map`).forEach(file=>{
  fs.unlinkSync(file)
})

sh.rm('-rf','resource/bin/7zip/linux')
sh.rm('-rf','resource/bin/aria2/linux')
sh.rm('-rf','resource/bin/ffmpeg/linux')

const plat = isWindows ? 'win' : isDarwin ? 'mac' : 'linux'
sh.cp('-Rf',`../bin/7zip/${plat}`,'resource/bin/7zip/.')
sh.cp('-Rf',`../bin/aria2/${plat}`,'resource/bin/aria2/.')
sh.cp('-Rf',`../bin/ffmpeg/${plat}`,'resource/bin/ffmpeg/.')

filesContentsReplace(`${pwd}/node_modules/youtube-dl/lib/youtube-dl.js`,"path.join(__dirname, '..', 'bin/details')","path.join(__dirname, '..', 'bin/details').replace(/app.asar([\\/\\\\])/,'app.asar.unpacked$1')")
filesContentsReplace(`${pwd}/node_modules/youtube-dl/lib/youtube-dl.js`,"(details.path) ? details.path : path.resolve(__dirname, '..', 'bin', details.exec)","((details.path) ? details.path : path.resolve(__dirname, '..', 'bin', details.exec)).replace(/app.asar([\\/\\\\])/,'app.asar.unpacked$1')")


build()



if(isDarwin){
  glob.sync(`${pwd}/${outDir}/sushi-browser*.zip`).forEach(file=>{
    sh.mv(file,`${outDir}/sushi-browser-${APP_VERSION}-mac-x64.zip`)
  })
}

if(isWindows){
  sh.mv(`${outDir}/sushi-browser-setup-x64.exe`,`${outDir}/sushi-browser-${APP_VERSION}-setup-x64.exe`)
  sh.exec(`"C:/Program Files/7-Zip/7z.exe" a sushi-browser-${APP_VERSION}-win-x64.zip sushi-browser-win32-x64`)
}