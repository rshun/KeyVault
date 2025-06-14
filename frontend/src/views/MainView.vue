<script setup>
import { ref, defineProps, watch, nextTick, onMounted, computed, defineEmits } from 'vue';

const props = defineProps({
  passwordData: { type: Array, required: true },
  authToken: { type: String, required: true },
  configPassword: { type: String, required: true },
  mainPassword: { type: String, required: true }
});

const emit = defineEmits(['logout']);

const passwordList = ref([]);
const originalPasswordList = ref([]);
const editingCell = ref(null);
const passwordsVisibility = ref({});
const contextMenu = ref({ show: false, x: 0, y: 0, currentItem: null });
const fileInput = ref(null);
const searchQuery = ref('');

const filteredList = computed(() => {
    if (!searchQuery.value) {
        return passwordList.value;
    }
    const lowerCaseQuery = searchQuery.value.toLowerCase();
    return passwordList.value.filter(item => {
        const webName = item.webName || '';
        const webAddr = item.webAddr || '';
        return webName.toLowerCase().includes(lowerCaseQuery) || 
               webAddr.toLowerCase().includes(lowerCaseQuery);
    });
});


const hasAnyChanges = computed(() => {
    if (passwordList.value.some(item => item.isNew)) return true;
    return passwordList.value.some((item) => isRowModified(item));
});

watch(() => props.passwordData, (newData) => {
    passwordList.value = JSON.parse(JSON.stringify(newData));
    originalPasswordList.value = JSON.parse(JSON.stringify(newData));
}, { immediate: true, deep: true });

onMounted(() => {
  window.addEventListener('click', () => { contextMenu.value.show = false; });
});

const fieldsThatAffectPassword = ['webAddr', 'loginName', 'passwordLength', 'allowSpec', 'keyType', 'updateTime'];

// 新增：清空剪贴板的函数
const clearClipboard = () => {
    navigator.clipboard.writeText('').then(() => {
        alert('剪贴板已清空！');
    }).catch(err => {
        console.error('清空剪贴板失败: ', err);
        alert('清空剪贴板失败！您的浏览器可能不支持或权限不足。');
    });
};


// 新增：处理导出逻辑
const handleExportClick = () => {
    if (filteredList.value.length === 0) {
        alert("没有可导出的数据。");
        return;
    }

    const dataToExport = filteredList.value.map(item => ({
        enName: item.webName || "",
        webAddr: item.webAddr || "",
        userID: item.loginName || "",
        updateTime: String(item.updateTime || ""),
        keyLen: item.passwordLength || "",
        allowSpec: item.allowSpec || "",
        keyType: item.keyType || "",
        webIcon: item.webIcon || "",
        Memo: item.Memo || ""
    }));

    const jsonString = JSON.stringify(dataToExport, null, 4);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `keyvault_export_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    alert(`已成功导出 ${dataToExport.length} 条记录。`);
};

const saveAllChanges = async () => {
    const changedItems = passwordList.value.filter((item) => item.isNew || isRowModified(item));
    
    if (changedItems.length === 0) {
        alert("没有需要保存的修改。");
        return;
    }

    try {
        const response = await fetch('http://localhost:3000/api/data/batch-update', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${props.authToken}`
            },
            body: JSON.stringify({ items: changedItems, configPassword: props.configPassword })
        });

        const result = await response.json();
        if (result.success) {
            passwordList.value.forEach(item => {
                if (item.isNew && result.newIdMap[item.id]) {
                    item.id = result.newIdMap[item.id];
                    delete item.isNew;
                }
            });
            originalPasswordList.value = JSON.parse(JSON.stringify(passwordList.value));
            alert(result.message);
        } else {
            alert('批量保存失败: ' + result.message);
        }
    } catch(error) {
        console.error("批量保存时出错:", error);
        alert("批量保存时发生网络错误。");
    }
};

