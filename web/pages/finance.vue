<template>
  <div class="finance m-container">
    <div class="row">
      <div class="col col-4">
        <div class="m-panel">
          <h4>Sources</h4>

          <table class="m-table">
            <thead>
              <th>Name</th>
              <th>Amount</th>
            </thead>
            <tbody>
              <tr v-for="source in sources" :key="`source-tbody-${source.name}`">
                <td>{{ source.name }}</td>
                <td class="amount" :type="source.amount >= 0 ? 'income' : 'expense'">{{ $utils.formatCurrency(source.amount) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="col col-4">
        <div class="m-panel">
          <h4>Wallets</h4>

          <table class="m-table">
            <thead>
              <th>Name</th>
              <th>Amount</th>
            </thead>
            <tbody>
              <tr v-for="wallet in wallets" :key="`wallet-tbody-${wallet.name}`">
                <td>{{ wallet.name }}</td>
                <td class="amount" :type="wallet.amount >= 0 ? 'income' : 'expense'">{{ $utils.formatCurrency(wallet.amount) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div class="col col-4">
        <div class="m-panel">
          <h4>Categories</h4>

          <table class="m-table">
            <thead>
              <th>Name</th>
              <th>Amount</th>
            </thead>
            <tbody>
              <tr v-for="category in categories" :key="`category-tbody-${category.name}`">
                <td>{{ category.name }}</td>
                <td class="amount" :type="category.amount >= 0 ? 'income' : 'expense'">{{ $utils.formatCurrency(category.amount) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <div class="m-panel mt-3">
      <h4>Transactions</h4>

      <!-- toolbar -->
      <b-button variant="primary" size="sm" v-b-modal.create-transaction>Create</b-button>
      <b-modal 
        id="create-transaction" 
        title="Add transaction"
        @ok="createTransaction">
        <transaction-form
          v-model="form"
          :sources="sources.map(item => item.name)"
          :wallets="wallets.map(item => item.name)"
          :categories="categories.map(item => item.name)"
        ></transaction-form>
      </b-modal>
      <b-modal 
        id="edit-transaction" 
        title="Edit transaction"
        @ok="editTransaction">
        <transaction-form
          v-model="form"
          :sources="sources.map(item => item.name)"
          :wallets="wallets.map(item => item.name)"
          :categories="categories.map(item => item.name)"
        ></transaction-form>
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
          <tr v-for="doc in data" :key="`transaction-tbody-${doc.id}`">
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
                <b-dropdown-item-button @click="showEditTransaction(doc)">Edit</b-dropdown-item-button>
                <b-dropdown-item-button @click="removeTransaction(doc)">Remove</b-dropdown-item-button>
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
      data: [],

      sources: [],
      categories: [],
      wallets: []
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

    async editTransaction(){
      const id = this.form.id;
      delete this.form.id;
      delete this.form.createdAt;
      delete this.form.updatedAt;

      await this.$db.update('transactions', id, { 
        ...this.form,
        updatedAt: (new Date()).toString()
      });

      this.initValue();
      this.load();
    },

    preprocess(){
      this.sources = [];
      this.categories = [];
      this.wallets = [];

      const sources = {};
      const categories = {};
      const wallets = {};

      for (let item of this.data){
        if (!sources[item.source])
          sources[item.source] = 0;

        if (!wallets[item.wallet])
          wallets[item.wallet] = 0;

        if (!categories[item.category])
          categories[item.category] = 0;


        sources[item.source] += item.amount;
        wallets[item.wallet] += item.amount;
        categories[item.category] += item.amount;
      }

      for (let name in sources){
        this.sources.push({
          name,
          amount: sources[name]
        });
      }

      for (let name in wallets){
        this.wallets.push({
          name,
          amount: wallets[name]
        });
      }

      for (let name in categories){
        this.categories.push({
          name,
          amount: categories[name]
        });
      }
    },

    async load(){
      const query = { $limit: -1 };
      this.data = await this.$db.list('transactions', query);
      this.data.reverse();
      
      this.preprocess();
    },

    showEditTransaction(doc){
      this.form = doc;
      this.$bvModal.show('edit-transaction');
    },

    async removeTransaction(doc){
      const isConfirmed = await this.$bvModal.msgBoxConfirm("Do you want to remove?");
      if (!isConfirmed)
        return;

      await this.$db.remove('transactions', doc.id);
      this.load();
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
  text-align: right;
}

.finance .amount[type="income"] {
  color: var(--green);
}

.finance .amount[type="expense"] {
  color: var(--red);
}
</style>
</style>