<template>
  <div class="finance m-container">
    <div class="row">
      <div class="col col-4" v-for="name in ['sources', 'wallets', 'categories']" :key="`summary-${name}`">
        <div class="m-panel">
          <h4>{{ name[0].toUpperCase() + name.slice(1) }}</h4>

          <data-table
            :items="name === 'sources' ? sources : (name === 'wallets' ? wallets : categories)"
            :fields="['name', 'amount']"
          ></data-table>
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

      <!-- info -->
      <data-table
        class="mt-3"
        :items="data"
        :fields="['note', 'amount', 'source', 'wallet', 'category', 'createdAt']"
        :showTools="true"
        @edit="showEditTransaction"
        @remove="removeTransaction"
        :showSummary="true"
      ></data-table>
      <!-- end info -->
    </div>
  </div>
</template>

<script>
import TransactionForm from '../comps/TransactionForm.vue';
import DataTable from '../comps/DataTable.vue';

export default {
  components: { 
    TransactionForm,
    DataTable
  },
  
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