const regeneratePassword = async (item) => {
    try {
        const response = await fetch('http://localhost:3000/api/password/regenerate', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${props.authToken}` },
            body: JSON.stringify({ itemData: item, mainPassword: props.mainPassword })
        });
        const result = await response.json();
        if (result.success) {
            const itemInList = passwordList.value.find(i => i.id === item.id);
            if(itemInList) itemInList.password = result.newPassword;
        } else {
            alert('密码重新生成失败: ' + result.message);
        }
    } catch(error) {
        alert('重新生成密码时发生网络错误。');
    }
};

const stopEditing = (field, item) => {
    editingCell.value = null;
    if (fieldsThatAffectPassword.includes(field)) {
        regeneratePassword(item);
    }
};

const startEditing = async (item, field, event) => {
    editingCell.value = { id: item.id, field };
    await nextTick();
    event.currentTarget.querySelector('input')?.focus();
};

const addNewRow = () => {
    passwordList.value.unshift({
        id: `new_${Date.now()}`, webName: '', webAddr: '', loginName: '',
        passwordLength: '811', allowSpec: 'Y', keyType: '',
        updateTime: 1, Memo: '', webIcon: '', isNew: true
    });
};

const handleImportClick = () => {
    fileInput.value.click();
};

const handleFileImport = (event) => {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
        let importedData;
        try {
            importedData = JSON.parse(e.target.result);
            if (!Array.isArray(importedData)) throw new Error("JSON文件必须包含一个数组。");
        } catch (error) {
            alert("文件格式无效或不是一个有效的JSON文件。错误: " + error.message);
            event.target.value = '';
            return;
        }

        for (let i = 0; i < importedData.length; i++) {
            const record = importedData[i];
            const hasWebName = record.cnName || record.enName;
            const hasWebAddr = record.webAddr;
            const hasUserID = record.userID;
            if (!hasWebName || !hasWebAddr || !hasUserID) {
                alert(`导入失败：第 ${i + 1} 条记录缺少必填字段（网站名称、网址、或登录名）。操作已回滚。`);
                event.target.value = '';
                return;
            }
        }

        if (!confirm(`验证通过。即将导入 ${importedData.length} 条新记录。是否继续？`)) {
             event.target.value = '';
             return;
        }

        const newItems = importedData.map(record => ({
            id: `new_${Date.now()}_${Math.random()}`,
            webName: `${record.enName || ''}${record.cnName || ''}`,
            webAddr: record.webAddr,
            loginName: record.userID,
            passwordLength: record.keyLen || '811',
            allowSpec: record.allowSpec || '',
            keyType: record.keyType || '',
            updateTime: record.updateTime || 1,
            Memo: record.Memo || '',
            webIcon: record.webIcon || '',
            password: '新密码待生成',
            isNew: true
        })).reverse();
        
        passwordList.value.unshift(...newItems);
        
        alert(`成功预加载 ${importedData.length} 条记录。请点击“全部保存”按钮以完成入库。`);
        event.target.value = '';
    };

    reader.onerror = () => {
        alert("读取文件时发生错误。");
        event.target.value = '';
    };

    reader.readAsText(file);
};


const deleteItem = async (item) => {
    const index = passwordList.value.findIndex(i => i.id === item.id);
    if(index === -1) return;

    if (item.isNew) {
        passwordList.value.splice(index, 1);
        return;
    }
    if (confirm(`您确定要删除 "${item.webName}" 这条记录吗？`)) {
        try {
            const response = await fetch(`http://localhost:3000/api/data/${item.id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${props.authToken}` }
            });
            const result = await response.json();
            if (result.success) {
                passwordList.value.splice(index, 1);
                const originalIndex = originalPasswordList.value.findIndex(oItem => oItem.id === item.id);
                if (originalIndex > -1) {
                    originalPasswordList.value.splice(originalIndex, 1);
                }
                alert('记录已删除！');
            } else {
                alert('删除失败: ' + result.message);
            }
        } catch (error) {
            alert("删除记录时发生网络错误。");
        }
    }
};

const onRightClick = (event, item) => {
    event.preventDefault();
    contextMenu.value = { show: true, x: event.clientX, y: event.clientY, currentItem: item };
};

const showPassword = () => {
    if (!contextMenu.value.currentItem) return;
    const currentId = contextMenu.value.currentItem.id;
    passwordsVisibility.value[currentId] = !passwordsVisibility.value[currentId];
    contextMenu.value.show = false;
};

const copyPasswordOnClick = (item) => {
    if (!item) return;
    navigator.clipboard.writeText(item.password).then(() => {
        alert('密码已复制到剪贴板！');
    }).catch(err => alert('复制密码失败！'));
};

const isPasswordVisible = (item) => passwordsVisibility.value[item.id];

const isRowModified = (item) => {
    if (item.isNew) return false;
    const originalItem = originalPasswordList.value.find(p => p.id === item.id);
    if (!originalItem) return false;
    return JSON.stringify(item) !== JSON.stringify(originalItem);
};

const logout = () => {
    if (hasAnyChanges.value) {
        if(confirm("您有未保存的修改，确定要退出吗？所有未保存的修改将会丢失。")) {
            emit('logout');
        }
    } else {
        emit('logout');
    }
}
</script>

