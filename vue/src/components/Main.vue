<template>
  <div>
    <div>
      <div style="padding: 15px;border-bottom: 1px solid #ddd">
        <el-upload
            style="display: inline-block;margin-right: 10px"
            :action="uploadUrl"
            :headers="{ token: user.token }"
            :show-file-list="false"
            :on-success="handleAvatarSuccess"
        >
          <el-button type="primary">上传文件</el-button>
        </el-upload>
        <el-button type="primary" plain @click="addfolder" v-if="category === 'all'">新建文件夹</el-button>
        <el-button type="danger" plain @click="delBath">批量删除</el-button>
      </div>
    </div>

    <div style="padding: 15px">
      <a style="color: #666" :href="'/front/home?category='+category"><span>全部文件 <i class="el-icon-arrow-right" v-if="folders.length"></i></span></a>
      <a style="color: #666" :href="'/front/home?category='+category+'&folderId='+item.folderId" v-for="(item,index) in folders" :key="item.id">{{item.name}} <i class="el-icon-arrow-right" v-if="index !== folders.length-1"></i></a>
    </div>

    <div>
      <el-table stripe :data="tableData" @selection-change="handleSelectionChange">
        <el-table-column type="selection" width="55" align="center"></el-table-column>
        <el-table-column label="名称">
          <template v-slot="scope">
            <div v-if="scope.row.unsave" >
              <i style="color: #409EFF" :class="typeList.find(v => v.text === scope.row.type)?.icon || 'el-icon-file'"></i>
              <el-input size="mini" style="width: 300px; margin: 0 5px" v-model="scope.row.name"></el-input>
              <el-button type="primary" size="mini" @click="save(scope.row)">确定</el-button>
              <el-button type="danger" size="mini" @click="cancel(scope.row)">取消</el-button>
            </div>

            <div style="display: flex; cursor: pointer" @click="openFile(scope.row)" v-else @mouseenter="mouseEnter(scope.row)" @mouseleave="mouseLeave(scope.row)">
              <div style="flex: 1">
                <i style="color: #409EFF" :class="typeList.find(v => v.text === scope.row.type)?.icon || 'el-icon-file'"></i>
                <span v-if="!scope.row.unsave" style="margin-left: 5px">{{ scope.row.name }}</span>
              </div>
              <div style="color: #409EFF; font-size: 13px" v-if="scope.row.optShow">
                <el-tooltip content="分享" effect="light" :open-delay="1000">
                  <i class="el-icon-share" style="margin-right: 10px; cursor: pointer" @click.stop="share(scope.row)"></i>
                </el-tooltip>
                <el-tooltip content="下载" effect="light" :open-delay="1000" v-if="scope.row.folder === '否'">
                  <i class="el-icon-download" style="margin-right: 10px; cursor: pointer" @click.stop="download(scope.row.file)"></i>
                </el-tooltip>
                <el-tooltip content="删除" effect="light" :open-delay="1000">
                  <i class="el-icon-delete" style="margin-right: 10px; cursor: pointer" @click.stop="del(scope.row.id)"></i>
                </el-tooltip>
                <el-tooltip content="重命名" effect="light" :open-delay="1000">
                  <i class="el-icon-rename" style="margin-right: 10px; cursor: pointer" @click.stop="rename(scope.row)"></i>
                </el-tooltip>
                <el-tooltip content="复制" effect="light" :open-delay="1000">
                  <i class="el-icon-document-copy" style="cursor: pointer" @click.stop="copy(scope.row)"></i>
                </el-tooltip>
              </div>
            </div>
          </template>
        </el-table-column>
        <el-table-column prop="updateTime" label="修改时间" width="300"></el-table-column>
        <el-table-column prop="size" label="文件大小(KB)" width="300"></el-table-column>
      </el-table>
    </div>

    <el-dialog title="分享" :visible.sync="shareVisible" width="40%" :close-on-click-modal="false" destroy-on-close>
      <el-form label-width="100px" style="padding-right: 50px" :model="form">
        <el-form-item label="分享天数">
          <el-radio-group v-model="form.days">
            <el-radio :label="3">3天</el-radio>
            <el-radio :label="7">7天</el-radio>
            <el-radio :label="30">30天</el-radio>
          </el-radio-group>
        </el-form-item>
        <el-form-item label="复制链接" v-if="shareLink">
            <div style="display: flex">
              <el-input style="flex: 1" v-model="shareLink"></el-input>
              <el-button style="margin-left: 10px" type="primary" @click="copyLink(shareLink)">复制</el-button>
            </div>
        </el-form-item>
      </el-form>
      <div slot="footer" class="dialog-footer">
        <el-button @click="shareVisible = false">取 消</el-button>
        <el-button type="primary" @click="saveShare">确 定</el-button>
      </div>
    </el-dialog>
  </div>

</template>

