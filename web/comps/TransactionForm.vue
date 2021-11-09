<template>
  <div class="transaction-form" v-if="editValue">
    <b-form-group label="Amount">
      <currency-input
        :value="editValue['amount']"
        @input="updateValue('amount', $event)"
      ></currency-input>
    </b-form-group>

    <b-form-group label="Note">
      <b-input
        :value="editValue['note']"
        @input="updateValue('note', $event)"
      ></b-input>
    </b-form-group>

    <b-form-group label="Source">
      <select-or-create
        :value="editValue['source']"
        @input="updateValue('source', $event)"
      ></select-or-create>
    </b-form-group>

    <b-form-group label="Wallet">
      <select-or-create
        :value="editValue['wallet']"
        @input="updateValue('wallet', $event)"
      ></select-or-create>
    </b-form-group>

    <b-form-group label="Category">
      <select-or-create
        :value="editValue['category']"
        @input="updateValue('category', $event)"
      ></select-or-create>
    </b-form-group>
  </div>
</template>

<script>
import CurrencyInput from './CurrencyInput.vue';
import SelectOrCreate from './SelectOrCreate.vue';

export default {
  components: { 
    CurrencyInput,
    SelectOrCreate
  },

  props: [
    'value'
  ],

  data(){
    return {
      editValue: null
    };
  },

  methods: {
    updateValue(fieldName, value){
      this.$set(this.editValue, fieldName, value);
      this.$emit('input', { ...this.editValue });
    },
    initValue(){
      if (this.$utils.isEquals(this.value, this.editValue))
        return;
        
      this.editValue = JSON.parse(JSON.stringify(this.value || {}));
    }
  },

  mounted(){
    this.initValue();
  },

  watch: {
    value: {
      deep: true,
      handler(){
        this.initValue();
      }
    }
  }
}
</script>

<style>

</style>