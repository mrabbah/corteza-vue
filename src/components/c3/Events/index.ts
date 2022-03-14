// import onClick from './C3Click.vue'
// import { Component } from 'vue'
import _ from 'lodash'

interface Handler {
  value (props: object): unknown;
  update (props: object, value: unknown): void;
}

interface Props {
  [_: string]: unknown;
}

interface Events {
  type: string;
  target: string;
  // values: {};
}

interface Control extends Handler {
  props?: Props;
  events?: Events;
}

interface Control extends Handler {
  props?: Props;
}

interface Specs {
  handler: string | Handler;
  props?: Props;
}

function makeHandler (prop: string): Handler {
  const path = prop.split('.')
  return {
    value: (props: Props): unknown => _.get(props, path),
    update: (props: Props, value: unknown): void => { _.set(props, path, value) },
  }
}

export function generic ({ handler, props }: Specs): Control {
  if (typeof handler === 'string') {
    handler = makeHandler(handler)
  }

  return {
    props,
    ...handler,
  }
}

export function checkbox (label: string, handler: string | Handler): Control {
  return generic({ handler, props: { label } })
}
