const path = require('path')
const React = require('react')
import ReactDOM from 'react-dom'
const {Component} = React
const ipc = require('electron').ipcRenderer
const PubSub = require('./pubsub');
const {remote} = require('electron');
const {Menu} = remote
const fs = remote.require('fs')
const BrowserPageSearch = require('./BrowserPageSearch')
const BrowserPageStatus = require('./BrowserPageStatus')
const AutofillPopup = require('./AutofillPopup')

function webviewHandler (self, fnName) {
  return function (e) {
    if (self.props[fnName])
      self.props[fnName](e, self.props.tab.page, self.props.pageIndex)
  }
}

const webviewEvents = {
  'guest-ready': 'onGuestReady',
  'load-commit': 'onLoadCommit',
  'did-start-loading': 'onDidStartLoading',
  'did-stop-loading': 'onDidStopLoading',
  'did-finish-load': 'onDidFinishLoading',
  'did-fail-load': 'onDidFailLoad',
  'did-fail-provisional-load':'onDidFailLoad',
  'did-frame-finish-load': 'onDidFrameFinishLoad',
  'did-get-redirect-request': 'onDidGetRedirectRequest',
  'dom-ready': 'onDomReady',
  'page-title-updated': 'onPageTitleSet',
  'close': 'onClose',
  'destroyed': 'onDestroyed',
  'ipc-message': 'onIpcMessage',
  'console-message': 'onConsoleMessage',
  'page-favicon-updated': 'onFaviconUpdate',
  'new-window': "onNewWindow",
  'will-navigate' : "onWillNavigate",
  'did-navigate' : "onDidNavigate",
  'load-start' : "onLoadStart",
  'did-navigate-in-page' : 'onDidNavigateInPage',
  'update-target-url' : 'onUpdateTargetUrl'
}

class BrowserPage extends Component {
  constructor(props) {
    super(props)
    this.state = {isSearching: false,src:"",adblock:false}
    this.wvEvents = {}
  }


  componentDidMount() {
    const webview = this.refs.webview

  // webview.addEventListener('did-fail-provisional-load', (e) => {
  //   console.log(e)
  // })
    webview.plugins = true
    // webview.userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.109 Safari/537.366'

    if(this.props.tab.guestInstanceId){
      webview.attachGuest(this.props.tab.guestInstanceId)
    }

    if(this.props.tab.privateMode) webview.partition = this.props.tab.privateMode
    console.log(this.props.tab.privateMode)

    for (var k in webviewEvents)
      webview.addEventListener(k, webviewHandler(this, webviewEvents[k]))

    this.wvEvents['ipc-message'] = (e, page) =>{
      if(e.channel == 'webview-scroll'){
        PubSub.publishSync("scroll-sync-webview",{sync:this.props.tab.sync,...e.args[0]})
      }
    }
    webview.addEventListener('ipc-message',this.wvEvents['ipc-message'])

    this.wvEvents['found-in-page'] = (e) => {
      if (e.result.activeMatchOrdinal) {
        this.setState({result_string: `${e.result.activeMatchOrdinal}/${e.result.matches}`})
      }
      else{
        this.setState({result_string: "0/0"})
      }
    }
      webview.addEventListener('found-in-page',this.wvEvents['found-in-page'] )

    const tokenDidStartLoading = PubSub.subscribe(`did-start-loading_${this.props.tab.key}`,_=>{
      this.setState({isSearching: false})
    })
    //
    // webview.addEventListener('will-detach',e=>console.log('will-detach',e))
    // webview.addEventListener('did-detach',e=>console.log('did-detach',e))
    // webview.addEventListener('guest-ready',e=>console.log('guest-ready',e))

    this.tokenWebviewKeydown = PubSub.subscribe("webview-keydown",(msg,e)=>{
      if(e.wv === webview) this.onHandleKeyDown(e.event)
    })

    this.refs.browserPage.addEventListener('wheel',::this.handleWheel,{passive: true})

    this.props.tab.returnWebView(webview)
    this.props.tab.guestInstanceId = (void 0)

    PubSub.publish(`regist-webview_${this.props.k}`,this.props.tab)

  }

  componentWillUnmount() {
    for (var k in webviewEvents)
      this.refs.webview.removeEventListener(k, webviewHandler(this, webviewEvents[k]))

    for(var [k,v] in this.wvEvents){
      this.refs.webview.removeEventListener(k, v)
    }

    PubSub.unsubscribe(this.tokenWebviewKeydown)
    PubSub.unsubscribe(this.tokenNotification)
    PubSub.unsubscribe(this.tokenDidStartLoading)
    }


  // shouldComponentUpdate(nextProps, nextState) {
  //   const ret = !(this.isActive === nextProps.isActive &&
  //   this.isSearching === nextProps.page.isSearching &&
  //   this.location === nextProps.page.location &&
  //   this.statusText === nextProps.page.statusText)
  //
  //   this.isActive = this.props.isActive
  //   this.isSearching = this.props.page.isSearching
  //   this.location = this.props.page.location
  //   this.statusText = this.props.page.statusText
  //   return ret
  // }

  onPageSearch(query,next=true) {
    if(query === ""){
      this.refs.webview.stopFindInPage('clearSelection')
      this.previous_text = ""
      this.setState({result_string: ""})
    }
    else if (this.previous_text === query) {
      this.refs.webview.findInPage(query, {findNext: true,forward: next});
    }
    else {
      this.previous_text = query;
      this.refs.webview.findInPage(query);
    }
  }

  onHandleKeyDown(e){
    if (e.ctrlKey && e.keyCode == 70) { // Ctrl+F
      this.setState({isSearching: true})
      this.refs.browserPage.querySelector('.browser-page-search input').focus()
      if(e.stopPropagation) e.stopPropagation()
    }
    else if (e.keyCode == 27) { // ESC
      this.onClose(e)
    }
    else if (e.keyCode == 116) { // F5
      this.refs.webview.reload()
    }
  }

  handleWheel(e){
    if(!e.ctrlKey) return
    const webContents = this.getWebContents(this.props.tab)
    if(webContents) {
      console.log(webContents)
      if(e.deltaY > 0){
        webContents.zoomOut()
      }
      else{
        webContents.zoomIn()
      }
      const percent = webContents.getZoomPercent()
      PubSub.publish(`zoom_${this.props.tab.key}`,percent)
    }
  }

  onClose(e){
    this.refs.webview.stopFindInPage('clearSelection')
    this.previous_text = ""
    this.setState({result_string: "", isSearching: false})
  }

  getWebContents(tab){
    if(!tab.wv || !tab.wvId) return
    return global.currentWebContents[tab.wvId]
  }

  render() {
    // console.log("BrowserPage")
    // const preload = path.join(__dirname, './preload/mainPreload.js')
    return <div className="browser-page" ref="browserPage"  onKeyDown={::this.onHandleKeyDown}>
      <BrowserPageSearch isActive={this.state.isSearching} onPageSearch={::this.onPageSearch} progress={this.state.result_string} onClose={::this.onClose}/>
      <webview ref="webview" className={`w${this.props.k2}`} />
      <BrowserPageStatus page={this.props.tab.page}/>
      <AutofillPopup k={this.props.k} pos={this.props.pos}/>
    </div>
  }
}


export default {BrowserPage : BrowserPage}