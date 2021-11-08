<template>
  <b-form-input
    class="currency-input"
    :transaction-type="isNegative ? 'expense' : 'income'"
    :formatter="formatter"
    :value="localValue"
    @input="updateValue"
  />
</template>

<script>
export default {
  props: [
    'value'
  ],

  data(){
    return {
      localValue: this.$utils.formatCurrency(0),
      isNegative: false
    }
  },

  methods: {
    initValue(){
      const formattedValue = this.$utils.formatCurrency(this.value);
      if (this.localValue === formattedValue)
        return;

      this.localValue = formattedValue;
    },

    formatter(newValue) {
      const countNegative = newValue.match(/-/g);
      this.isNegative = countNegative && countNegative.length % 2 !== 0;

      const amount = (this.isNegative ? '-' : '') + newValue.replace(/[^0-9\,]+/gm, '').replace(/\,/gm, '.');
      return this.$utils.formatCurrency(amount);
    },

    updateValue(newValue){
      this.localValue = newValue;
      const amount = newValue.replace(/[^0-9-\,]+/gm, '').replace(/\,/gm, '.');
      this.$emit('input', parseInt(amount));
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

<style lang="scss">
.currency-input {
  font-weight: bold;
}

.currency-input[transaction-type="income"] {
  color: var(--green);
}

.currency-input[transaction-type="expense"] {
  color: var(--red);
}
</style>