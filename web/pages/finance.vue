<template>
  <div class="m-container">
    <div class="m-panel">
      <h4>Finance</h4>

      <b-button variant="primary" size="sm" v-b-modal.create-transaction>Create</b-button>

      <b-modal 
        id="create-transaction" 
        title="Add transaction"
        @ok="createTransaction">
        <transaction-form v-model="form"></transaction-form>
      </b-modal>

      <table class="m-table">
        <thead></thead>
        <tbody></tbody>
      </table>
    </div>
  </div>
</template>

<script>
import TransactionForm from '../comps/TransactionForm.vue'
export default {
  components: { TransactionForm },
  
  data(){
    return {
      form: null
    }
  },

  methods: {
    initValue(){
      this.form = {
        amount: 0,
        note: '',
        source: null,
        wallet: null,
        category: null
      }
    },

    createTransaction(){
      console.log(this.form);

      this.initValue();
    }
  },

  mounted(){
    this.initValue();
  }
}
</script>

<style>

</style>