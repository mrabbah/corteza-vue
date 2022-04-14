// import onClick from './C3Click.vue'
// import { Component } from 'vue'
import _ from 'lodash'

interface Props {
  [_: string]: unknown;
}

interface Events {
  target: string;
  value: string;
}

interface Control {
  props?: Props;
  events?: Events;
}

// function makeHandler (prop: string): Handler {
//   const path = prop.split('.')
//   return {
//     value: (props: Props): unknown => _.get(props, path),
//     update: (props: Props, value: unknown): void => { _.set(props, path, value) },
//   }
// }

// export function generic ({ handler, props }: Specs): Control {
//   if (typeof handler === 'string') {
//     handler = makeHandler(handler)
//   }

//   return {
//     props,
//     ...handler,
//   }
// }

export function click (target: string, value?: string) {
  return { target, value }
}
