import process from './process'
import {ipcRenderer as ipc} from 'electron';
import localForage from "../LocalForage";
import uuid from 'node-uuid';
import React from 'react';
import ReactDOM from 'react-dom';
import path from 'path';
import moment from 'moment';
import {StickyContainer, Sticky} from 'react-sticky';
import {Menu, Segment, Input} from 'semantic-ui-react';
const baseURL = 'chrome-extension://dckpbojndfoinamcdamhkjhnjnmjkfjd'

import InfiniteTree from '../render/react-infinite-tree';
import rowRenderer from '../render/react-infinite-tree/renderer';

const isMain = location.href.startsWith("chrome://brave//")

if(!isMain){
  localForage.getItem('favicon-set').then(setTime=>{
    ipc.send("favicon-get",setTime ? parseInt(setTime) : null)
    ipc.once("favicon-get-reply",(e,ret)=>{
      localForage.setItem('favicon-set',Date.now().toString())
      for(let [k,v] of Object.entries(ret)){
        localForage.setItem(k,v)
      }
    })
  })
}

async function faviconGet(x){
  return x.favicon == "resource/file.png" ? (void 0) : x.favicon && (await localForage.getItem(x.favicon))
}


const convertUrlMap = new Map([
  ['chrome-extension://dckpbojndfoinamcdamhkjhnjnmjkfjd/top.html',''],
  ['chrome-extension://dckpbojndfoinamcdamhkjhnjnmjkfjd/blank.html','about:blank'],
  ['chrome-extension://dckpbojndfoinamcdamhkjhnjnmjkfjd/favorite.html','chrome://bookmarks/'],
  ['chrome-extension://dckpbojndfoinamcdamhkjhnjnmjkfjd/favorite_sidebar.html','chrome://bookmarks-sidebar/'],
  ['chrome-extension://dckpbojndfoinamcdamhkjhnjnmjkfjd/history.html','chrome://history/'],
  ['chrome-extension://dckpbojndfoinamcdamhkjhnjnmjkfjd/history_full.html','chrome://history-fulltext/'],
  ['chrome-extension://dckpbojndfoinamcdamhkjhnjnmjkfjd/history_sidebar.html','chrome://history-sidebar/'],
  ['chrome-extension://dckpbojndfoinamcdamhkjhnjnmjkfjd/explorer.html','chrome://explorer/'],
  ['chrome-extension://dckpbojndfoinamcdamhkjhnjnmjkfjd/explorer_sidebar.html','chrome://explorer-sidebar/'],
  ['chrome-extension://dckpbojndfoinamcdamhkjhnjnmjkfjd/tabs_sidebar.html','chrome://tabs-sidebar/'],
  ['chrome-extension://dckpbojndfoinamcdamhkjhnjnmjkfjd/download.html','chrome://download/'],
  ['chrome-extension://dckpbojndfoinamcdamhkjhnjnmjkfjd/terminal.html','chrome://terminal/'],
  ['chrome-extension://dckpbojndfoinamcdamhkjhnjnmjkfjd/settings.html','chrome://settings/'],
  ['chrome-extension://dckpbojndfoinamcdamhkjhnjnmjkfjd/settings.html#general','chrome://settings#general'],
  ['chrome-extension://dckpbojndfoinamcdamhkjhnjnmjkfjd/settings.html#search','chrome://settings#search'],
  ['chrome-extension://dckpbojndfoinamcdamhkjhnjnmjkfjd/settings.html#tabs','chrome://settings#tabs'],
  ['chrome-extension://dckpbojndfoinamcdamhkjhnjnmjkfjd/settings.html#keyboard','chrome://settings#keyboard'],
  ['chrome-extension://dckpbojndfoinamcdamhkjhnjnmjkfjd/settings.html#extension','chrome://settings#extension'],
])