<template>
  <div class="main-container">
    <header class="main-header">
      <h1>KeyVault - 密码保险箱</h1>
      <div class="header-controls">
        <input type="text" v-model="searchQuery" placeholder="筛选网站名称或网址..." class="filter-input">
        <button v-if="hasAnyChanges" @click="saveAllChanges" class="header-button save-all-button">全部保存</button>
        <button @click="addNewRow" class="header-button">添加记录</button>
        <button @click="handleImportClick" class="header-button import-button">导入</button>
        <button @click="handleExportClick" class="header-button export-button">导出</button>
        <button @click="clearClipboard" class="header-button clear-clipboard-button">清空剪贴板</button>
        <input type="file" ref="fileInput" @change="handleFileImport" style="display: none" accept=".json">
        <button @click="logout" class="header-button logout-button">退出登录</button>
      </div>
    </header>

    <div class="table-wrapper">
      <table class="password-table">
        <thead>
          <tr>
            <th>图标</th>
            <th>网站名称</th>
            <th>网址</th>
            <th>登录名</th>
            <th class="password-col">密码</th>
            <th>密码长度规则</th>
            <th>特殊字符</th>
            <th>密钥类型</th>
            <th>更新次数</th>
            <th>备注</th>
            <th>操作</th>
          </tr>
        </thead>
        <tbody>
          <tr v-if="filteredList.length === 0">
            <td colspan="11" style="text-align: center;">没有可显示的数据。</td>
          </tr>
          <tr v-for="item in filteredList" :key="item.id">
            <td @click="startEditing(item, 'webIcon', $event)">
               <input class="inline-edit-input" v-if="editingCell?.id === item.id && editingCell?.field === 'webIcon'" v-model="item.webIcon" @blur="stopEditing('webIcon', item)" @keydown.enter.prevent="stopEditing('webIcon', item)"/>
               <img v-else :src="item.webIcon" alt="icon" class="web-icon" onerror="this.style.display='none'">
            </td>
            <!-- 改动：为网站名称添加可滚动包裹层 -->
            <td @click="startEditing(item, 'webName', $event)">
              <input class="inline-edit-input" v-if="editingCell?.id === item.id && editingCell?.field === 'webName'" v-model="item.webName" @blur="stopEditing('webName', item)" @keydown.enter.prevent="stopEditing('webName', item)"/>
              <div v-else class="truncate-cell-wrapper">
                <span>{{ item.webName }}</span>
              </div>
            </td>
            <!-- 改动：为网址添加可滚动包裹层 -->
            <td @click="startEditing(item, 'webAddr', $event)">
              <input class="inline-edit-input" v-if="editingCell?.id === item.id && editingCell?.field === 'webAddr'" v-model="item.webAddr" @blur="stopEditing('webAddr', item)" @keydown.enter.prevent="stopEditing('webAddr', item)"/>
              <div v-else class="truncate-cell-wrapper">
                <a :href="item.webAddr" target="_blank">{{ item.webAddr }}</a>
              </div>
            </td>
            <td @click="startEditing(item, 'loginName', $event)">
               <input class="inline-edit-input" v-if="editingCell?.id === item.id && editingCell?.field === 'loginName'" v-model="item.loginName" @blur="stopEditing('loginName', item)" @keydown.enter.prevent="stopEditing('loginName', item)"/>
              <span v-else>{{ item.loginName }}</span>
            </td>
            <td @click.stop="copyPasswordOnClick(item)" @contextmenu.prevent="onRightClick($event, item)" class="password-cell password-col">
              {{ isPasswordVisible(item) ? item.password : '•••••' }}
            </td>
            <td @click="startEditing(item, 'passwordLength', $event)">
               <input class="inline-edit-input" v-if="editingCell?.id === item.id && editingCell?.field === 'passwordLength'" v-model="item.passwordLength" @blur="stopEditing('passwordLength', item)" @keydown.enter.prevent="stopEditing('passwordLength', item)"/>
              <span v-else>{{ item.passwordLength }}</span>
            </td>
            <td @click="startEditing(item, 'allowSpec', $event)">
               <input class="inline-edit-input" v-if="editingCell?.id === item.id && editingCell?.field === 'allowSpec'" v-model="item.allowSpec" @blur="stopEditing('allowSpec', item)" @keydown.enter.prevent="stopEditing('allowSpec', item)"/>
              <span v-else>{{ item.allowSpec }}</span>
            </td>
             <td @click="startEditing(item, 'keyType', $event)">
               <input class="inline-edit-input" v-if="editingCell?.id === item.id && editingCell?.field === 'keyType'" v-model="item.keyType" @blur="stopEditing('keyType', item)" @keydown.enter.prevent="stopEditing('keyType', item)"/>
              <span v-else>{{ item.keyType }}</span>
            </td>
             <td @click="startEditing(item, 'updateTime', $event)">
               <input class="inline-edit-input" type="number" v-if="editingCell?.id === item.id && editingCell?.field === 'updateTime'" v-model.number="item.updateTime" @blur="stopEditing('updateTime', item)" @keydown.enter.prevent="stopEditing('updateTime', item)"/>
              <span v-else>{{ item.updateTime }}</span>
            </td>
            <td @click="startEditing(item, 'Memo', $event)">
               <input class="inline-edit-input" v-if="editingCell?.id === item.id && editingCell?.field === 'Memo'" v-model="item.Memo" @blur="stopEditing('Memo', item)" @keydown.enter.prevent="stopEditing('Memo', item)"/>
              <span v-else>{{ item.Memo }}</span>
            </td>
            <td>
              <button @click="deleteItem(item)" class="delete-button">删除</button>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
    <div v-if="contextMenu.show" class="context-menu" :style="{ top: `${contextMenu.y}px`, left: `${contextMenu.x}px` }">
      <div class="context-menu-item" @click="showPassword">显示/隐藏密码</div>
    </div>
  </div>
