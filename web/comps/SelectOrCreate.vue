<template>
  <div class="select-or-create">
    <model-select
      v-model="item"
      :options="localOptions"
      @keyup.native="autoValue"
      @input="selectValue"
    ></model-select>
  </div>
</template>

<script>
import { ModelSelect } from 'vue-search-select'
import 'vue-search-select/dist/VueSearchSelect.css'

export default {
  props: [
    'value',
    'options'
  ],

  data(){
    return {
      item: {
        text: '',
        value: ''
      },
      newValue: null,
      createdOption: null
    }
  },
  
  components: {
    ModelSelect
  },

  computed: {
    localOptions(){
      let isExisted = false;
      const options = [];
      for (let value of this.options || []){
        if (this.newValue && this.newValue.value === value)
          isExisted = true;

        options.push({
          text: value,
          value
        });
      }

      if (this.createdOption)
        options.unshift(this.createdOption);

      if (this.newValue && !isExisted)
        options.unshift(this.newValue);

      return options;
    }
  },

  methods: {
    autoValue(event){
      const newValue = event.target.value;

      if (!newValue)
        this.newValue = null;
      else
        this.newValue = {
          text: `Create "${newValue}"`,
          value: newValue
        }
    },

    selectValue(selectValue){
      if (this.newValue && this.newValue.value === selectValue.value){
        this.createdOption = {
          text: this.newValue.value,
          value: this.newValue.value
        };
        this.item = this.createdOption;
        this.newValue = null;
      }

      this.$emit('input', this.item.value);
    },

    initValue(){
      if (this.value === this.item.value)
        return;

      this.item = {
        text: this.value,
        value: this.value
      }
    }
  },

  mounted(){
    this.initValue();
  },

  watch: {
    value(){
      this.initValue();
    }
  }
}
</script>
