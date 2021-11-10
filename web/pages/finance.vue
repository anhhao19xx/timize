<template>
  <div class="finance m-container">
    <div class="m-panel">
      <h4>Finance</h4>

      <!-- toolbar -->
      <b-button variant="primary" size="sm" v-b-modal.create-transaction>Create</b-button>
      <b-modal 
        id="create-transaction" 
        title="Add transaction"
        @ok="createTransaction">
        <transaction-form v-model="form"></transaction-form>
      </b-modal>
      <!-- end toolbar -->

      <!-- summary -->
      <div class="summary mt-3 row">
        <div class="col"><label>Income: </label> <span class="amount" type="income">{{ $utils.formatCurrency(totals.income) }}</span></div>
        <div class="col"><label>Expense: </label> <span class="amount" type="expense">{{ $utils.formatCurrency(totals.expense) }}</span></div>
      </div>
      <!-- end summary-->

      <!-- info -->
      <table class="m-table mt-3">
        <thead>
          <th class="m-select-cell"></th>
          <th>Amount</th>
          <th>Note</th>
          <th>Category</th>
          <th>Source</th>
          <th>Wallet</th>
          <th class="m-tools-cell"></th>
        </thead>
        <tbody>
          <tr v-for="doc in data" :key="`tbody-${doc.id}`">
            <!-- select -->
            <td class="m-select-cell">
              <b-form-checkbox :value="doc._id" class="mr-0"></b-form-checkbox>
            </td>
            <!-- end select -->
            
            <!-- content -->
            <td class="amount" :type="doc.amount >= 0 ? 'income' : 'expense'">{{ $utils.formatCurrency(doc.amount) }}</td>
            <td>{{ doc.note }}</td>
            <td>{{ doc.category }}</td>
            <td>{{ doc.source }}</td>
            <td>{{ doc.wallet }}</td>
            <!-- end content -->

            <!-- tool -->
            <td class="m-tools-cell">
              <b-dropdown right no-caret variant="none" >
                <template #button-content>
                  <i class="icon-options-vertical"></i>
                </template>
                <b-dropdown-item>Edit</b-dropdown-item>
                <b-dropdown-item>Remove</b-dropdown-item>
              </b-dropdown>
            </td>
            <!-- end tool -->
          </tr>
        </tbody>
      </table>
      <!-- end info -->
    </div>
  </div>
</template>

<script>
import TransactionForm from '../comps/TransactionForm.vue'
export default {
  components: { TransactionForm },
  
  data(){
    return {
      form: null,
      data: []
    }
  },

  computed: {
    totals(){
      let income = 0;
      let expense = 0;

      for (let item of this.data){
        if (item.amount >= 0){
          income += item.amount;
        } else {
          expense += item.amount;
        }
      }

      return {
        income,
        expense
      }
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

    async createTransaction(){
      const createdAt = new Date();

      await this.$db.create('transactions', {
        ...this.form,
        createdAt: createdAt.toString(),
        updatedAt: createdAt.toString()
      });

      this.initValue();
      this.load();
    },

    async load(){
      const query = { $limit: -1 };
      this.data = await this.$db.list('transactions', query);
      
      this.preprocess();
    }
  },

  mounted(){
    this.initValue();
    this.load();
  }
}
</script>

<style lang="scss">
.finance .amount {
  font-weight: bold;
}

.finance .amount[type="income"] {
  color: var(--green);
}

.finance .amount[type="expense"] {
  color: var(--red);
}
</style>
</style>