const convertUrlReg = /^chrome\-extension:\/\/dckpbojndfoinamcdamhkjhnjnmjkfjd\/(video|ace|bind)\.html\?url=([^&]+)/
const convertUrlPdfReg = /^chrome\-extension:\/\/jdbefljfgobbmcidnmpjamcbhnbphjnb\/content\/web\/viewer\.html\?file=(.+?)$/
const convertUrlPdfReg2 = /^chrome\-extension:\/\/jdbefljfgobbmcidnmpjamcbhnbphjnb\/comicbed\/index\.html#\?url=(.+?)$/

function convertURL(url){
  if(!url) return
  if(convertUrlMap.has(url)){
    return convertUrlMap.get(url)
  }
  else{
    const match = url.match(convertUrlReg)
    let matchPdf
    if(match){
      return decodeURIComponent(match[2])
    }
    else if(matchPdf = (url.match(convertUrlPdfReg) || url.match(convertUrlPdfReg2))){
      return decodeURIComponent(matchPdf[1])
    }
    return url
  }
}

function escapeRegExp(string){
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); // $& means the whole matched string
}

function getHistory(name){
  let cond
  switch(name){
    case 'Later than 30 days':
      cond = {end: moment().subtract(30, 'days').valueOf()}
      break;
    case '24 Hours Ago':
      cond = {start: moment().subtract(24, 'hours').valueOf()}
      break;
    case '24-48 Hours Ago':
      cond = {start: moment().subtract(48, 'hours').valueOf(),end: moment().subtract(24, 'hours').valueOf()}
      break;
    default:
      cond = {start: moment().subtract(parseInt(name), 'days').valueOf() ,end: moment().subtract(48, 'hours').valueOf()}
      break;
  }

  return new Promise((resolve,reject)=>{
    ipc.send('fetch-history',cond)
    ipc.once('history-reply',(event,ret)=>{
      resolve(ret)
    })
  })
}


function getAllHistory(){
  return new Promise((resolve,reject)=>{
    ipc.send('fetch-history',{})
    ipc.once('history-reply',(event,ret)=>{
      resolve(ret)
    })
  })
}

async function buildItem(h,nodePath){
  const name = h.title  || h.location
  return {
    name: `[${h.updated_at.slice(11,16)}] ${name && name.length > 55 ? `${name.substr(0, 55)}...` : name}`,
    url: convertURL(h.location),
    id: `${nodePath}/${h.location}`,
    favicon: await faviconGet(h),
    type: 'file'
  }
}

function wrapBuildItem(h,nodePath){
  h.updated_at = dateFormat(new Date(h.updated_at))
  h.yyyymmdd = h.updated_at.slice(0,10)
  return buildItem(h,nodePath)
}

function dateFormat(d) {
  const m = d.getMonth() + 1
  const da = d.getDate()
  const w = d.getDay()
  const h = d.getHours()
  const mi = d.getMinutes()
  const s = d.getSeconds()

  return `${d.getFullYear()}/${m < 10 ? '0'+ m : m}/${da < 10 ? '0'+ da : da} ${h < 10 ? '0'+ h : h}:${mi < 10 ? '0'+ mi : mi}:${s < 10 ? '0'+ s : s}`
}

