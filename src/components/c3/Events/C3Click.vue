<template>
 <div>
    <b-form-group>
      <label>
        Type of event:
      </label>
      <b-form-input
        v-model="type"
        plaintext
        disabled
      />
    </b-form-group>
    <b-form-group>
      <label>
        Emitted value:
      </label>
      <b-form-input
        v-model="value"
        plaintext
        disabled
      />
    </b-form-group>
    <b-form-group>
      <label>
        Target:
      </label>
      <b-form-input
        v-model="target"
        plaintext
        disabled
      />
    </b-form-group>
 </div>
</template>
<script>
export default {
  props: {
    target: {
      type: String,
      default: '',
    },
    // emitted value
    value: {
      type: String,
      default: '',
    },
  },

  data () {
    return {
      type: 'onClick',
    }
  }
}
</script>
