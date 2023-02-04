<template>
  <div class="data-table">
    <b-table
      :items="items"
      :fields="localFields"
      :bordered="true"
      head-variant="light"
      select-mode="multi"
      ref="selectableTable"
      selectable
      @row-selected="onRowSelected"
      class="mb-0"
    >
      <template #head(id) class="m-select-cell">
        <b-form-checkbox
          class="mr-0"
          :checked="selected.length === items.length"
          :indeterminate="selected.length > 0 && selected.length < items.length"
          @input="toggleCheck"
        ></b-form-checkbox>
      </template>

      <template #cell(id)="{ rowSelected }" class="m-select-cell">
        <template v-if="rowSelected">
          <b-form-checkbox :disabled="true" :checked="true" class="mr-0"></b-form-checkbox>
        </template>
        <template v-else>
          <b-form-checkbox :disabled="true" class="mr-0"></b-form-checkbox>
        </template>
      </template>

      <template #cell(amount)="props">
        <div class="amount" :type="props.item.amount >= 0 ? 'income' : 'expense'">{{ $utils.formatCurrency(props.item.amount) }}</div>
      </template>

      <template #cell(createdAt)="props">
        {{ formatDate(props.item.createdAt) }}
      </template>

      <template #cell(tools)="props">
        <b-dropdown right no-caret variant="none" >
          <template #button-content>
            <i class="icon-options-vertical"></i>
          </template>
          <b-dropdown-item-button @click="$emit('edit', props.item)">Edit</b-dropdown-item-button>
          <b-dropdown-item-button @click="$emit('remove', props.item)">Remove</b-dropdown-item-button>
        </b-dropdown>
      </template>

      <template #custom-foot="data">
        <tr>
          <td v-for="field in data.fields" :key="`tfoot-${field.key}`">
            <div v-if="field.key === 'amount'" class="amount" :type="summaryItems[0].balance >= 0 ? 'income' : 'expense'">{{ $utils.formatCurrency(summaryItems[0].balance) }}</div>
          </td>
        </tr>
      </template>
    </b-table>
    <b-table
      :bordered="true"
      head-variant="light"
      :items="summaryItems"
      v-if="showSummary"
    >
      <template #cell()="props">
        <div class="amount" :type="props.value >= 0 ? 'income' : 'expense'">{{ $utils.formatCurrency(props.value) }}</div>
      </template>
    </b-table>
  </div>
</template>

<script>
import moment from 'moment';

export default {
  props: [
    // data
    'items',
    'fields',

    // display
    'showTools',
    'showSummary'
  ],

  data(){
    return {
      selected: []
    }
  },

  computed: {
    localFields(){
      return [
        { key: 'id', class: "m-select-cell" },
        ...this.fields.map(key => ({
          key,
          sortable: true
        })),
        ...(this.showTools ? [{ key: 'tools', label: '', class: 'm-tools-cell' }] : []),
      ]
    },

    summaryItems(){
      let income = 0;
      let expense = 0;

      const dataset = this.selected && this.selected.length ? this.selected : this.items;

      for (let item of dataset){
        if (item.amount >= 0){
          income += item.amount;
        } else {
          expense += item.amount;
        }
      }

      return [{
        income,
        expense,
        balance: income + expense
      }]
    }
  },

  methods: {
    formatDate(d){
      return moment(d).format('YYYY-MM-DD')
    },

    toggleCheck(value){
      if (value){
        this.$refs.selectableTable.selectAllRows()
      } else {
        this.$refs.selectableTable.clearSelected()
      }
    },

    onRowSelected(items) {
      this.selected = items
    }
  }
}
</script>