async function getAllChildren(nodePath,name){
  const later24h = Date.now() - 60 * 60 * 24 * 1000
  const later24hData = {
    id: '24 Hours Ago',
    name: '24 Hours Ago',
    type : 'directory',
    children: []
  }
  const later48h = Date.now() - 60 * 60 * 48 * 1000
  const later48hData = {
    id: '24-48 Hours Ago',
    name: '24-48 Hours Ago',
    type : 'directory',
    children: []
  }
  const later07d = Date.now() - 60 * 60 * 24 * 7 * 1000
  const later07dData = {
    id: '7 Days Ago',
    name: '7 Days Ago',
    type : 'directory',
    children: []
  }
  const later30d = Date.now() - 60 * 60 * 24 * 30 * 1000
  const later30dData = {
    id: '30 Days Ago',
    name: '30 Days Ago',
    type : 'directory',
    children: []
  }
  const lastData = {
    id: 'Later than 30 Days',
    name: 'Later than 30 Days',
    type : 'directory',
    children: []
  }

  window.start = Date.now()
  const ret = name ? (await getHistory(name)) : (await getAllHistory())
  console.log((Date.now() - window.start)/1000)
  // console.log(treeBuild(ret,nodePath))
  const newChildren = []
  let pre = {location:false}
  for(let h of ret){
    const dirc = (h.updated_at > later24h ? later24hData :
      h.updated_at > later48h ? later48hData :
        h.updated_at > later07d ? later07dData :
          h.updated_at > later30d ? later30dData : lastData).children

    h.updated_at = dateFormat(new Date(h.updated_at))
    h.yyyymmdd = h.updated_at.slice(0,10)
    if(pre.yyyymmdd != h.yyyymmdd){
      dirc.push({
        id: `${nodePath}/${h.yyyymmdd}`,
        name: `[${h.yyyymmdd}]`,
        favicon: 'empty',
        type: 'file'
      })
    }
    if(h.location === pre.location){
      if(!pre.title) pre.title = h.title
      if(!pre.favicon) pre.favicon = h.favicon
      dirc[dirc.length-1] = await buildItem(pre,nodePath)
    }
    else{
      dirc.push(await buildItem(h,nodePath))
      pre = h
    }
  }
  console.log((Date.now() - window.start)/1000)
  return [later24hData,later48hData,later07dData,later30dData,lastData]
}


let treeAllData,loading,gData
export default class App extends React.Component {
  componentDidMount() {
    ReactDOM.findDOMNode(this.refs.stickey).style.height = "100%"
  }

  async onChange(e,data) {
    const prevState = await localForage.getItem("history-sidebar-open-node")
    e.preventDefault()
    if(!treeAllData) return
    if(loading){
      gData = data
      return
    }
    if(this.name){
      gData = data
      loading = true
      await this.refs.content.loadAllData(void 0,true)
      loading = false
      data = gData
      gData = (void 0)
    }
    clearTimeout(this.timer);
    this.timer = setTimeout(()=>{
      const regList = [...new Set(escapeRegExp(data.value).split(/[ 　]+/,-1).filter(x=>x))]
      const reg = new RegExp(regList.length > 1 ? `(?=.*${regList.join(")(?=.*")})`: regList[0],"i")
      console.log(reg)

      const tree = this.refs.content.refs.iTree.tree
      const openNodes = prevState ? prevState.split("\t",-1) : (void 0)

      const newTreeData = []
      for(let dirc of treeAllData){
        const newDirc = []
        let count = -1
        for(let ele of dirc.children){
          if(ele.favicon == "empty"){
            if(count == 0) newDirc.pop()
            newDirc.push(ele)
            count = 0
          }
          else{
            if(reg.test(`${ele.name}\t${ele.url}`)){
              newDirc.push(ele)
              count++
            }
          }
        }
        if(count == 0) newDirc.pop()
        newTreeData.push({
          id: dirc.id,
          name: dirc.name,
          type : dirc.type,
          children:newDirc
        })
      }
      console.log(newTreeData)
      tree.loadData(newTreeData,false,openNodes)

      localForage.setItem("history-sidebar-open-node",prevState)
    }, 200)
  }

  setName(name){
    this.name = name
  }

  render(){
    return <StickyContainer ref="stickey">
      {this.props.sidebar ?
        <Sticky>
          <div>
            <Menu pointing secondary >
              <Menu.Item as='a' href={`${baseURL}/favorite_sidebar.html`} key="favorite" icon="star"/>
              <Menu.Item key="history" icon="history" active={true}/>
              <Menu.Item as='a' href={`${baseURL}/tabs_sidebar.html`} key="tabs" icon="align justify"/>
              <Menu.Item as='a' href={`${baseURL}/explorer_sidebar.html`} key="file-explorer" icon="folder"/>
            </Menu>
            <Input ref='input' icon='search' placeholder='Search...' size="small" onChange={::this.onChange}/>
          </div>
        </Sticky> :  <Input ref='input' icon='search' placeholder='Search...' size="small" onChange={::this.onChange}/>}
      <Contents ref="content" onClick={this.props.onClick} cont={this.props.cont} setName={::this.setName}/>
    </StickyContainer>
  }
}