</template>

<style scoped>
.main-container { width: 100%; height: 100vh; background-color: #f4f7f6; font-family: sans-serif; display: flex; flex-direction: column; }
.main-header { background-color: #007aff; color: white; padding: 1rem 2rem; box-shadow: 0 2px 4px rgba(0,0,0,0.1); display: flex; justify-content: space-between; align-items: center; }
.main-header h1 { margin: 0; }
.header-controls { display: flex; align-items: center; }
.filter-input {
    padding: 8px 12px;
    border-radius: 5px;
    border: 1px solid #ddd;
    margin-right: 1rem;
    font-size: 14px;
}
.header-button {
    background-color: #fff;
    color: #007aff;
    border: 1px solid #007aff;
    padding: 8px 15px;
    border-radius: 5px;
    cursor: pointer;
    font-weight: bold;
    transition: all 0.2s ease-in-out;
    margin-left: 1rem;
}
.header-button:hover { background-color: #e2f0ff; }
.save-all-button {
    background-color: #28a745;
    color: white;
    border-color: #28a745;
}
.save-all-button:hover {
    background-color: #218838;
}
.logout-button {
    background-color: #dc3545;
    color: white;
    border-color: #dc3545;
}
.logout-button:hover {
    background-color: #c82333;
}
.clear-clipboard-button {
    background-color: #ffc107;
    color: #212529;
    border-color: #ffc107;
}
.clear-clipboard-button:hover {
    background-color: #e0a800;
}


.table-wrapper { flex-grow: 1; padding: 2rem; overflow: auto; }
.password-table { width: 100%; border-collapse: collapse; background-color: white; box-shadow: 0 1px 3px rgba(0,0,0,0.12), 0 1px 2px rgba(0,0,0,0.24); }
th, td { border: 1px solid #ddd; padding: 12px; text-align: left; vertical-align: middle; }
/* 改动：移除了td的white-space: nowrap，让内容可以被包裹层控制 */
th { background-color: #e9ecef; font-weight: 600; position: sticky; top: 0; white-space: nowrap; }
tbody tr:nth-child(even) { background-color: #f9f9f9; }
tbody tr:hover { background-color: #e2f0ff; }

/* 新增：可滚动单元格的包裹层样式 */
.truncate-cell-wrapper {
    max-width: 250px; /* 您可以根据需要调整这个最大宽度 */
    overflow-x: auto;
    white-space: nowrap;
    -ms-overflow-style: none;  /* IE and Edge */
    scrollbar-width: none;  /* Firefox */
}
.truncate-cell-wrapper::-webkit-scrollbar {
    display: none; /* Chrome, Safari, Opera */
}


.web-icon { width: 24px; height: 24px; vertical-align: middle; }
.password-cell { cursor: pointer; user-select: none; white-space: nowrap; }
.password-col { width: 150px; max-width: 150px; overflow: hidden; text-overflow: ellipsis; }
a { color: #007aff; text-decoration: none; }
a:hover { text-decoration: underline; }
.context-menu { position: fixed; background-color: white; border: 1px solid #ccc; box-shadow: 0 2px 10px rgba(0,0,0,0.2); border-radius: 5px; min-width: 150px; z-index: 1000; padding: 5px 0; }
.context-menu-item { padding: 8px 15px; cursor: pointer; }
.context-menu-item:hover { background-color: #007aff; color: white; }
.inline-edit-input { width: 100%; padding: 5px; border: 1px solid #007aff; border-radius: 3px; box-sizing: border-box; }
.delete-button { border: none; padding: 5px 10px; border-radius: 4px; cursor: pointer; transition: background-color 0.2s; background-color: #dc3545; color: white; margin-left: 5px; }
.delete-button:hover { background-color: #c82333; }
</style>