<script>
export default {
  name: "Main",
  props:{
    typeList:null
  },
  data(){
    return{
      tableData:[],
      category:this.$route.query.category,
      folderId:this.$route.query.folderId,
      user: JSON.parse(localStorage.getItem('xm-user') || '{}'),
      uploadUrl:'',
      ids:[],
      folders:[],
      shareVisible:false,
      form:{},
      shareLink:''
    }
  },
  mounted() {
    this.load()
    this.uploadUrl=this.$baseUrl + '/diskFiles/add?folder=否'
    if(this.folderId){
      this.uploadUrl+='&folderId='+this.folderId
    }
  },
  // methods：本页面所有的点击事件或者其他函数定义区
  methods: {
    saveShare() {
      if(this.shareLink){
        this.shareVisible = false
        return
      }
      this.$request.post("/diskFiles/share/",this.form).then(res=>{
        if(res.code === '200'){
          this.$message.success('操作成功')
          let shareData = res.data
          let currentUrl = location.href.substring(0,location.href.indexOf('/front'))
          this.shareLink = currentUrl + '/front/openShare?code=' + shareData.code + '&shareID=' + shareData.id
          this.load()
        }else {
          this.$message.error(res.msg)
        }
      })
    },
    share(row){
      this.form=JSON.parse(JSON.stringify(row))
      this.form.days = 3
      this.shareLink = ''
      this.shareVisible=true
    },
    copyLink(link) {
      let _input = document.createElement("input");   // 直接构建input
      _input.value = link;  // 设置内容
      document.body.appendChild(_input);    // 添加临时实例
      _input.select();   // 选择实例内容
      document.execCommand("Copy");   // 执行复制
      document.body.removeChild(_input)
      this.$message.success("复制成功")
    },
    openFile(row){
      if(row.folder==='是'){
        location.href="/front/home?category="+this.category+"&folderId="+row.id
      } else {
        window.open(this.$baseUrl + '/diskFiles/preview/' + row.id)
      }
    },
    del(id){
      this.$confirm("您确定要删除吗？","确认删除",{type:"warning"}).then(response=>{
        this.$request.delete('/diskFiles/trash/'+id).then(res=>{
          if(res.code === '200'){
            this.$message.success('删除成功')
            this.load()
          }else {
            this.$message.error(res.msg)
          }
        })
      })
    },
    delBath(){
      if(!this.ids.length){
        this.$message.warning('请选择数据')
        return
      }
      this.$confirm("您确定批量删除这些数据吗？","确认删除",{type:"warning"}).then(response=>{
        this.$request.delete('/diskFiles/trash/bath/',{data:this.ids}).then(res=>{
          if(res.code === '200'){
            this.$message.success('删除成功')
            this.load()
          }else {
            this.$message.error(res.msg)
          }
        })
      })
    },
    copy(row){
      this.$request.post("/diskFiles/copy/" + row.id).then(res=>{
        if(res.code === '200'){
          this.$message.success('复制成功')
          this.load()
        }else {
          this.$message.error(res.msg)
        }
      })
    },
    mouseEnter(row) {
      if (!row.unsave) {
        this.$set(row, 'optShow', true)
      }
    },
    mouseLeave(row) {
      if (!row.unsave) {
        this.$set(row, 'optShow', false)
      }
    },
    rename(row){
      this.$set(row, 'unsave', true)
    },
    addfolder(){
      this.tableData.unshift({name:'',type:'folder',unsave:true})
    },
    cancel(row){
      row.unsave=false
      this.tableData.splice(0,1)
    },
    save(row){
      if(row.id){
        this.$request.put("/diskFiles/update",row).then(res=>{
          if(res.code === '200'){
            this.$message.success('重命名成功')
            this.load()
          }else {
            this.$message.error('重命名失败')
          }
        })
      }else{
        let url = "/diskFiles/add/?folder=是&name="+row.name
        if(this.folderId){
          url+="&folderId="+this.folderId
        }
        this.$request.post(url).then(res=>{
          if(res.code === '200'){
            this.$message.success('添加成功')
            this.load()
          }else {
            this.$message.error('添加失败')
          }
        })
      }

    },
    load(){
      this.$request.get('/diskFiles/selectAll',{
        params:{
          category:this.category || null,
          folderId:this.folderId || null
        }
      }).then(res=>{
        this.tableData=res.data || []
        this.tableData.forEach(item=>{
          this.$set(item,'optShow',false) // 强制设置每行  加一个 optShow属性
        })
      })

      this.$request.get('/diskFiles/selectFolderName',{
        params:{
          folderId:this.folderId || null
        }
      }).then(res=>{
        if(res.code === '200'){
          this.folders=res.data
        }
      })
    },
    handleAvatarSuccess(res){
      if(res.code==='200'){
        this.$message.success('上传成功')
        this.load()
      }else {
        this.$message.error('上传失败')
      }
    },
    download(url){
      window.open(url)
    },
    handleSelectionChange(rows) {   // 当前选中的所有的行数据
      this.ids = rows.map(v => v.id)   //  [1,2]
    },
  }
}
</script>

<style scoped>

</style>