let selectedNodes = [];
class Contents extends React.Component {
  // tree = null;

  updatePreview(node) {
    console.log(node)
  }

  async updateData(data){
    const tree = this.refs.iTree.tree
    const node = this.searchNodeByUrl(data.location)
    if(node){
      tree.removeNode(node,void 0,true)
    }
    const parent = tree.getChildNodes()[0]
    const beforeNode = parent.getFirstChild()
    console.log(parent)
    tree.insertNodeAfter(await wrapBuildItem(data),beforeNode)
    const insertedNode = beforeNode.getNextSibling()
    this.map[insertedNode.url] = insertedNode
  }

  searchNodeByUrl(url){
    if(!this.map){
      this.map = {}
      const tree = this.refs.iTree.tree
      for(let n of tree.getChildNodes()){
        for(let node of tree.getChildNodes(n))
          if(node.type == "file"){
            this.map[node.url] = node
          }
      }
    }
    return this.map[url]
  }

  async loadAllData(name,notUpdate){
    this.props.setName(name)
    if(!name) this.loaded = true
    const prevState = await localForage.getItem("history-sidebar-open-node")
    const start = Date.now()
    const data = await getAllChildren('root',name)
    console.log(Date.now() - start)
    treeAllData = data
    if(!notUpdate){
      const tree = this.refs.iTree.tree
      localForage.setItem("history-sidebar-open-node",prevState)
      tree.loadData(data,false,prevState ? prevState.split("\t",-1) : ['24 Hours Ago'])
      console.log(Date.now() - start)
      console.log((Date.now() - window.start)/1000)
    }
    return treeAllData
  }

  async componentDidMount() {
    console.log(333000,this.props.onClick,this.props.cont)
    if(isMain && !this.props.onClick) return
    if(isMain){
      this.loaded = false
      await localForage.setItem("history-sidebar-open-node",'24 Hours Ago')
      this.loadAllData('24 Hours Ago')
      const self = this
      this.scrollEvent = function(e){
        if(self.loaded) return
        const scroll = this.scrollTop
        const range = this.scrollHeight - this.offsetHeight

        if(range - scroll < 300){
          self.loadAllData()
        }
      }
      document.querySelector('.infinite-tree.infinite-tree-scroll').addEventListener('scroll',this.scrollEvent,{passive:true})
    }
    else{
      this.loadAllData()
    }
    ipc.on("update-datas",(e,data)=>{
      this.updateData(data)
    })
  }

  componentWillUnmount() {
    if(isMain) {
      document.querySelector('.infinite-tree.infinite-tree-scroll').removeEventListener('scroll', this.scrollEvent, {passive: true})
    }
  }

