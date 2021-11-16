<template>
  <div class="data-table">
    <b-table
      :items="items"
      :fields="localFields"
    >
      <template #cell(id)="props">
        <b-form-checkbox :value="props.item._id" class="mr-0"></b-form-checkbox>
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
    'showTools'
  ],

  computed: {
    localFields(){
      return [
        { key: 'id' },
        ...this.fields.map(key => ({
          key,
          sortable: true
        })),
        ...(this.showTools ? [{ key: 'tools' }] : []),
      ]
    }
  },

  methods: {
    formatDate(d){
      return moment(d).format('YYYY-MM-DD')
    }
  }
}
</script>

<style>

</style>