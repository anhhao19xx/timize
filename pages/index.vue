<template>
  <div>
    <div>
      <input type="file" @change="importFromFile">
      <button @click="exportToFile">Export</button>
    </div>

    <div v-for="piece in data" :key="piece.id">
      <button @click="selectPiece(piece)">{{ piece.title }}</button>
      <button>Remove</button>
    </div>

    <input type="text" v-model="newPiece.title" @keyup.enter="addPiece">

    <div v-if="currentPiece">
      <input type="text" v-model="currentPiece.title" @change="save()">
      <textarea v-model="currentPiece.content" @change="save()"></textarea>
    </div>
  </div>
</template>

<script>
import { nanoid } from 'nanoid';
import moment from 'moment';

function download(filename, text) {
  var element = document.createElement('a');
  element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
  element.setAttribute('download', filename);

  element.style.display = 'none';
  document.body.appendChild(element);

  element.click();

  document.body.removeChild(element);
}

export default {
  data(){
    return {
      newPiece: {
        title: ''
      },

      currentPiece: null,

      data: []
    }
  },


  mounted(){
    const rawData = localStorage.getItem('timize-data');

    if (rawData)
      this.data = JSON.parse(rawData);
    else
      this.data = [];
  },

  methods: {
    save(){
      localStorage.setItem('timize-data', JSON.stringify(this.data));
    },

    async importFromFile(event){
      const file = event.target.files[0];

      const rawData = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = function(){ resolve(reader.result) }
        reader.readAsText(file);
      });

      this.data = JSON.parse(rawData);
      this.save();
    },

    exportToFile(){
      download(`timize - ${moment().format('YYYYMMDD HHmmss')}.json`, JSON.stringify(this.data));
    },

    addPiece(){
      this.data.push({
        id: nanoid(),
        title: this.newPiece.title,
        content: '',
        createdAt: new Date()
      });

      this.newPiece.title = '';

      this.save();
    },

    selectPiece(piece){
      this.currentPiece = piece;
    }
  }
}
</script>