  render() {
    return (
      <div style={{paddingLeft:4,paddingTop:4,width:this.props.cont ? '600px' : 'calc(100vw - 4px)'}}>
        <InfiniteTree
          ref="iTree"
          noDataText="Loading..."
          loadNodes={(parentNode, done) => {
            console.log(11,parentNode.id)
            getAllChildren(parentNode.id).then(children => done(null, children))
          }}
          rowRenderer={rowRenderer(0)}
          selectable={true} // Defaults to true
          shouldSelectNode={(node) => { // Defaults to null
            if (!node || (node === this.refs.iTree.tree.getSelectedNode())) {
              return false; // Prevent from deselecting the current node
            }
            return true;
          }}
          onClick={(event) => {
            const tree = this.refs.iTree.tree
            const currentNode = tree.getNodeFromPoint(event.x, event.y);
            if (!currentNode) {
              return;
            }


            const multipleSelectionMode = event.ctrlKey || event.metaKey;

            if (!multipleSelectionMode) {
              if (selectedNodes.length > 0) {
                // Call event.stopPropagation() to stop event bubbling
                event.stopPropagation();

                // Empty an array of selected nodes
                selectedNodes.forEach(selectedNode => {
                  selectedNode.state.selected = false;
                  tree.updateNode(selectedNode, {}, { shallowRendering: true });
                });
                selectedNodes = [];

                // Select current node
                tree.state.selectedNode = currentNode;
                currentNode.state.selected = true;
                tree.updateNode(currentNode, {}, { shallowRendering: true });

              }
              if(currentNode.type == 'file' && currentNode.favicon != "empty"){
                if(this.props.cont){
                  this.props.cont.hostWebContents.send('new-tab',this.props.cont.getId(),currentNode.url)
                  if(this.props.onClick) this.props.onClick()
                }
                else{
                  ipc.sendToHost("open-tab-opposite",currentNode.url,true)
                }
              }
              else{
                tree.toggleNode(currentNode);
              }
              return;
            }

            // Call event.stopPropagation() to stop event bubbling
            event.stopPropagation();

            const selectedNode = tree.getSelectedNode();
            if (selectedNodes.length === 0 && selectedNode) {
              selectedNodes.push(selectedNode);
              tree.state.selectedNode = null;
            }

            const index = selectedNodes.indexOf(currentNode);

            // Remove current node if the array length of selected nodes is greater than 1
            if (index >= 0 && selectedNodes.length > 1) {
              currentNode.state.selected = false;
              selectedNodes.splice(index, 1);
              tree.updateNode(currentNode, {}, { shallowRendering: true });
            }

            // Add current node to the selected nodes
            if (index < 0) {
              currentNode.state.selected = true;
              selectedNodes.push(currentNode);
              tree.updateNode(currentNode, {}, { shallowRendering: true });
            }
          }}
          onDoubleClick={(event) => {
            const target = event.target || event.srcElement; // IE8
            console.log('onDoubleClick', target);
          }}
          onKeyDown={(event) => {
            const tree = this.refs.iTree.tree
            const target = event.target || event.srcElement; // IE8
            console.log('onKeyDown', target);
            event.preventDefault();

            const node = tree.getSelectedNode();
            const nodeIndex = tree.getSelectedIndex();

            if (event.keyCode === 37) { // Left
              tree.closeNode(node);
            } else if (event.keyCode === 38) { // Up
              const prevNode = tree.nodes[nodeIndex - 1] || node;
              tree.selectNode(prevNode);
            } else if (event.keyCode === 39) { // Right
              tree.openNode(node);
            } else if (event.keyCode === 40) { // Down
              const nextNode = tree.nodes[nodeIndex + 1] || node;
              tree.selectNode(nextNode);
            }
          }}
          // onContentWillUpdate={() => {
          //   console.log('onContentWillUpdate');
          // }}
          // onContentDidUpdate={() => {
          //   this.updatePreview(this.refs.iTree.tree.getSelectedNode());
          // }}
          onOpenNode={(node) => {
            if(isMain && !this.loaded) this.loadAllData()
            localForage.setItem("history-sidebar-open-node",this.refs.iTree.tree.getOpenNodes().map(node=>node.id).join("\t"))
          }}
          onCloseNode={(node) => {
            if(isMain && !this.loaded) this.loadAllData()
            localForage.setItem("history-sidebar-open-node",this.refs.iTree.tree.getOpenNodes().map(node=>node.id).join("\t"))
          }}
          // onSelectNode={(node) => {
          //   this.updatePreview(node);
          // }}
        />
      </div>
    );
  }
}

ReactDOM.render(
  <App />,
  document.querySelector('#classic')
);
