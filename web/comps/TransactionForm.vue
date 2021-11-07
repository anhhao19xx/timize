<template>
  <div class="transaction-form" v-if="editValue">
    <b-form-group label="Amount">
      <b-input
        :value="editValue['amount']"
        @input="updateValue('amount', $event)"
        type="number"
      ></b-input>
    </b-form-group>

    <b-form-group label="Note">
      <b-input
        :value="editValue['note']"
        @input="updateValue('note', $event)"
      ></b-input>
    </b-form-group>

    <b-form-group label="Source">
      <b-input
        :value="editValue['source']"
        @input="updateValue('source', $event)"
      ></b-input>
    </b-form-group>

    <b-form-group label="Wallet">
      <b-input
        :value="editValue['wallet']"
        @input="updateValue('wallet', $event)"
      ></b-input>
    </b-form-group>

    <b-form-group label="Category">
      <b-input
        :value="editValue['category']"
        @input="updateValue('category', $event)"
      ></b-input>
    </b-form-group>
  </div>
</template>

<script>
export default {
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