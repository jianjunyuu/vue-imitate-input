<script lang="ts">
import {
  type PropType,
  computed,
  defineComponent,
  nextTick, ref,
  watch,
} from 'vue-demi'

export default defineComponent({
  name: 'ImitateInput',
  props: {
    value: {
      type: Number,
      default: 0,
    },
    max: {
      type: Number,
      default: 100,
    },
    min: {
      type: Number,
      default: 0,
    },
    step: {
      type: Number,
      default: 1,
    },
    // 数值精度
    precision: {
      type: Number,
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    textAlign: {
      type: String as PropType<'left' | 'right' | 'center'>,
      default: 'left',
    },
    controls: {
      type: Boolean,
      default: true,
    },
    unit: {
      type: String,
    },
  },
  emits: ['input', 'change', 'update:value'],
  setup(props, { emit }) {
    const isFocus = ref(false)
    const maxDisabled = computed(() => {
      // return _increase(props.value, props.step) > props.max
      return props.value >= props.max
    })
    const minDisabled = computed(() => {
      // return _decrease(props.value, props.step) < props.min
      return props.value <= props.min
    })
    const numPrecision = computed(() => {
      const { value, step, precision } = props
      const stepPrecision = getPrecision(step)
      if (precision !== undefined) {
        if (stepPrecision > precision) {
          console.warn(
            '[VueImitateInput]precision should not be less than the decimal places of step',
          )
        }
        return precision
      }
      return Math.max(getPrecision(value), stepPrecision)
    })
    const wrapperStyle = computed(() => {
      const cw = props.controls ? 23 : 0
      return {
        'justify-content': props.textAlign,
        'width': `calc(100% - ${cw}px)`,
      }
    })
    let currentValue = props.value
    const contentRef = ref<HTMLElement>()

    watch(
      () => props.value,
      () => {
        reset()
      },
      { immediate: true },
    )

    function reset() {
      currentValue = props.value
      nextTick(() => {
        if (contentRef.value) {
          const val = toPrecision(props.value, numPrecision.value)
          contentRef.value.innerText = String(val)
        }
      })
    }

    function handleInputChange(value: string) {
      const newVal = value === '' ? NaN : Number(value)
      if (isNaN(newVal))
        reset()

      setCurrentValue(isNaN(newVal) ? currentValue : newVal)
    }
    function setCurrentValue(newVal: number) {
      const oldVal = currentValue
      if (typeof newVal === 'number' && props.precision !== undefined)
        newVal = toPrecision(newVal, props.precision)

      if (newVal > props.max)
        newVal = props.max
      if (newVal < props.min)
        newVal = props.min
      reset()
      if (oldVal === newVal)
        return
      emit('update:value', newVal)
      emit('input', newVal)
      emit('change', newVal, oldVal)
    }

    function handleFocusin() {
      isFocus.value = true
    }
    // event: FocusEvent
    function handleFocusout() {
      isFocus.value = false
      handleInputChange(contentRef.value?.innerText ?? '')
    }

    function handleBoxClick() {
      nextTick(() => {
        if (contentRef.value) {
          contentRef.value.focus()
          const selection = getSelection()
          const range = selection?.getRangeAt(0)

          range?.setStart(range!.startContainer, String(props.value).length)
          // 光标开始和光标结束重叠
          range?.collapse(true)
          // 清除选定对象的所有光标对象
          selection?.removeAllRanges()
          // 插入新的光标对象
          selection?.addRange(range!)
          // contentRef.value.selectionEnd = contentRef.value.innerText.length
        }
      })
    }

    function increase() {
      if (props.disabled || maxDisabled.value)
        return

      const value = props.value || 0
      const newVal = _increase(value, props.step)
      setCurrentValue(newVal)
    }
    function decrease() {
      if (props.disabled || minDisabled.value)
        return

      const value = props.value || 0
      const newVal = _decrease(value, props.step)
      setCurrentValue(newVal)
    }

    function _increase(val: number, step: number) {
      if (typeof val !== 'number' && val !== undefined)
        return currentValue
      const precisionFactor = 10 ** numPrecision.value
      // Solve the accuracy problem of JS decimal calculation by converting the value to integer.
      return toPrecision(
        (precisionFactor * val + precisionFactor * step) / precisionFactor,
      )
    }
    function _decrease(val: number, step: number) {
      if (typeof val !== 'number' && val !== undefined)
        return currentValue
      const precisionFactor = 10 ** numPrecision.value
      return toPrecision(
        (precisionFactor * val - precisionFactor * step) / precisionFactor,
      )
    }

    function getPrecision(value: number) {
      if (value === undefined)
        return 0
      const valueString = value.toString()
      const dotPosition = valueString.indexOf('.')
      let precision = 0
      if (dotPosition !== -1)
        precision = valueString.length - dotPosition - 1

      return precision
    }

    function toPrecision(num: number, precision?: number) {
      if (precision === undefined)
        precision = numPrecision.value

      const base = 10 ** precision
      return parseFloat(String(Math.floor(num * base) / base))
    }
    return {
      wrapperStyle,
      maxDisabled,
      minDisabled,
      isFocus,
      contentRef,
      handleInputChange,
      handleFocusin,
      handleFocusout,
      handleBoxClick,
      increase,
      decrease,
    }
  },
})
</script>

<template>
  <div
    class="number-input"
    :class="{ 'is-focus': isFocus, 'is-disabled': disabled }"
    @click="handleBoxClick"
  >
    <div class="wrapper" :style="wrapperStyle">
      <div class="input-box">
        <div
          ref="contentRef"
          class="input"
          :contenteditable="!disabled"
          @keydown.enter.prevent
          @keydown.up.prevent="increase"
          @keydown.down.prevent="decrease"
          @focusin="handleFocusin"
          @focusout="handleFocusout"
          @click.stop
        />
        <slot name="suffix">
          <span class="unit">{{ unit }}</span>
        </slot>
      </div>
    </div>
    <span
      v-if="controls"
      :class="{ 'is-disabled': maxDisabled }"
      class="controls increase"
      role="button"
      @click.stop="increase"
      @keydown.enter.stop="increase"
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14"><g id="_01_align_center" data-name="01 align center"><path d="M17.293,15.207,12,9.914,6.707,15.207,5.293,13.793,10.586,8.5a2,2,0,0,1,2.828,0l5.293,5.293Z" /></g></svg>
    </span>

    <span
      v-if="controls"
      :class="{ 'is-disabled': minDisabled }"
      class="controls decrease"
      role="button"
      @click.stop="decrease"
      @keydown.enter.stop="decrease"
    >
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14"><g id="_01_align_center" data-name="01 align center"><path d="M12,15.5a1.993,1.993,0,0,1-1.414-.585L5.293,9.621,6.707,8.207,12,13.5l5.293-5.293,1.414,1.414-5.293,5.293A1.993,1.993,0,0,1,12,15.5Z" /></g></svg>
    </span>
  </div>
</template>

  <style lang="scss" scoped>
  $--color-primary: #FAC415;
  $--color-text-primary: #333;
  $--color-text-regular: #666;
  $--color-text-secondary: #999;
  $--color-text-placeholder: #999;
  $left: 8px;
  .number-input {
    font-size: 14px;
    width: 100%;
    position: relative;
    line-height: 26px;
    display: flex;
    cursor: text;
    border-radius: 4px;
    border: 1px solid #dcdfe6;
    outline: none;
    transition: border-color 0.2s cubic-bezier(0.645, 0.045, 0.355, 1);
    color: $--color-text-regular;
    box-sizing: border-box;

    &.is-disabled {
      opacity: 0.5;
      cursor: not-allowed;

      .controls {
        color: #c0c4cc;
        cursor: not-allowed;
      }
    }

    .wrapper {
      width: 100%;
      display: flex;
      padding: 0 $left;
      box-sizing: border-box;
    }

    .input-box {
      overflow: hidden;
      position: relative;
      white-space: nowrap;
    }
    .input {
      display: inline-block;
      min-width: 1px;
      white-space: nowrap;
      outline: none;
    }
    .unit {
      color: $--color-text-placeholder;
      margin-left: -0px;
    }

    .controls {
      box-sizing: content-box;
      position: absolute;
      z-index: 1;
      right: 1px;
      width: 21px;
      text-align: center;
      background: #f5f7fa;
      color: #666;
      cursor: pointer;
      font-size: 13px;
      line-height: 1;
      border-left: 1px solid #dcdfe6;
      overflow: hidden;

      &.is-disabled {
        color: #c0c4cc;
        cursor: not-allowed;
      }

      svg {
        transform: scale(0.8);
        line-height: 1;
        transition: color 0.2s cubic-bezier(0.645, 0.045, 0.355, 1);
      }

      &.increase {
        top: 0px;
        height: 12px;
        border-bottom: 1px solid #dcdfe6;
      }

      &.decrease {
        height: 13px;
        line-height: 1;
        bottom: 0px;
      }
    }
    &:not(.is-disabled) {
      &:hover,
      &.is-focus {
        border: 1px solid $--color-primary;
        color: $--color-text-primary;
      }

      .controls:hover i {
        color: $--color-primary;
      }
    }
  }
  </style>
