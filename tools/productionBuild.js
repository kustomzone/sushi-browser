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

function fixForInferno(file){
  const contents2 = fs.readFileSync(file).toString()
  let result2 = contents2.replace(/e\.nativeEvent/g,'(e.nativeEvent || e)').replace(/\(e.nativeEvent \|\| e\) =/g,'e.nativeEvent =')
  fs.writeFileSync(file,result2)
}

function build(){
  const platform = isLinux ? 'linux' : isWindows ? 'win32' : isDarwin ? 'darwin' : 'mas'
  const ret = sh.exec(`node ./node_modules/electron-packager/cli.js . ${isWindows ? 'brave' : 'sushi-browser'} --platform=${platform} --arch=x64 --overwrite --icon=${appIcon} --version=${MUON_VERSION}  --asar=true --app-version=${APP_VERSION} --build-version=${MUON_VERSION} --protocol="http" --protocol-name="HTTP Handler" --protocol="https" --protocol-name="HTTPS Handler" --version-string.ProductName="Sushi Browser" --version-string.Copyright="Copyright 2017, Sushi Browser" --version-string.FileDescription="Sushi" --asar-unpack-dir="{node_modules/{node-pty,youtube-dl/bin},node_modules/node-pty/**/*,resource/{bin,extension}/**/*}" --ignore="\\.(cache|babelrc|gitattributes|githug|gitignore|gitattributes|gitignore|gitkeep|gitmodules)|node_modules/(electron-installer-squirrel-windows|electron-installer-debian|node-gyp|npm|electron-download|electron-rebuild|electron-packager|electron-builder|electron-prebuilt|electron-rebuild|electron-winstaller-fixed|muon-winstaller|electron-installer-redhat|react-addons-perf|babel-polyfill|infinite-tree|babel-register|jsx-to-string|happypack|es5-ext|browser-sync-ui|gulp-uglify|devtron|electron$|deasync|webpack|babel-runtime|uglify-es|babel-plugin|7zip-bin|webdriverio|semantic-ui-react/(node_modules|src)|semantic-ui-react/dist/(commonjs|umd)|babili|babel-helper|react-dom|react|@types|@gulp-sourcemaps|js-beautify)|tools|sushi-browser-|release-packed|cppunitlite|happypack|es3ify"`)

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

  if(ret.code !== 0) {
    console.log("ERROR2")
    process.exit()
  }


  if (isWindows) {
    sh.mv(`brave-${process.platform}-${arch}`,buildDir)
    sh.mv(`${buildDir}/brave.exe`,`${buildDir}/sushi.exe`)
    const muonInstaller = require('muon-winstaller')
    const resultPromise = muonInstaller.createWindowsInstaller({
      appDirectory: buildDir,
      outputDirectory: outDir,
      title: 'Sushi Browser',
      authors: 'kura52',
      // loadingGif: 'res/brave_splash_installing.gif',
      setupIcon: 'res/app.ico',
      // iconUrl: 'https://brave.com/favicon.ico',
      // signWithParams: format('-a -fd sha256 -f "%s" -p "%s" -t http://timestamp.verisign.com/scripts/timstamp.dll', path.resolve(cert), certPassword),
      noMsi: true,
      exe: 'sushi.exe'
    })
    resultPromise.then(() => {
      sh.mv(`${outDir}/Setup.exe`,`${outDir}/sushi-browser-setup-${arch}.exe`)
    }, (e) => console.log(`No dice: ${e.message}`))
  }
  else if (isDarwin) {

  }
  else if(isLinux){
    [`./node_modules/.bin/electron-installer-debian --src ${buildDir}/ --dest ${outDir}/ --arch amd64 --config res/linuxPackaging.json`,
      `./node_modules/.bin/electron-installer-redhat --src ${buildDir}/ --dest ${outDir}/ --arch x86_64 --config res/linuxPackaging.json`,
      `tar -jcvf ${outDir}/sushi-browser-${APP_VERSION}.tar.bz2 ./${buildDir}`].forEach(cmd=>{
      sh.exec(cmd, {async:true}, (code, stdout, stderr) => {

      })
    })
  }
}

