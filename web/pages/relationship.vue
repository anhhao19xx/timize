<template>
  <div class="relationship" ref="container">
    <D3Network :net-nodes="nodes" :net-links="links" :options="options" />
  </div>
</template>

<script>
import D3Network from 'vue-d3-network';

export default {
  components: { D3Network },

  data(){
    return {
      data: null,
      options: {
        nodeLabels: true,
        nodeSize: 10,
        force: 3000
      }
    }
  },

  computed: {
    nodes(){
      if (!this.data)
        return [];

      const centerX = this.$refs.container.offsetWidth/2;
      const centerY = this.$refs.container.offsetHeight/2;

      return this.data.map(piece => ({
        id: piece.id,
        name: piece.id === 1 ? 'Top' : piece.title,
        pinned: piece.id === 1,
        fx: piece.id === 1 ? centerX : null,
        fy: piece.id === 1 ? centerY : null,
        _color: piece.id === 1 ? '#D81B60' : null
      }));
    },

    links(){
      if (!this.data)
        return [];

      const links = [];
      for (let piece of this.data){
        if (!piece.links)
          continue;

        for (let link of piece.links)
          links.push({
            sid: piece.id,
            tid: link,
            _color: '#969696'
          });
      }

      return links;
    }
  },

  async mounted(){
    this.data = await this.$db.list('pieces', { $limit: -1 });
  }
}
</script>