function muonModify(){
  const dircs = []
  const pwd = sh.pwd().toString()
  if (isWindows) {
    dircs.push(buildDir)
  }
  else if(isLinux){
    dircs.push(buildDir)
    dircs.push(`sushi-browser-darwin-${arch}`)
  }
  for(let dirc of dircs){
    const paths = glob.sync(`${pwd}/${dirc}/**/electron.asar`)
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

//       const initFile = path.join(sh.pwd().toString(),sh.ls('electron/browser/init.js')[0])
//       const contents2 = fs.readFileSync(initFile).toString()
//       const result2 = contents2
//         .replace('let packagePath = null',`let packagePath
// const basePath = path.join(__dirname,'../..')
// if(!fs.existsSync(path.join(basePath,'app.asar'))){
//   const binPath = path.join(basePath,\`7zip/\${process.platform === 'win32' ? 'win' : process.platform === 'darwin' ? 'mac' : 'linux'}/7za\`)
//   const execSync = require('child_process').execSync
//   const dataPath = path.join(basePath,'app.asar.unpacked.7z')
//   const result =  execSync(\`\${binPath} x -o\${basePath} \${dataPath}\`)
//   fs.unlinkSync(dataPath)
//
//   const dataPath2 = path.join(basePath,'app.asar.7z')
//   const result2 =  execSync(\`\${binPath} x -o\${basePath} \${dataPath2}\`)
//   fs.unlinkSync(dataPath2)
//
//   fs.renameSync(path.join(basePath,'app'),path.join(basePath,'_app'))
// }`)
//       fs.writeFileSync(initFile,result2)
//       sh.mv('app.asar.unpacked/resource/bin/7zip','.')
//
//       if(sh.exec('7z a -t7z -mx=9 app.asar.unpacked.7z app.asar.unpacked').code !== 0) {
//         console.log("ERROR1")
//         process.exit()
//       }
//       sh.rm('-rf','app.asar.unpacked')
//
//       if(sh.exec('7z a -t7z -mx=9 app.asar.7z app.asar').code !== 0) {
//         console.log("ERROR2")
//         process.exit()
//       }
//       sh.rm('-rf','app.asar')
//
//       sh.mkdir('app')
//       sh.cp('../../package.json','app/.')

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

// Create release directory
sh.rm('-rf', RELEASE_DIRECTORY);
sh.cp('-R', 'sushi-browser', RELEASE_DIRECTORY)


// Move base directory
sh.cd(RELEASE_DIRECTORY)
const pwd = sh.pwd().toString()
console.log(pwd)

// sh.rm('-rf','sushi-browser-*')
// build()



// Remove No Develop Directory
sh.rm('-rf', 'release-packed')
sh.mkdir('release-packed')
sh.rm('-rf', 'lib')
sh.rm('-rf', 'dist')
sh.rm('-rf', '.git')
sh.rm('-rf', '.idea')
sh.rm('-rf', 'ja')
sh.rm('-rf', 'README.md')
sh.rm('resource/extension/default/1.0_0/js/vendor.dll.js')

sh.rm('-rf','resource/bin/aria2/mac')
sh.rm('-rf','resource/bin/aria2/win')

sh.rm('-rf','resource/bin/ffmpeg/mac')
sh.rm('-rf','resource/bin/ffmpeg/win')

sh.rm('-rf','resource/bin/7zip/mac')
sh.rm('-rf','resource/bin/7zip/win')

glob.sync(`${pwd}/**/*.js.map`).forEach(file=>{
  fs.unlinkSync(file)
})

const chrome_valid = new RegExp(`^(${['994289308992179865',
  '1725149567830788547',
  '4643612240819915418',
  '4256316378292851214',
  '2019718679933488176',
  '782057141565633384',
  '5116628073786783676',
  '1465176863081977902',
  '3007771295016901659',
  '5078638979202084724',
  '4589268276914962177',
  '3551320343578183772',
  '2448312741937722512',
  '1524430321211440688',
  '42126664696688958',
  '2663302507110284145',
  '3635030235490426869',
  '4888510611625056742',
  '5860209693144823476',
  '5846929185714966548',
  '7955383984025963790',
  '3128230619496333808',
  '3391716558283801616',
  '6606070663386660533',
  '9011178328451474963',
  '9065203028668620118',
  '2473195200299095979',
  '1047431265488717055',
  '9218430445555521422',
  '8926389886865778422',
  '2893168226686371498',
  '4289540628985791613',
  '3095995014811312755',
  '59174027418879706',
  '6550675742724504774',
  '5453029940327926427'].join("|")})`)



glob.sync(`${pwd}/resource/extension/default/1.0_0/locales/**/chrome.properties`).forEach(file=>{
  const datas = fs.readFileSync(file).toString()
  const ret = []
  for(let line of datas.split("\n")){
    if(line.match(chrome_valid)) ret.push(line)
  }
  fs.writeFileSync(file, ret.join("\n"))
})


// Remove vender-all
const htmls = glob.sync(`${pwd}/resource/extension/default/**/*.html`).concat(glob.sync(`${pwd}/*.html`))
for(let html of htmls){
  filesContentsReplace(html,/<script src="js\/vendor\.dll\.js"><\/script>/,'<!--<script src="js/vendor.dll.js"></script>-->')
  filesContentsReplace(html,/<script src="dist\/vendor\.dll\.js"><\/script>/,'<!--<script src="dist/vendor.dll.js"></script>-->')
  filesContentsReplace(html,/<!--<!--<script src="js\/vendor\.dll\.js"><\/script>-->-->/,'<!--<script src="js/vendor.dll.js"></script>-->')
  filesContentsReplace(html,/<!--<!--<script src="dist\/vendor\.dll\.js"><\/script>-->-->/,'<!--<script src="dist/vendor.dll.js"></script>-->')
}

filesContentsReplace(`${pwd}/brave/extension/extensions.js`,/true \|\| !fs.existsSync\(appPath\)/,'!fs.existsSync(appPath)')

// development to production
filesContentsReplace([`${pwd}/index.html`,`${pwd}/resource/extension/default/1.0_0/js/process.js`],
  /env : {NODE_ENV: 'development'},/,"env : {NODE_ENV: 'production'},")

const webpackFile = `${pwd}/webpack.config.js`
filesContentsReplace(webpackFile,/\/\/ +?merge\(/,'merge(')
filesContentsReplace(webpackFile,/\/\/ +?baseConfig2.plugins.shift()/,'baseConfig2.plugins.shift()')
filesContentsReplace(webpackFile,/\/\/ +?new webpack\.DefinePlugin\({'process.env':/,"new webpack.DefinePlugin({'process.env':")
filesContentsReplace(webpackFile,/new webpack\.DllReferencePlugin/,'// new webpack.DllReferencePlugin')
filesContentsReplace(webpackFile,/devtool:/,'// devtool:')


// Remove hidden file
glob.sync(`${pwd}/**/.directory`).forEach(file=>{
  if(file.includes(RELEASE_DIRECTORY)){
    sh.rm(file)
  }
})

// Replace console.log
const jsFiles = glob.sync(`${pwd}/src/**/*.js`)
filesContentsReplace(jsFiles,/console\.log\(/,'//debug(')
filesContentsReplace(jsFiles,/window.debug = require\('debug'\)\('info'\)/,"// window.debug = require('debug')('info')")
filesContentsReplace(jsFiles,/global.debug = require\('debug'\)\('info'\)/,"// global.debug = require('debug')('info')")


// Babel Use babili
filesContentsReplace(`${pwd}/.babelrc`,/"babel\-preset\-stage\-2"\]/,'"babel-preset-stage-2","babili"]')
filesContentsReplace(`${pwd}/.babelrc`,'] // ,["lodash", { "id": ["lodash", "semantic-ui-react"] }]]',',["lodash", { "id": ["lodash", "semantic-ui-react"] }]]')

console.log((Date.now() - start)/1000)


filesContentsReplace(`${pwd}/node_modules/youtube-dl/lib/youtube-dl.js`,"path.join(__dirname, '..', 'bin/details')","path.join(__dirname, '..', 'bin/details').replace(/app.asar([\\/\\\\])/,'app.asar.unpacked$1')")
filesContentsReplace(`${pwd}/node_modules/youtube-dl/lib/youtube-dl.js`,"(details.path) ? details.path : path.resolve(__dirname, '..', 'bin', details.exec)","((details.path) ? details.path : path.resolve(__dirname, '..', 'bin', details.exec)).replace(/app.asar([\\/\\\\])/,'app.asar.unpacked$1')")


// Build Files
const compiledJsFiles = ['resource/extension/default/1.0_0/js/top.js',
  'resource/extension/default/1.0_0/js/download.js',
  'resource/extension/default/1.0_0/js/history.js',
  'resource/extension/default/1.0_0/js/historyFull.js',
  'resource/extension/default/1.0_0/js/historySidebar.js',
  'resource/extension/default/1.0_0/js/explorerMenu.js',
  'resource/extension/default/1.0_0/js/explorerSidebar.js',
  'resource/extension/default/1.0_0/js/favoriteInit.js',
  'resource/extension/default/1.0_0/js/favoriteSidebar.js',
  'resource/extension/default/1.0_0/js/terminal.js',
  'resource/extension/default/1.0_0/js/tabsSidebar.js',
  'resource/extension/default/1.0_0/js/sync.js',
  'resource/extension/default/1.0_0/js/settings.js',
  'lib/render/base.js']

filesContentsReplace(webpackFile,/merge\({fileName:"([^b])/,'// merge({fileName:"$1')


sh.exec('node ./node_modules/gulp/bin/gulp.js --color --gulpfile gulpfile.release.js default', {async:true}, (code, stdout, stderr) => {
})

if(sh.exec('webpack').code !== 0) {
  console.log("ERROR1")
  process.exit()
}

filesContentsReplace(`${pwd}/.babelrc`,/"babel\-preset\-stage\-2","babili"\]/,'"babel-preset-stage-2"]')

const promises = []

for(let f of compiledJsFiles.slice(0,-1)){
  filesContentsReplace(webpackFile,/\/\/ +?merge\(/,'merge(')
  filesContentsReplace(webpackFile,/merge\({/,'// merge({')
  const fsplit = f.split("/")
  const fname = fsplit[fsplit.length - 1]
  const webpackName = `webpack.${fname}.config.js`
  sh.cp('webpack.config.js',webpackName)
  filesContentsReplace(`${pwd}/${webpackName}`,new RegExp(`// merge\\({fileName:"(${fname})`),'merge({fileName:"$1')

  const promise = new Promise((resolve,reject)=>{
    console.log(`webpack --config ${webpackName}`)
    sh.exec(`webpack --config ${webpackName}`, {async:true}, (code, stdout, stderr) => {
      resolve()
    })
  })
  promises.push(promise)
}

//Uglify build files
Promise.all(promises).then(_=>{
  compiledJsFiles.forEach(f=>fixForInferno(`${pwd}/${f}`))

  const promises = []
  for(let f of compiledJsFiles.slice(0,-1)){
    const promise = new Promise((resolve,reject)=>{
      sh.exec(`uglifyjs --compress --mangle -o ${f} -- ${f}`, {async:true}, (code, stdout, stderr) => {
        resolve()
      })
    })
    promises.push(promise)
  }

  Promise.all(promises).then(_ => {
    sh.rm('-rf','sushi-browser-*')
    build()

  })
})

